/**
 * @file Provides calendar, date and time related commands.
 */
/** @typedef {import('../facade').default} Facade */
/** @typedef {import('discord.js').Message } Message */
import calendar from '../util/calendar.js';

/**
 * Adds commands to the bot facade.
 *
 * @param {Facade} facade Bot command facade
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade) => {
    facade.addCommand({
        icon: ':calendar:',
        name: 'Lore day',
        description: '`!day` Gets the current in-character lore day.',
        accept: cmd => cmd === 'day',
        handle: async message => facade.reply(message, `It is **${calendar.day(new Date())}**`),
    });
    facade.addCommand({
        icon: ':full_moon:',
        name: 'Lore month',
        description: '`!month` Gets the current in-character month.',
        accept: cmd => cmd === 'month',
        handle: async message => facade.reply(message, `It is **${calendar.month(new Date())}**`),
    });
    facade.addCommand({
        icon: ':calendar_spiral:',
        name: 'Lore date',
        description: '`!date` Gets the current in-character lore date.',
        accept: cmd => cmd === 'date',
        handle: async message => facade.reply(message, `It is ${calendar.date(new Date())}`),
    });
    facade.addCommand({
        icon: ':last_quarter_moon:',
        name: 'Lore months',
        description: '`!months` Gets a list of lore months with the current in-character month highlighted.',
        accept: cmd => cmd === 'months',
        handle: async message => facade.reply(message, 'Here you go!\n' + calendar.months(new Date())),
    });
};
