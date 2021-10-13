/**
 * @file Provides a dice roll commands to roll dice.
 */
/** @typedef {import('../facade').default} Facade */
/** @typedef {import('discord.js').Message } Message */
import rolls from '../util/rolls.js';

/**
 * Somewhere to store who-last-rolled-what.
 * @constant
 * @type {object}
 */
const lastRoll = {};

const separateRollArgs = args => {
    // Separate off a possible 'comment' at the end.
    const pos = args.indexOf('#');
    let expr, suffix;
    if (pos > -1) {
        expr = args.substr(0, pos).trim();
        suffix = args.substr(pos + 1).trim();
    } else {
        expr = args;
        suffix = '';
    }
    return { expr, suffix };
};

/**
 * Get the memory/cache key for a message. This is either the guild member ID (guild messages) or the author ID (DMs).
 * 
 * @param {Message} message A message that was received.
 * @returns A key to use for caching/memorising things about it.
 */
const memberOrAuthorKey = message => message.member
    ? 'M:' + message.member.id
    : 'A:' + message.author.id;

/**
 * Adds commands to the bot facade.
 *
 * @param {Facade} facade Bot command facade
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade, logger) => {
    const prefix = facade.config.commandPrefix;

    /**
     * Does a roll, including producing a user-facing error message due to e.g. bad expressions.
     * 
     * @param {string} expr Dice expression
     * @param {string} memberOrAuthor Originating member or author identifier.
     */
    const doRoll = (expr, memberOrAuthor) => {
        let result;
        try {
            result = rolls.roll(expr);
        } catch (err) { // RollError
            if (err.quiet) {
                logger.info({ args: expr, memberOrAuthor }, err.message);
            } else {
                logger.error({ args: expr, memberOrAuthor, err }, err.message);
            }
            result = err.userMessage;
        }
        return result;
    };

    /**
     * Common parts of doing a roll e.g. handling user suffix.
     * 
     * @param {string} args Roll command args i.e. what to roll, any suffixes.
     * @param {string} message Resulting message from performing the roll.
     */
    const rollCommon = (args, message) => {
        let { expr, suffix } = separateRollArgs(args);
        const result = doRoll(expr, memberOrAuthorKey(message));
        return suffix ? `${result} (${suffix})` : result;
    };

    facade.addCommand({
        icon: ':game_die:',
        name: 'Roll',
        description: 'Roll dice with expressions made of dice and fixed values, e.g.'
            + `\`${prefix}roll 4d6+2\` and optionally including a message on the end with \`# attack the skeleton\``,
        accept: (cmd) => cmd === 'roll',
        handle: async (message, args) => {
            logger.debug({ args }, "Roll");
            const result = rollCommon(args, message);
            return facade.reply(message, result)
                .then(ret => {
                    lastRoll[memberOrAuthorKey(message)] = args;
                    return ret;
                });
        }
    });

    facade.addCommand({
        icon: ':arrows_counterclockwise:',
        name: 'Reroll',
        description: `\`${prefix}${prefix}\` Repeat your last ${prefix}roll. Maybe the next one will be better...`,
        accept: (cmd) => cmd === prefix, // i.e. react to !! if prefix is !
        handle: async (message, args) => {
            logger.debug({ args }, "Reroll");
            const last = lastRoll[memberOrAuthorKey(message)];
            return facade.reply(message, last != null ? rollCommon(last, message) : 'try rolling something first');
        }
    });
};
