import pino from "pino";
import EventBus from "../../src/bus/eventbus.js";

const logger = pino({ level: "info" });
let bus;
beforeEach(() => {
    bus = new EventBus(logger);
});

// TODO: Asyncify

describe('Event bus', () => {

    it('does not accept invalid listeners', () => {
        expect(bus.listeners.length).toBe(0);
        ["test", null, 123].forEach(it => {
            bus.addListener(it);
            expect(bus.listeners.length).toBe(0);
        });
    });

    it('accepts listener objects', () => {
        expect(bus.listeners.length).toBe(0);
        bus.addListener({
            accept: type => type === 'test-type',
            notify: () => { },
        });
        expect(bus.listeners.length).toBe(1);
    });

    it('can be shut down', () => {
        var notified = null;
        expect(bus.listeners.length).toBe(0);
        bus.addListener({
            accept: type => type === 'test-type',
            notify: evt => notified = evt,
        });
        bus.shutdown();
        bus.notify('test-type', {});
        expect(notified).toBeNull();
    });

    it('notifies listeners if they accept an event', () => {
        var notifiedA = null;
        var busA = null;
        var notifiedB = null;
        var busB = null;
        expect(bus.listeners.length).toBe(0);
        bus.addListener({
            accept: type => type === 'test-type',
            notify: (evt, b) => {
                notifiedA = evt;
                busA = b;
            },
        });
        bus.addListener({
            accept: () => false,
            notify: (evt, b) => {
                notifiedB = evt;
                busB = b;
            },
        });
        bus.notify('test-type', { 'something': 'something' });
        expect(busA).toBe(bus);
        expect(notifiedA).toEqual({ 'something': 'something' });
        expect(notifiedB).toBeNull();
        expect(busB).toBeNull();
    });
});