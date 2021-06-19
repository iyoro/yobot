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
export default (facade, logger) => {
    logger.debug("Adding calendar commands");
    facade.addCommand({
        icon: ':calendar:',
        name: 'Lore day',
        description: '`!day` Gets the current in-character lore day.',
        accept: cmd => cmd === 'day',
        handle: async message => facade.reply(message, `It is ${calendar.day()}`),
    });
};
