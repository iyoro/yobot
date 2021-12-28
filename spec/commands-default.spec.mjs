import pino from 'pino';
import EventBus from '../src/bus/eventbus.js';
import def from '../src/commands/default.js';
import { Facade } from '../src/facade.js';

const logger = pino({ level: 'error' });
let facade, command, eventBus;
beforeEach(() => {
    eventBus = new EventBus(logger);
    facade = new Facade(eventBus, logger);
    spyOn(facade, 'addCommand').and.callFake(cmd => command = cmd);
    spyOn(eventBus, 'notify').and.stub;
});

describe('Default command provider', () => {
    it('provides the default command', async () => {
        expect(command).toBeUndefined();
        expect(facade.addCommand).toHaveBeenCalledTimes(0);
        def(facade, logger);
        expect(facade.addCommand).toHaveBeenCalledTimes(1);
        expect(command.name).toBe('Default');
        // Command will accept any input.
        expect(command.accept('something')).toBe(true);
        expect(command.accept()).toBe(true);
        // Command doesn't do anything.
        expect(eventBus.notify).not.toHaveBeenCalled();
        await command.handle([], {}, eventBus, 'something');
        expect(eventBus.notify).not.toHaveBeenCalled();
    });
});
