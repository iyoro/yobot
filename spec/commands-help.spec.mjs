import Facade from '../src/facade.js';
import help from '../src/commands/help.js';
import pino from 'pino';

const logger = pino({ level: 'error' });
let facade, command;
beforeEach(() => {
    facade = new Facade({ commandPrefix: '!' }, null);
    spyOn(facade, 'addCommand').and.callFake(cmd => command = cmd);
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
});