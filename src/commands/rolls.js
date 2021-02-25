/**
 * @file Providees a dice roll commands to explain all the other commands, using their names and descriptions.
 */
/** @typedef {import('../facade').default} Facade */
import rolls from '../util/rolls.js';

/**
 * Somewhere to store who-last-rolled-what.
 * @constant
 * @type {object}
 */
const lastRoll = {};

/**
 * Adds commands to the bot facade.
 *
 * @param {Facade} facade Bot command facade
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade, logger) => {
    const prefix = facade.config.commandPrefix;

    const doRoll = (args, message) => {
        let result;
        try {
            result = rolls.roll(args);
        } catch (err) { // RollError
            if (err.quiet) {
                logger.info({ args, member: message.member.id }, err.message)
            } else {
                logger.error({ args, member: message.member.id, err }, err.message)
            }
            result = err.userMessage;
        }
        return result;
    }

    facade.addCommand({
        name: ':game_die: Roll',
        description: `\`${prefix}roll 4d6+2\` Roll dice with expressions made of dice and fixed values\n`
            + 'Standard dice expressions like `d20` and `4d8` are supported. Fudge/Fate dice are supported'
            + ' with `dF`. You can use `d%` to mean `d100` (both work).'
            + ' And finally there\'s a bewildering array of modifiers like explosion, re-roll,'
            + ' keep/drop highest/lowest. Click on the title above to see the full documentation.',
        accept: (cmd) => cmd === 'roll',
        handle: (message, args) => {
            logger.debug({ args }, "Roll")
            const result = doRoll(args, message)
            const p = facade.reply(message, result);
            p.then(() => lastRoll[message.member.id] = args);
            return p;
        }
    });
    facade.addCommand({
        name: ':arrows_counterclockwise: Reroll',
        description: `\`${prefix}${prefix}\` Repeat your last ${prefix}roll. Maybe the next one will be better...`,
        accept: (cmd) => cmd === prefix, // i.e. react to !! if prefix is !
        handle: (message, args) => {
            logger.debug({ args }, "Reroll")
            const last = lastRoll[message.member.id]
            let result = last ? doRoll(last, message) : 'try rolling something first'
            return facade.reply(message, result);
        }
    });
}
