import { describe, it, expect } from 'vitest';
import { validateUsername, validateComment } from './storage';

describe('validation utilities', () => {
    describe('validateUsername', () => {
        it('returns error for empty username', () => {
            expect(validateUsername('')).toBe('Username is required');
            expect(validateUsername(null)).toBe('Username is required');
            expect(validateUsername(undefined)).toBe('Username is required');
        });

        it('returns error for username too short', () => {
            expect(validateUsername('ab')).toBe('Username must be at least 3 characters');
            expect(validateUsername('a')).toBe('Username must be at least 3 characters');
        });

        it('returns error for username too long', () => {
            expect(validateUsername('a'.repeat(16))).toBe('Username must be at most 15 characters');
        });

        it('returns error for invalid characters', () => {
            expect(validateUsername('test user')).toBe('Username must be alphanumeric (letters, numbers, underscores)');
            expect(validateUsername('test-user')).toBe('Username must be alphanumeric (letters, numbers, underscores)');
            expect(validateUsername('test@user')).toBe('Username must be alphanumeric (letters, numbers, underscores)');
            expect(validateUsername('test.user')).toBe('Username must be alphanumeric (letters, numbers, underscores)');
        });

        it('returns null for valid usernames', () => {
            expect(validateUsername('validUser')).toBeNull();
            expect(validateUsername('user_123')).toBeNull();
            expect(validateUsername('Test_User_1')).toBeNull();
            expect(validateUsername('abc')).toBeNull();
            expect(validateUsername('a'.repeat(15))).toBeNull();
        });
    });

    describe('validateComment', () => {
        it('returns null for empty or undefined comments', () => {
            expect(validateComment('')).toBeNull();
            expect(validateComment(null)).toBeNull();
            expect(validateComment(undefined)).toBeNull();
        });

        it('returns null for valid comments', () => {
            expect(validateComment('This is a valid comment')).toBeNull();
            expect(validateComment('a'.repeat(100))).toBeNull();
        });

        it('returns error for comments too long', () => {
            expect(validateComment('a'.repeat(101))).toBe('Comment is too long (max 100 chars)');
        });
    });
});
