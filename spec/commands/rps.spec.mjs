import pino from 'pino';
import EventBus from '../../src/bus/eventbus.js';
import Events from '../../src/bus/events.js';
import { Commands } from '../../src/commands.js';
import rps from '../../src/commands/rps.js';
import util from '../../src/util/rps.js';

let logger, commands, eventBus, context;
let commandsAdded;
beforeEach(() => {
    logger = pino({ level: 'error' });
    eventBus = new EventBus(logger);
    commands = new Commands(eventBus, logger);
    context = { source: 'test' };
    commandsAdded = [];
    spyOn(commands, 'addCommand').and.callFake(cmd => commandsAdded.push(cmd));
    spyOn(eventBus, 'notify').and.stub;
});

describe('Rock, paper, scissors command provider', () => {
    it('provides the roll command', () => {
        expect(commands.addCommand).not.toHaveBeenCalled();
        rps(commands, logger);
        expect(commands.addCommand).toHaveBeenCalledTimes(2);
        expect(commands.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Rock, paper, scissors' }));
        expect(commands.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Soulgem, parchment, clippers' }));
    });
});

describe('Rock, paper, scissors command', () => {
    it('accepts the \'rps\' command', () => {
        expect(commands.addCommand).not.toHaveBeenCalled();
        rps(commands, logger);
        const rpsCmd = commandsAdded.find(it => it.name === 'Rock, paper, scissors');
        expect(rpsCmd).toBeDefined();
        expect(rpsCmd.accept).toBeDefined();
        expect(rpsCmd.accept('rps')).toBe(true);
        expect(rpsCmd.accept('spc')).toBe(false);
    });

    it('generates suitable outputs for r-p-s', async () => {
        spyOn(util, 'play').and.returnValue('rock');

        rps(commands, logger);
        const rpsCmd = commandsAdded.find(it => it.name === 'Rock, paper, scissors');
        expect(rpsCmd).toBeDefined();
        expect(rpsCmd.handle).toBeDefined();

        await rpsCmd.handle([], context, eventBus, 'rps');
        expect(util.play).toHaveBeenCalledOnceWith('rps');
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'rock' }));
    });
});

describe('Soulgem, parchment, clippers command', () => {
    it('accepts the \'spc\' command', () => {
        expect(commands.addCommand).not.toHaveBeenCalled();
        rps(commands, logger);
        const spcCmd = commandsAdded.find(it => it.name === 'Soulgem, parchment, clippers');
        expect(spcCmd).toBeDefined();
        expect(spcCmd.accept).toBeDefined();
        expect(spcCmd.accept('spc')).toBe(true);
        expect(spcCmd.accept('rps')).toBe(false);
    });

    it('generates suitable outputs for s-p-s', async () => {
        spyOn(util, 'play').and.returnValue('parchment');

        rps(commands, logger);
        const spcCmd = commandsAdded.find(it => it.name === 'Soulgem, parchment, clippers');
        expect(spcCmd).toBeDefined();
        expect(spcCmd.handle).toBeDefined();

        await spcCmd.handle([], context, eventBus, 'spc');
        expect(util.play).toHaveBeenCalledOnceWith('spc');
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'parchment' }));
    });
});