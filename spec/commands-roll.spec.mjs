import Facade from '../src/facade.js';
import roll from '../src/commands/rolls.js';
import pino from 'pino';

let logger, facade, commands;
beforeEach(() => {
    logger = pino({ level: 'error' });
    facade = new Facade({ commandPrefix: '!' }, null);
    commands = [];
    spyOn(facade, 'addCommand').and.callFake(cmd => commands.push(cmd));
});

describe('Roll command provider', () => {
    it('provides the roll command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        roll(facade, logger);
        expect(facade.addCommand).toHaveBeenCalledTimes(2);
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Roll' }));
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Reroll' }));
    });
});

describe('Roll command', () => {
    it('accepts only the \'roll\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        roll(facade, logger);
        const rollCmd = commands.find(it => it.name === 'Roll');
        expect(rollCmd).toBeDefined();
        expect(rollCmd.accept).toBeDefined();
        expect(rollCmd.accept('something')).toBe(false);
        expect(rollCmd.accept('roll')).toBe(true);
    });
});

describe('Reroll command', () => {
    it('accepts only the command-prefix as its command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        roll(facade, logger);
        let rerollCmd = commands.find(it => it.name === 'Reroll');
        expect(rerollCmd).toBeDefined();
        expect(rerollCmd.accept).toBeDefined();
        expect(rerollCmd.accept('something')).toBe(false);
        expect(rerollCmd.accept('%')).toBe(false);
        expect(rerollCmd.accept('!')).toBe(true);
        facade.config.commandPrefix = '%';
        commands = [];
        roll(facade, logger);
        rerollCmd = commands.find(it => it.name === 'Reroll');
        expect(rerollCmd.accept('%')).toBe(true);
        expect(rerollCmd.accept('!')).toBe(false);
    });
});
