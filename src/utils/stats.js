const DEFAULT_SHOT_CL = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

// Total volume (cl) across a list of drinks
export const getTotalVolumeCl = (drinks) =>
    drinks.reduce((acc, curr) => acc + (curr.volume || DEFAULT_SHOT_CL), 0);

// Volume (cl) consumed during the current "night", defined as the
// midday-to-midday window containing now.
export const getLastNightVolume = (drinks, now = new Date()) => {
    const middayToday = new Date(now);
    middayToday.setHours(12, 0, 0, 0);

    let start, end;
    if (now.getHours() >= 12) {
        start = middayToday.getTime();
        end = middayToday.getTime() + DAY_MS;
    } else {
        start = middayToday.getTime() - DAY_MS;
        end = middayToday.getTime();
    }

    return getTotalVolumeCl(drinks.filter(d => d.timestamp >= start && d.timestamp < end));
};
