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
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Soulgem, parchment, shears' }));
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
        expect(rpsCmd.accept('sps')).toBe(false);
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

describe('Soulgem, parchment, shears command', () => {
    it('accepts the \'sps\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        rps(facade, logger);
        const spsCmd = commands.find(it => it.name === 'Soulgem, parchment, shears');
        expect(spsCmd).toBeDefined();
        expect(spsCmd.accept).toBeDefined();
        expect(spsCmd.accept('sps')).toBe(true);
        expect(spsCmd.accept('rps')).toBe(false);
    });

    it('generates suitable outputs for s-p-s', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(util, 'play').and.returnValue('parchment');

        rps(facade, logger);
        const spsCmd = commands.find(it => it.name === 'Soulgem, parchment, shears');
        expect(spsCmd).toBeDefined();
        expect(spsCmd.handle).toBeDefined();

        const message = { member: { id: 'member id' } };
        await spsCmd.handle(message, 'not used', 'not used');
        expect(util.play).toHaveBeenCalledOnceWith('sps');
        expect(facade.reply).toHaveBeenCalledOnceWith(message, 'parchment');
    });
});