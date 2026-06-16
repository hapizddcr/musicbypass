'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Upload,
  Link as LinkIcon,
  Music,
  Scissors,
  Volume2,
  Gauge,
  Wand2,
  Play,
  Pause,
  Trash2,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadedFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  duration?: number;
  format?: string;
}

interface ProcessingOptions {
  convertTo?: 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac' | 'keep';
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  normalize: boolean;
  speed: number;
  amplify: number;
}

export function WorkspaceClient({ userName }: { userName: string }) {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [activeJob, setActiveJob] = useState<{ id: string; status: string; progress: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [options, setOptions] = useState<ProcessingOptions>({
    convertTo: 'keep',
    trimStart: 0,
    trimEnd: 0,
    fadeIn: 0,
    fadeOut: 0,
    normalize: false,
    speed: 1,
    amplify: 1,
  });

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 5, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Upload failed');
        return;
      }
      const data = await res.json();
      setUploadedFile(data);
      toast.success('File uploaded');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => setUploading(false), 300);
    }
  }, []);

  const handleRemoteUrl = useCallback(async () => {
    if (!remoteUrl.trim()) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('url', remoteUrl);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Could not fetch URL');
        return;
      }
      const data = await res.json();
      setUploadedFile(data);
      toast.success('File fetched');
      setRemoteUrl('');
    } catch (e) {
      toast.error('Could not fetch URL');
    } finally {
      setUploading(false);
    }
  }, [remoteUrl]);

  const startJob = useCallback(async () => {
    if (!uploadedFile) return;

    const jobOptions: Record<string, unknown> = {};
    if (options.convertTo !== 'keep') jobOptions.convertTo = options.convertTo;
    if (options.trimStart > 0) jobOptions.trimStart = options.trimStart;
    if (options.trimEnd > 0) jobOptions.trimEnd = options.trimEnd;
    if (options.fadeIn > 0) jobOptions.fadeIn = options.fadeIn;
    if (options.fadeOut > 0) jobOptions.fadeOut = options.fadeOut;
    if (options.normalize) jobOptions.normalize = true;
    if (options.speed !== 1) jobOptions.speed = options.speed;
    if (options.amplify !== 1) jobOptions.amplify = options.amplify;

    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: uploadedFile.id, options: jobOptions }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Could not start job');
        return;
      }
      const job = await res.json();
      setActiveJob({ id: job.id, status: 'QUEUED', progress: 0 });
      toast.success('Job started');
      pollJob(job.id);
    } catch (e) {
      toast.error('Could not start job');
    }
  }, [uploadedFile, options]);

  const pollJob = useCallback(async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          clearInterval(interval);
          return;
        }
        const data = await res.json();
        setActiveJob({ id: jobId, status: data.status, progress: data.progress });
        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
          clearInterval(interval);
          if (data.status === 'COMPLETED') toast.success('Processing complete!');
          else if (data.status === 'FAILED') toast.error(data.error || 'Processing failed');
        }
      } catch {
        clearInterval(interval);
      }
    }, 1500);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setAudioCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', onTime);
    return () => audio.removeEventListener('timeupdate', onTime);
  }, [uploadedFile]);

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="mt-1 text-muted-foreground">Process audio files with powerful tools</p>
      </div>

      {!uploadedFile ? (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-white/[0.06] bg-transparent p-0">
                <TabsTrigger
                  value="upload"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent"
                >
                  <Upload className="mr-2 h-4 w-4" /> Direct Upload
                </TabsTrigger>
                <TabsTrigger
                  value="url"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent"
                >
                  <LinkIcon className="mr-2 h-4 w-4" /> Remote URL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="p-6">
                <div
                  className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/[0.1] bg-white/[0.02] p-12 text-center transition-colors hover:border-purple-500/40 hover:bg-purple-500/[0.02]"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                    <Upload className="h-7 w-7 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Drop your audio file here</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse (max 100MB)
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Supports MP3, WAV, OGG, AAC, FLAC
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="url" className="p-6">
                <div className="space-y-3">
                  <Label>Remote audio URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/audio.mp3"
                      value={remoteUrl}
                      onChange={(e) => setRemoteUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRemoteUrl()}
                    />
                    <Button onClick={handleRemoteUrl} disabled={!remoteUrl.trim() || uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a public HTTP(S) URL. The file will be fetched and processed.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            {uploading && (
              <div className="border-t border-white/[0.06] p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="truncate text-base">{uploadedFile.filename}</CardTitle>
                  <CardDescription>
                    {(Number(uploadedFile.size) / 1024 / 1024).toFixed(2)} MB
                    {uploadedFile.duration && ` · ${formatTime(uploadedFile.duration)}`}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setUploadedFile(null);
                    setActiveJob(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Waveform visualization (simplified) */}
                <div className="relative h-32 overflow-hidden rounded-lg border border-white/[0.06] bg-black/40 p-2">
                  <div className="flex h-full items-end gap-1">
                    {Array.from({ length: 80 }).map((_, i) => {
                      const h = 20 + Math.sin(i * 0.3) * 30 + Math.random() * 40;
                      const played = (i / 80) * (uploadedFile.duration ?? 0);
                      const isPlayed = played <= audioCurrentTime;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm transition-colors ${
                            isPlayed
                              ? 'bg-gradient-to-t from-purple-600 to-purple-400'
                              : 'bg-white/10'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Player controls */}
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="glass"
                    onClick={() => {
                      const a = audioRef.current;
                      if (!a) return;
                      if (a.paused) a.play();
                      else a.pause();
                      setIsPlaying(!a.paused);
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(audioCurrentTime)} /{' '}
                    {formatTime(uploadedFile.duration ?? 0)}
                  </span>
                  <audio
                    ref={audioRef}
                    src={uploadedFile.url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Convert to format</Label>
                  <Select
                    value={options.convertTo}
                    onValueChange={(v) => setOptions({ ...options, convertTo: v as ProcessingOptions['convertTo'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep original</SelectItem>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="ogg">OGG</SelectItem>
                      <SelectItem value="aac">AAC</SelectItem>
                      <SelectItem value="flac">FLAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trim start (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={options.trimStart}
                      onChange={(e) =>
                        setOptions({ ...options, trimStart: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trim end (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={options.trimEnd}
                      onChange={(e) =>
                        setOptions({ ...options, trimEnd: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fade in (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      step={0.1}
                      value={options.fadeIn}
                      onChange={(e) =>
                        setOptions({ ...options, fadeIn: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fade out (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      step={0.1}
                      value={options.fadeOut}
                      onChange={(e) =>
                        setOptions({ ...options, fadeOut: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Speed ({options.speed.toFixed(2)}x)</Label>
                    <Input
                      type="range"
                      min={0.25}
                      max={4}
                      step={0.05}
                      value={options.speed}
                      onChange={(e) => setOptions({ ...options, speed: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amplify ({options.amplify.toFixed(1)}x)</Label>
                    <Input
                      type="range"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={options.amplify}
                      onChange={(e) => setOptions({ ...options, amplify: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border border-white/[0.06] p-3">
                  <div>
                    <Label className="text-sm">Normalize volume</Label>
                    <p className="text-xs text-muted-foreground">
                      EBU R128 broadcast-standard loudness
                    </p>
                  </div>
                  <Switch
                    checked={options.normalize}
                    onCheckedChange={(c) => setOptions({ ...options, normalize: c })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{options.convertTo === 'keep' ? uploadedFile.format || 'auto' : options.convertTo}</span>
                </div>
 <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="font-medium">{options.speed.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amplify</span>
                  <span className="font-medium">{options.amplify.toFixed(1)}x</span>
                </div>
                {options.trimStart > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trim start</span>
                    <span className="font-medium">{options.trimStart}s</span>
                  </div>
                )}
                {options.trimEnd > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trim end</span>
                    <span className="font-medium">{options.trimEnd}s</span>
                  </div>
                )}
                {options.normalize && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Normalize</span>
                    <Badge variant="success" className="text-[10px]">enabled</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={startJob} className="w-full" size="lg" disabled={!!activeJob && activeJob.status !== 'COMPLETED' && activeJob.status !== 'FAILED'}>
              {activeJob && activeJob.status !== 'COMPLETED' && activeJob.status !== 'FAILED' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                'Start Processing'
              )}
            </Button>

            <AnimatePresence>
              {activeJob && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Job Status</span>
                        <Badge
                          variant={
                            activeJob.status === 'COMPLETED'
                              ? 'success'
                              : activeJob.status === 'FAILED'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {activeJob.status}
                        </Badge>
                      </div>
                      <Progress value={activeJob.progress} />
                      <p className="mt-2 text-xs text-muted-foreground">{activeJob.progress}% complete</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
