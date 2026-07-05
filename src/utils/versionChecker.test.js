import { describe, it, expect } from 'vitest';
import { compareVersions } from './versionChecker';

describe('compareVersions', () => {
    it('detects newer versions', () => {
        expect(compareVersions('v0.3.3', 'v0.3.2')).toBe(1);
        expect(compareVersions('1.0.0', '0.9.9')).toBe(1);
    });

    it('detects older versions', () => {
        expect(compareVersions('v0.3.1', 'v0.3.2')).toBe(-1);
    });

    it('treats equal versions as equal', () => {
        expect(compareVersions('v0.3.2', '0.3.2')).toBe(0);
    });

    it('handles missing patch segments (v1.0 == v1.0.0)', () => {
        expect(compareVersions('v1.0', 'v1.0.0')).toBe(0);
        expect(compareVersions('v1.1', 'v1.0.5')).toBe(1);
        expect(compareVersions('v1.0', 'v1.0.5')).toBe(-1);
    });
});
