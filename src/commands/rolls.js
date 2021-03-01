/**
 * @file Provides a dice roll commands to explain all the other commands, using their names and descriptions.
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

export const separateRollArgs = (args) => {
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
     * @param {string} member Originating member identifier.
     */
    const doRoll = (expr, member) => {
        let result;
        try {
            result = rolls.roll(expr);
        } catch (err) { // RollError
            if (err.quiet) {
                logger.info({ args: expr, member }, err.message);
            } else {
                logger.error({ args: expr, member, err }, err.message);
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
        const result = doRoll(expr, message.member.id);
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
            const p = facade.reply(message, result);
            p.then(() => lastRoll[message.member.id] = args);
            return p;
        }
    });

    facade.addCommand({
        icon: ':arrows_counterclockwise:',
        name: 'Reroll',
        description: `\`${prefix}${prefix}\` Repeat your last ${prefix}roll. Maybe the next one will be better...`,
        accept: (cmd) => cmd === prefix, // i.e. react to !! if prefix is !
        handle: async (message, args) => {
            logger.debug({ args }, "Reroll");
            const last = lastRoll[message.member.id];
            return facade.reply(message, last != null ? rollCommon(last, message) : 'try rolling something first');
        }
    });
};
