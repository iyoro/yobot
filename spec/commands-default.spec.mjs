import Facade from '../src/facade.js';
import def from '../src/commands/default.js';
import pino from 'pino';

const logger = pino({ level: 'error' });
let facade, command;
beforeEach(() => {
    facade = new Facade({ commandPrefix: '!' }, null);
    spyOn(facade, 'addCommand').and.callFake(cmd => command = cmd);
    spyOn(facade, 'send').and.stub();
    spyOn(facade, 'reply').and.stub();
    spyOn(facade, 'exec').and.stub();
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
        expect(facade.send).not.toHaveBeenCalled();
        expect(facade.reply).not.toHaveBeenCalled();
        expect(facade.exec).not.toHaveBeenCalled();
        await command.handle({ content: '!something' }, [], 'something');
        expect(facade.send).not.toHaveBeenCalled();
        expect(facade.reply).not.toHaveBeenCalled();
        expect(facade.exec).not.toHaveBeenCalled();
    });
});
