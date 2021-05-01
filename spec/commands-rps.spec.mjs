import Facade from '../src/facade.js';
import util from '../src/util/rps.js';
import rps from '../src/commands/rps.js';
import pino from 'pino';

let logger, facade, commands;
beforeEach(() => {
    logger = pino({ level: 'error' });
    facade = new Facade({ commandPrefix: '!' }, null);
    commands = [];
    spyOn(facade, 'addCommand').and.callFake(cmd => commands.push(cmd));
});

describe('Rock, paper, scissors command provider', () => {
    it('provides the roll command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        rps(facade, logger);
        expect(facade.addCommand).toHaveBeenCalledTimes(2);
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Rock, paper, scissors' }));
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Soulgem, parchment, clippers' }));
    });
});

describe('Rock, paper, scissors command', () => {
    it('accepts the \'rps\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        rps(facade, logger);
        const rpsCmd = commands.find(it => it.name === 'Rock, paper, scissors');
        expect(rpsCmd).toBeDefined();
        expect(rpsCmd.accept).toBeDefined();
        expect(rpsCmd.accept('rps')).toBe(true);
        expect(rpsCmd.accept('spc')).toBe(false);
    });

    it('generates suitable outputs for r-p-s', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(util, 'play').and.returnValue('rock');

        rps(facade, logger);
        const rpsCmd = commands.find(it => it.name === 'Rock, paper, scissors');
        expect(rpsCmd).toBeDefined();
        expect(rpsCmd.handle).toBeDefined();

        const message = { member: { id: 'member id' } };
        await rpsCmd.handle(message, 'not used', 'not used');
        expect(util.play).toHaveBeenCalledOnceWith('rps');
        expect(facade.reply).toHaveBeenCalledOnceWith(message, 'rock');
    });
});

describe('Soulgem, parchment, clippers command', () => {
    it('accepts the \'spc\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        rps(facade, logger);
        const spcCmd = commands.find(it => it.name === 'Soulgem, parchment, clippers');
        expect(spcCmd).toBeDefined();
        expect(spcCmd.accept).toBeDefined();
        expect(spcCmd.accept('spc')).toBe(true);
        expect(spcCmd.accept('rps')).toBe(false);
    });

    it('generates suitable outputs for s-p-s', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(util, 'play').and.returnValue('parchment');

        rps(facade, logger);
        const spcCmd = commands.find(it => it.name === 'Soulgem, parchment, clippers');
        expect(spcCmd).toBeDefined();
        expect(spcCmd.handle).toBeDefined();

        const message = { member: { id: 'member id' } };
        await spcCmd.handle(message, 'not used', 'not used');
        expect(util.play).toHaveBeenCalledOnceWith('spc');
        expect(facade.reply).toHaveBeenCalledOnceWith(message, 'parchment');
    });
});