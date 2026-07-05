import { describe, it, expect } from 'vitest';
import { getDistanceFromLatLonInM } from './events';

describe('getDistanceFromLatLonInM', () => {
    it('returns ~0 for identical points', () => {
        expect(getDistanceFromLatLonInM(48.8566, 2.3522, 48.8566, 2.3522)).toBeCloseTo(0);
    });

    it('computes a known distance (Paris -> London ~343km)', () => {
        const d = getDistanceFromLatLonInM(48.8566, 2.3522, 51.5074, -0.1278);
        expect(d).toBeGreaterThan(330000);
        expect(d).toBeLessThan(355000);
    });

    it('returns Infinity when a coordinate is missing', () => {
        expect(getDistanceFromLatLonInM(null, 2.35, 48.85, 2.35)).toBe(Infinity);
        expect(getDistanceFromLatLonInM(48.85, undefined, 48.85, 2.35)).toBe(Infinity);
    });

    it('treats 0 as a valid coordinate (equator/prime meridian)', () => {
        // (0,0) to (0,1) is ~111km along the equator, NOT Infinity
        const d = getDistanceFromLatLonInM(0, 0, 0, 1);
        expect(d).toBeGreaterThan(110000);
        expect(d).toBeLessThan(112000);
    });
});
