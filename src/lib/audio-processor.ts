import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
import { logger } from './logger';
import type { AudioFormat } from './validations';

export interface ProcessingOptions {
  convertTo?: AudioFormat;
  trimStart?: number; // seconds
  trimEnd?: number; // seconds (cut this many seconds from end)
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  normalize?: boolean;
  speed?: number; // 0.5 - 2.0
  amplify?: number; // multiplier
}

export interface ProcessingResult {
  outputPath: string;
  outputBuffer?: Buffer;
  mimeType: string;
  size: number;
  duration?: number;
}

const FFMPEG_PATHS = ['ffmpeg', '/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'];

async function findFfmpeg(): Promise<string | null> {
  for (const p of FFMPEG_PATHS) {
    try {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(p, ['-version']);
        proc.on('error', reject);
        proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('not ffmpeg'))));
      });
      return p;
    } catch {
      // try next
    }
  }
  return null;
}

let cachedFfmpegPath: string | null | undefined;

async function getFfmpegPath(): Promise<string | null> {
  if (cachedFfmpegPath !== undefined) return cachedFfmpegPath;
  cachedFfmpegPath = await findFfmpeg();
  return cachedFfmpegPath;
}

const FORMAT_MIMES: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
};

const FORMAT_CODECS: Record<AudioFormat, string[]> = {
  mp3: ['-codec:a', 'libmp3lame', '-q:a', '2'],
  wav: ['-codec:a', 'pcm_s16le'],
  ogg: ['-codec:a', 'libvorbis', '-q:a', '5'],
  aac: ['-codec:a', 'aac', '-b:a', '192k'],
  flac: ['-codec:a', 'flac'],
};

function buildFilterChain(options: ProcessingOptions): string[] {
  const filters: string[] = [];

  if (options.trimStart && options.trimStart > 0) {
    filters.push(`atrim=start=${options.trimStart}`);
  }
  if (options.trimEnd && options.trimEnd > 0) {
    filters.push(`atrim=end=-${options.trimEnd}`);
  }
  if (options.speed && options.speed !== 1) {
    filters.push(`atempo=${options.speed}`);
  }
  if (options.amplify && options.amplify !== 1) {
    filters.push(`volume=${options.amplify}`);
  }
  if (options.normalize) {
    filters.push('loudnorm');
  }
  if (options.fadeIn && options.fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${options.fadeIn}`);
  }
  if (options.fadeOut && options.fadeOut > 0) {
    filters.push(`afade=t=out:st=-${options.fadeOut}:d=${options.fadeOut}`);
  }

  return filters;
}

export async function processAudio(
  inputBuffer: Buffer,
  originalFilename: string,
  options: ProcessingOptions,
  onProgress?: (percent: number) => void
): Promise<ProcessingResult> {
  const ffmpeg = await getFfmpegPath();
  const outputFormat: AudioFormat = options.convertTo || 'mp3';
  const tmpId = uuid();
  const tmpDir = os.tmpdir();
  const inputExt = path.extname(originalFilename) || '.bin';
  const inputPath = path.join(tmpDir, `audioforge-in-${tmpId}${inputExt}`);
  const outputPath = path.join(tmpDir, `audioforge-out-${tmpId}.${outputFormat}`);

  await fs.writeFile(inputPath, inputBuffer);

  if (!ffmpeg) {
    logger.warn('ffmpeg not found on system; falling back to passthrough (no transformation applied)');
    // Fallback: just copy as-is, but rename to requested format
    await fs.copyFile(inputPath, outputPath);
    const stat = await fs.stat(outputPath);
    onProgress?.(100);
    return {
      outputPath,
      mimeType: FORMAT_MIMES[outputFormat],
      size: stat.size,
    };
  }

  const filterChain = buildFilterChain(options);
  const args: string[] = ['-y', '-i', inputPath];

  if (filterChain.length > 0) {
    args.push('-filter:a', filterChain.join(','));
  }

  // Re-encode to target format
  args.push(...FORMAT_CODECS[outputFormat]);
  args.push(outputPath);

  onProgress?.(10);

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpeg, args);
    let stderr = '';
    let lastReported = 10;

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      // Parse "time=00:00:12.34" from ffmpeg output for progress
      const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseFloat(timeMatch[3]);
        const currentSec = hours * 3600 + minutes * 60 + seconds;
        // rough estimate: 90% goes to processing
        const estimated = Math.min(90, Math.floor(currentSec * 2));
        if (estimated > lastReported) {
          lastReported = estimated;
          onProgress?.(estimated);
        }
      }
    });

    proc.on('error', (err) => {
      cleanup([inputPath, outputPath]).catch(() => {});
      reject(err);
    });

    proc.on('close', async (code) => {
      if (code !== 0) {
        await cleanup([inputPath, outputPath]).catch(() => {});
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
        return;
      }

      try {
        const stat = await fs.stat(outputPath);
        onProgress?.(95);

        // Probe duration with ffprobe-like read (use ffmpeg -i to stderr)
        // For simplicity, omit duration here
        onProgress?.(100);

        resolve({
          outputPath,
          mimeType: FORMAT_MIMES[outputFormat],
          size: stat.size,
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function cleanup(paths: string[]) {
  await Promise.all(
    paths.map(async (p) => {
      try {
        await fs.unlink(p);
      } catch {
        // ignore
      }
    })
  );
}

export async function readProcessedFile(path: string): Promise<Buffer> {
  return fs.readFile(path);
}

export async function getAudioMetadata(buffer: Buffer, filename: string) {
  const ffmpeg = await getFfmpegPath();
  if (!ffmpeg) {
    return {
      duration: undefined,
      format: path.extname(filename).slice(1) || 'unknown',
      size: buffer.length,
    };
  }

  // Use ffprobe-style info via ffmpeg -i
  return new Promise<{ duration?: number; format?: string; size: number }>((resolve) => {
    const tmp = path.join(os.tmpdir(), `audioforge-probe-${uuid()}`);
    fs.writeFile(tmp, buffer).then(() => {
      const proc = spawn(ffmpeg, ['-i', tmp]);
      let stderr = '';
      proc.stderr.on('data', (chunk) => (stderr += chunk.toString()));
      proc.on('close', async () => {
        await fs.unlink(tmp).catch(() => {});
        const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        let duration: number | undefined;
        if (durationMatch) {
          duration =
            parseInt(durationMatch[1], 10) * 3600 +
            parseInt(durationMatch[2], 10) * 60 +
            parseFloat(durationMatch[3]);
        }
        resolve({
          duration,
          format: path.extname(filename).slice(1),
          size: buffer.length,
        });
      });
      proc.on('error', () => {
        resolve({ format: path.extname(filename).slice(1), size: buffer.length });
      });
    });
  });
}
