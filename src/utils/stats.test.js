import { describe, it, expect } from 'vitest';
import { getTotalVolumeCl, getLastNightVolume } from './stats';

describe('stats utilities', () => {
    describe('getTotalVolumeCl', () => {
        it('sums volumes', () => {
            expect(getTotalVolumeCl([{ volume: 2 }, { volume: 4 }, { volume: 12 }])).toBe(18);
        });

        it('defaults missing volume to 2cl', () => {
            expect(getTotalVolumeCl([{}, { volume: 4 }])).toBe(6);
        });

        it('returns 0 for an empty list', () => {
            expect(getTotalVolumeCl([])).toBe(0);
        });
    });

    describe('getLastNightVolume', () => {
        it('counts drinks after midday when now is evening', () => {
            const now = new Date('2026-07-04T22:00:00');
            const middayToday = new Date('2026-07-04T12:00:00').getTime();
            const drinks = [
                { timestamp: middayToday + 1000, volume: 4 },        // tonight
                { timestamp: middayToday - 1000, volume: 8 },        // last night (excluded)
            ];
            expect(getLastNightVolume(drinks, now)).toBe(4);
        });

        it('counts the previous evening when now is morning', () => {
            const now = new Date('2026-07-05T03:00:00');
            const middayYesterday = new Date('2026-07-04T12:00:00').getTime();
            const middayToday = new Date('2026-07-05T12:00:00').getTime();
            const drinks = [
                { timestamp: middayYesterday + 1000, volume: 4 },    // last evening
                { timestamp: now.getTime() - 1000, volume: 2 },      // tonight (still same "night")
                { timestamp: middayToday + 1000, volume: 8 },        // future (excluded)
                { timestamp: middayYesterday - 1000, volume: 12 },   // day before (excluded)
            ];
            expect(getLastNightVolume(drinks, now)).toBe(6);
        });
    });
});
