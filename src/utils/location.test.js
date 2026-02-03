import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAddressFromCoords, getCoordsFromAddress } from './location';

// Mock fetch globally
global.fetch = vi.fn();

describe('location utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAddressFromCoords', () => {
        it('returns null when lat or lng is missing', async () => {
            expect(await getAddressFromCoords(null, 123)).toBeNull();
            expect(await getAddressFromCoords(45.5, null)).toBeNull();
            expect(await getAddressFromCoords(undefined, undefined)).toBeNull();
        });

        it('returns display_name on successful fetch', async () => {
            global.fetch.mockResolvedValueOnce({
                json: () => Promise.resolve({ display_name: '123 Test Street, City' })
            });

            const result = await getAddressFromCoords(45.5, -73.5);
            expect(result).toBe('123 Test Street, City');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('returns null on fetch error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getAddressFromCoords(45.5, -73.5);
            expect(result).toBeNull();
        });
    });

    describe('getCoordsFromAddress', () => {
        it('returns null when address is empty', async () => {
            expect(await getCoordsFromAddress('')).toBeNull();
            expect(await getCoordsFromAddress(null)).toBeNull();
        });

        it('returns coordinates on successful fetch', async () => {
            global.fetch.mockResolvedValueOnce({
                json: () => Promise.resolve([{ lat: '45.5', lon: '-73.5', display_name: 'Montreal' }])
            });

            const result = await getCoordsFromAddress('Montreal, Canada');
            expect(result).toEqual({
                latitude: 45.5,
                longitude: -73.5,
                displayName: 'Montreal'
            });
        });

        it('returns null when no results found', async () => {
            global.fetch.mockResolvedValueOnce({
                json: () => Promise.resolve([])
            });

            const result = await getCoordsFromAddress('NonexistentPlace123');
            expect(result).toBeNull();
        });

        it('returns null on fetch error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getCoordsFromAddress('Montreal');
            expect(result).toBeNull();
        });
    });
});
