import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  CreateJobSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
} from '@/lib/validations';

describe('RegisterSchema', () => {
  it('accepts valid registration', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      name: 'John Doe',
      password: 'Passw0rd',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = RegisterSchema.safeParse({
      email: 'not-an-email',
      name: 'John',
      password: 'Passw0rd',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      name: 'John',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      name: 'John',
      password: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      name: 'John',
      password: 'Password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short name', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      name: 'J',
      password: 'Passw0rd',
    });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts valid login', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'any',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateJobSchema', () => {
  it('accepts minimal valid job', () => {
    const result = CreateJobSchema.safeParse({
      fileId: 'cl1234567890abcdef',
      options: {},
    });
    expect(result.success).toBe(true);
  });

  it('accepts full options', () => {
    const result = CreateJobSchema.safeParse({
      fileId: 'cl1234567890abcdef',
      options: {
        convertTo: 'mp3',
        trimStart: 1.5,
        trimEnd: 2.0,
        fadeIn: 0.5,
        fadeOut: 1.0,
        normalize: true,
        speed: 1.5,
        amplify: 2.0,
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    const result = CreateJobSchema.safeParse({
      fileId: 'cl1234567890abcdef',
      options: { convertTo: 'xyz' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range speed', () => {
    const result = CreateJobSchema.safeParse({
      fileId: 'cl1234567890abcdef',
      options: { speed: 10 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fileId', () => {
    const result = CreateJobSchema.safeParse({
      fileId: 'not-a-cuid',
      options: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('ChangePasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'old',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass2',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProfileSchema', () => {
  it('accepts valid username', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'john_doe_123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid characters in username', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'john-doe!' });
    expect(result.success).toBe(false);
  });
});
