import pino from 'pino';
import EventBus from '../../src/bus/eventbus.js';
import events from '../../src/bus/events.js';
import { Commands } from '../../src/commands.js';
import help from '../../src/commands/help.js';

const logger = pino({ level: 'error' });
let commands, eventBus, context, config;
let command, event, eventType;
beforeEach(() => {
    config = {};
    context = { source: 'test' };
    eventBus = new EventBus(logger);
    commands = new Commands(config, eventBus, logger);
    spyOn(commands, 'addCommand').and.callFake(cmd => command = cmd);
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
        expect(commands.addCommand).not.toHaveBeenCalled();
        help(commands, logger);
        expect(commands.addCommand).toHaveBeenCalledTimes(1);
        expect(command.name).toBe('Help');
        expect(command.accept('help')).toBe(true);
        expect(command.accept('somethingElse')).toBe(false);
    });

    it('fires a response when invoked', async () => {
        help(commands, logger);
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