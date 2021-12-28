import pino from 'pino';
import EventBus from '../src/bus/eventbus.js';
import Events from '../src/bus/events.js';
import calendar from '../src/commands/calendar.js';
import { Facade } from '../src/facade.js';
import util from '../src/util/calendar.js';

let logger, facade, eventBus, context;
let commands;
beforeEach(() => {
    logger = pino({ level: 'error' });
    eventBus = new EventBus(logger);
    facade = new Facade(eventBus, logger);
    context = { source: 'test' };
    commands = [];
    spyOn(facade, 'addCommand').and.callFake(cmd => commands.push(cmd));
    spyOn(eventBus, 'notify').and.stub;
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
        const dayCmd = commands.find(it => it.name === 'Lore day');
        expect(dayCmd).toBeDefined();
        expect(dayCmd.accept).toBeDefined();
        expect(dayCmd.accept('day')).toBe(true);
    });

    it('generates suitable outputs', async () => {
        spyOn(util, 'day').and.returnValue('Fredas');

        calendar(facade, logger);
        const dayCmd = commands.find(it => it.name === 'Lore day');
        expect(dayCmd).toBeDefined();
        expect(dayCmd.handle).toBeDefined();

        await dayCmd.handle([], context, eventBus, 'day');
        expect(util.day).toHaveBeenCalledTimes(1);
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'It is **Fredas**' }));
    });
});

describe('Lore month command', () => {
    it('accepts the \'month\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        calendar(facade, logger);
        const monthCmd = commands.find(it => it.name === 'Lore month');
        expect(monthCmd).toBeDefined();
        expect(monthCmd.accept).toBeDefined();
        expect(monthCmd.accept('month')).toBe(true);
    });

    it('generates suitable outputs', async () => {
        spyOn(util, 'month').and.returnValue('Frostfall');

        calendar(facade, logger);
        const monthCmd = commands.find(it => it.name === 'Lore month');
        expect(monthCmd).toBeDefined();
        expect(monthCmd.handle).toBeDefined();

        await monthCmd.handle([], context, eventBus, 'month');
        expect(util.month).toHaveBeenCalledTimes(1);
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'It is **Frostfall**' }));
    });
});

describe('Lore date command', () => {
    it('accepts the \'date\' command', () => {
        expect(facade.addCommand).not.toHaveBeenCalled();
        calendar(facade, logger);
        const dateCmd = commands.find(it => it.name === 'Lore date');
        expect(dateCmd).toBeDefined();
        expect(dateCmd.accept).toBeDefined();
        expect(dateCmd.accept('date')).toBe(true);
    });

    it('generates suitable outputs', async () => {
        spyOn(util, 'date').and.returnValue("Full date string from library");

        calendar(facade, logger);
        const dayCmd = commands.find(it => it.name === 'Lore date');
        expect(dayCmd).toBeDefined();
        expect(dayCmd.handle).toBeDefined();

        await dayCmd.handle([], context, eventBus, 'date');
        expect(util.date).toHaveBeenCalledTimes(1);
        expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({ content: 'It is Full date string from library' }));
    });
});
