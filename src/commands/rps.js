/**
 * @file Provides a dice roll commands to play rock, paper, scissors.
 */
/** @typedef {import('../facade').default} Facade */
/** @typedef {import('discord.js').Message } Message */
import rps from '../util/rps.js';

const common = (theme, facade, logger) => async (message, args) => {
    logger.debug({ args, theme }, "Rock, paper, scissors");
    return facade.reply(message, rps.play(theme));
};

/**
 * Adds commands to the bot facade.
 *
 * @param {Facade} facade Bot command facade
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade, logger) => {
    facade.addCommand({
        icon: ':rock:',
        name: 'Rock, paper, scissors',
        description: 'Randomly picks one of three values from the well-known three-way tie-breaker game.',
        accept: (cmd) => cmd === 'rps',
        handle: common('rps', facade, logger),
    });

    facade.addCommand({
        name: 'Soulgem, parchment, shears',
        hidden: true,
        accept: (cmd) => cmd === 'sps',
        handle: common('sps', facade, logger),
    });
};
