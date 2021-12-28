import calendar from '../../src/util/calendar.js';

const DATE = new Date('July 19, 2021, 20:00:00 UTC');

describe('Calendar', () => {
    it('calculates day', () => {
        expect(calendar.day(DATE)).toBe('Morndas');
    });
    it('calculates month (common)', () => {
        expect(calendar.month(DATE)).toBe("Sun's Height");
    });
    it('calculates month (Argonian)', () => {
        const am = calendar.argoMonth(DATE);
        expect(am[0]).toBe("Thtithil-Gah");
        expect(am[1]).toBe("Egg-Basket");
    });
    it('calculates year', () => {
        expect(calendar.year(DATE)).toBe(589);
    });
    it('formulates a date', () => {
        expect(calendar.date(DATE)).toBe("Morndas the 19th of Sun's Height (Thtithil-Gah, *Egg-Basket*) 2E 589");
    });
    it('lists months', () => {
        const str = calendar.months(DATE);
        expect(str).toContain("**Sun's Height (Thtithil-Gah, *Egg-Basket*)** :arrow_left: You are here!");
    });
});
