import Facade from '../src/facade.js';
import roll from '../src/commands/rolls.js';
import rolls from '../src/util/rolls.js';
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

    it('allows a roll to be suffixed with a message', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(rolls, 'roll').and.returnValue('you rolled: 4');

        roll(facade, logger);
        const rollCmd = commands.find(it => it.name === 'Roll');
        expect(rollCmd).toBeDefined();
        expect(rollCmd.handle).toBeDefined();

        const message = { member: { id: 'member id' } };
        await rollCmd.handle(message, '1d20 + 1 # attack the boss', 'roll');
        expect(rolls.roll).toHaveBeenCalledOnceWith('1d20 + 1');
        expect(facade.reply).toHaveBeenCalledOnceWith(message, 'you rolled: 4 (attack the boss)');

        rolls.roll.calls.reset();
        facade.reply.calls.reset();
        await rollCmd.handle(message, '1d20+1#attack the boss', 'roll');
        expect(rolls.roll).toHaveBeenCalledOnceWith('1d20+1');
        expect(facade.reply).toHaveBeenCalledWith(message, 'you rolled: 4 (attack the boss)');

        rolls.roll.calls.reset();
        facade.reply.calls.reset();
        await rollCmd.handle(message, '#attack the boss', 'roll');
        expect(rolls.roll).toHaveBeenCalledOnceWith('');
        expect(facade.reply).toHaveBeenCalledWith(message, 'you rolled: 4 (attack the boss)');
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

describe('Reroll memory', () => {
    it('saves the previous roll', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(rolls, 'roll').and.returnValue('roll result');
        const message = { member: { id: 'member id' } };
        roll(facade, logger);

        // When rolling a simple expression,
        const rollCmd = commands.find(it => it.name === 'Roll');
        const rerollCmd = commands.find(it => it.name === 'Reroll');
        await rollCmd.handle(message, '4d8 - 2', 'roll').then(function () {
            // Then the roll will have been made.
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(facade.reply).toHaveBeenCalledTimes(1);
        });
        // When rerolling,
        rolls.roll.calls.reset();
        facade.reply.calls.reset();
        await rerollCmd.handle(message, '', 'reroll').then(function () {
            // Then the same roll will have been made again.
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(facade.reply).toHaveBeenCalledTimes(1);
        });
        // When rolling with a suffix message
        rolls.roll.calls.reset();
        facade.reply.calls.reset();
        await rollCmd.handle(message, '4d8 - 2 # attack the boss', 'roll').then(function () {
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(facade.reply).toHaveBeenCalledOnceWith(message, 'roll result (attack the boss)');
        });
        rolls.roll.calls.reset();
        facade.reply.calls.reset();
        await rerollCmd.handle(message, '', 'reroll').then(function () {
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(facade.reply).toHaveBeenCalledOnceWith(message, 'roll result (attack the boss)');
        });
    });
});
