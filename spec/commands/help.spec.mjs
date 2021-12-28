import pino from 'pino';
import EventBus from '../../src/bus/eventbus.js';
import events from '../../src/bus/events.js';
import help from '../../src/commands/help.js';
import { Facade } from '../../src/facade.js';

const logger = pino({ level: 'error' });
let facade, eventBus, context;
let command, event, eventType;
beforeEach(() => {
    context = { source: 'test' };
    eventBus = new EventBus(logger);
    facade = new Facade(eventBus, logger);
    spyOn(facade, 'addCommand').and.callFake(cmd => command = cmd);
    spyOn(eventBus, 'notify').and.callFake((type, evt) => {
        eventType = type;
        event = evt;
    });
    command = undefined;
    event = undefined;
    eventType = undefined;
});

describe('Help command provider', () => {
    it('provides the help command', () => {
        expect(command).toBeUndefined();
        expect(facade.addCommand).not.toHaveBeenCalled();
        help(facade, logger);
        expect(facade.addCommand).toHaveBeenCalledTimes(1);
        expect(command.name).toBe('Help');
        expect(command.accept('help')).toBe(true);
        expect(command.accept('somethingElse')).toBe(false);
    });

    it('fires a response when invoked', async () => {
        help(facade, logger);
        const startTime = new Date().getTime();
        context.timestamp = startTime;
        command.handle(['foo', 'bar', 'baz'], context, eventBus, 'Help');
        expect(eventBus.notify).toHaveBeenCalledTimes(1);
        expect(eventType).toEqual(events.COMMAND_RESULT);
        expect(event.content).not.toBeNull();
        expect(event.content.embeds).not.toBeNull();
        // Call again with a newer timestamp, should be in cooldown.
        context.timestamp += 30000;
        command.handle(['foo', 'bar', 'baz'], context, eventBus, 'Help');
        expect(eventBus.notify).toHaveBeenCalledTimes(1);
        // Call again out of cooldown
        context.timestamp += 90000;
        command.handle(['foo', 'bar', 'baz'], context, eventBus, 'Help');
        expect(eventBus.notify).toHaveBeenCalledTimes(2);
    });
});