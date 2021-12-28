/**
 * @file Provides a dice roll commands to play rock, paper, scissors.
 */
/** @typedef {import('../commands').Commands} Commands */
import Events from '../bus/events.js';
import rps from '../util/rps.js';

const common = (theme, logger) => async (args, context, eventBus) => {
    logger.debug({ args }, "Rock, paper, scissors");
    eventBus.notify(Events.COMMAND_RESULT, { context, content: rps.play(theme) });
};

/**
 * Adds commands to the bot commands registry.
 *
 * @param {Commands} commands Bot command registry
 * @param {Logger} logger Logger for this set of commands.
 */
export default (commands, logger) => {
    commands.addCommand({
        icon: ':rock:',
        name: 'Rock, paper, scissors',
        description: '`!rps` Randomly picks one of three values from the well-known three-way tie-breaker game. '
            + 'Alternatively, use `!spc` to get soulgem, parchment, clippers.',
        accept: cmd => cmd === 'rps',
        handle: common('rps', logger.child({ command: 'rps' })),
    });

    commands.addCommand({
        name: 'Soulgem, parchment, clippers',
        hidden: true,
        accept: cmd => cmd === 'spc',
        handle: common('spc', logger.child({ command: 'spc' })),
    });
};
