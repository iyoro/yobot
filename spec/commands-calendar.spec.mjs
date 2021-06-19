import Facade from '../src/facade.js';
import util from '../src/util/calendar.js';
import calendar from '../src/commands/calendar.js';
import pino from 'pino';

let logger, facade, commands;
beforeEach(() => {
    logger = pino({ level: 'error' });
    facade = new Facade({ commandPrefix: '!' }, null);
    commands = [];
    spyOn(facade, 'addCommand').and.callFake(cmd => commands.push(cmd));
});

describe('Calendar command provider', () => {
    it('provides the day command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        calendar(facade, logger);
        expect(facade.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Lore day' }));
    });
});

describe('Lore day command', () => {
    it('accepts the \'day\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        calendar(facade, logger);
        const rpsCmd = commands.find(it => it.name === 'Lore day');
        expect(rpsCmd).toBeDefined();
        expect(rpsCmd.accept).toBeDefined();
        expect(rpsCmd.accept('day')).toBe(true);
    });

    it('generates suitable outputs', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(util, 'day').and.returnValue('Fredas');

        calendar(facade, logger);
        const dayCmd = commands.find(it => it.name === 'Lore day');
        expect(dayCmd).toBeDefined();
        expect(dayCmd.handle).toBeDefined();

        const message = { member: { id: 'member id' } };
        await dayCmd.handle(message, 'not used', 'not used');
        expect(util.day).toHaveBeenCalledTimes(1);
        expect(facade.reply).toHaveBeenCalledOnceWith(message, 'It is Fredas');
    });
});

describe('Lore date command', () => {
    it('accepts the \'date\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        calendar(facade, logger);
        const rpsCmd = commands.find(it => it.name === 'Lore date');
        expect(rpsCmd).toBeDefined();
        expect(rpsCmd.accept).toBeDefined();
        expect(rpsCmd.accept('date')).toBe(true);
    });

    it('generates suitable outputs', async () => {
        spyOn(facade, 'reply').and.resolveTo('not used');
        spyOn(util, 'date').and.returnValue("Full date string from library");

        calendar(facade, logger);
        const dayCmd = commands.find(it => it.name === 'Lore date');
        expect(dayCmd).toBeDefined();
        expect(dayCmd.handle).toBeDefined();

        const message = { member: { id: 'member id' } };
        await dayCmd.handle(message, 'not used', 'not used');
        expect(util.date).toHaveBeenCalledTimes(1);
        expect(facade.reply).toHaveBeenCalledOnceWith(message, 'It is Full date string from library');
    });
});
