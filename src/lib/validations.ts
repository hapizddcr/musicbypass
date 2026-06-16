import { z } from 'zod';

// ===========================================
// Auth schemas
// ===========================================
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  image: z.string().url().optional().or(z.literal('')),
});

// ===========================================
// Audio job schemas
// ===========================================
export const AudioFormatSchema = z.enum(['mp3', 'wav', 'ogg', 'aac', 'flac']);
export type AudioFormat = z.infer<typeof AudioFormatSchema>;

export const CreateJobSchema = z.object({
  fileId: z.string().cuid('Invalid file ID'),
  options: z.object({
    convertTo: AudioFormatSchema.optional(),
    trimStart: z.number().min(0).optional(),
    trimEnd: z.number().min(0).optional(),
    fadeIn: z.number().min(0).max(60).optional(),
    fadeOut: z.number().min(0).max(60).optional(),
    normalize: z.boolean().optional(),
    speed: z.number().min(0.25).max(4).optional(),
    amplify: z.number().min(0.1).max(10).optional(),
  }),
});

export const RemoteUrlSchema = z.object({
  url: z.string().url('Invalid URL').refine(
    (u) => {
      try {
        const url = new URL(u);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Only HTTP/HTTPS URLs are allowed' }
  ),
});

// ===========================================
// Payment schemas
// ===========================================
export const CreatePaymentSchema = z.object({
  planId: z.string().cuid(),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

// ===========================================
// Pagination
// ===========================================
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;
