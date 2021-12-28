import pino from 'pino';
import EventBus from '../../src/bus/eventbus.js';
import Events from '../../src/bus/events.js';
import roll from '../../src/commands/rolls.js';
import { Facade } from '../../src/facade.js';
import rolls from '../../src/util/rolls.js';

let logger, facade, eventBus, context, config;
let commands;
beforeEach(() => {
    config = { commandPrefix: '!' };
    logger = pino({ level: 'error' });
    eventBus = new EventBus(logger);
    facade = new Facade(eventBus, logger);
    context = { source: 'test' };
    commands = [];
    spyOn(facade, 'addCommand').and.callFake(cmd => commands.push(cmd));
    spyOn(eventBus, 'notify').and.stub;
});

describe('Roll command provider', () => {
    it('provides the roll command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        roll(facade, logger, config);
        expect(facade.addCommand).toHaveBeenCalledTimes(2);
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Roll' }));
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Reroll' }));
    });
});

describe('Roll command', () => {
    it('accepts only the \'roll\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        roll(facade, logger, config);
        const rollCmd = commands.find(it => it.name === 'Roll');
        expect(rollCmd).toBeDefined();
        expect(rollCmd.accept).toBeDefined();
        expect(rollCmd.accept('something')).toBe(false);
        expect(rollCmd.accept('roll')).toBe(true);
        // Don't check accepting !Roll here too, it's up to the message handler to mangle the cmd down to lowercase.
    });

    it('allows a roll to be suffixed with a message', async () => {
        spyOn(rolls, 'roll').and.returnValue('you rolled: 4');

        roll(facade, logger, config);
        const rollCmd = commands.find(it => it.name === 'Roll');
        expect(rollCmd).toBeDefined();
        expect(rollCmd.handle).toBeDefined();


        await rollCmd.handle(['1d20', '+ 1', '#', 'attack', 'the', 'boss'], context, eventBus, 'roll');
        expect(rolls.roll).toHaveBeenCalledTimes(1);
        expect(rolls.roll).toHaveBeenCalledOnceWith('1d20 + 1');
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'you rolled: 4 (attack the boss)' }));

        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();

        await rollCmd.handle(['1d20+1#attack', 'the', 'boss'], context, eventBus, 'roll');
        expect(rolls.roll).toHaveBeenCalledOnceWith('1d20+1');
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'you rolled: 4 (attack the boss)' }));

        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();
        await rollCmd.handle(['#attack', 'the', 'boss'], context, eventBus, 'roll');
        expect(rolls.roll).toHaveBeenCalledOnceWith('');
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'you rolled: 4 (attack the boss)' }));
    });
});

describe('Reroll command', () => {
    it('accepts only the command-prefix as its command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        roll(facade, logger, config);
        let rerollCmd = commands.find(it => it.name === 'Reroll');
        expect(rerollCmd).toBeDefined();
        expect(rerollCmd.accept).toBeDefined();
        expect(rerollCmd.accept('something')).toBe(false);
        expect(rerollCmd.accept('%')).toBe(false);
        expect(rerollCmd.accept('!')).toBe(true);
        config.commandPrefix = '%';
        commands = [];
        roll(facade, logger, config);
        rerollCmd = commands.find(it => it.name === 'Reroll');
        expect(rerollCmd.accept('%')).toBe(true);
        expect(rerollCmd.accept('!')).toBe(false);
    });
});

describe('Reroll memory', () => {
    it('saves the previous roll', async () => {
        spyOn(rolls, 'roll').and.returnValue('roll result');
        roll(facade, logger, config);

        // When rolling a simple expression,
        const rollCmd = commands.find(it => it.name === 'Roll');
        const rerollCmd = commands.find(it => it.name === 'Reroll');
        await rollCmd.handle(['4d8', '-', '2'], context, eventBus, 'roll').then(function () {
            // Then the roll will have been made.
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(eventBus.notify).toHaveBeenCalledTimes(1);
        });
        // When rerolling,
        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();
        await rerollCmd.handle([], context, eventBus, 'reroll').then(function () {
            // Then the same roll will have been made again.
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(eventBus.notify).toHaveBeenCalledTimes(1);
        });
        // When rolling with a suffix message
        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();
        await rollCmd.handle(['4d8', '-', '2', '#', 'attack', 'the', 'boss'], context, eventBus, 'roll').then(function () {
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'roll result (attack the boss)' }));
        });
        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();
        await rerollCmd.handle([], context, eventBus, 'reroll').then(function () {
            expect(rolls.roll).toHaveBeenCalledOnceWith('4d8 - 2');
            expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'roll result (attack the boss)' }));
        });
        // When rolling with empty args
        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();
        await rollCmd.handle([], context, eventBus, 'roll').then(function () {
            expect(rolls.roll).toHaveBeenCalledOnceWith('');
            expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'roll result' }));
        });
        rolls.roll.calls.reset();
        eventBus.notify.calls.reset();
        await rerollCmd.handle([], context, eventBus, 'reroll').then(function () {
            expect(rolls.roll).toHaveBeenCalledOnceWith('');
            expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'roll result' }));
        });
    });
});
