/**
 * @file Provides calendar, date and time related commands.
 */
/** @typedef {import('../commands').Commands} Commands */
import Events from '../bus/events.js';
import calendar from '../util/calendar.js';

/**
 * Adds commands to the bot command registry.
 *
 * @param {Commands} commands Bot command registry
 */
export default commands => {
    commands.addCommand({
        icon: ':calendar:',
        name: 'Lore day',
        description: '`!day` Gets the current in-character lore day.',
        accept: cmd => cmd === 'day',
        handle: async (args, context, eventBus) => eventBus.notify(Events.COMMAND_RESULT, { context, content: `It is **${calendar.day(new Date())}**` }),
    });
    commands.addCommand({
        icon: ':full_moon:',
        name: 'Lore month',
        description: '`!month` Gets the current in-character month.',
        accept: cmd => cmd === 'month',
        handle: async (args, context, eventBus) => eventBus.notify(Events.COMMAND_RESULT, { context, content: `It is **${calendar.month(new Date())}**` }),
    });
    commands.addCommand({
        icon: ':calendar_spiral:',
        name: 'Lore date',
        description: '`!date` Gets the current in-character lore date.',
        accept: cmd => cmd === 'date',
        handle: async (args, context, eventBus) => eventBus.notify(Events.COMMAND_RESULT, { context, content: `It is ${calendar.date(new Date())}` }),
    });
    commands.addCommand({
        icon: ':last_quarter_moon:',
        name: 'Lore months',
        description: '`!months` Gets a list of lore months with the current in-character month highlighted.',
        accept: cmd => cmd === 'months',
        handle: async (args, context, eventBus) => eventBus.notify(Events.COMMAND_RESULT, { context, content: 'Here you go!\n' + calendar.months(new Date()) }),
    });
};
