/**
 * @file Provides a dice roll commands to roll dice.
 */
/** @typedef {import('../commands').Commands} Commands */
import Events from '../bus/events.js';
import { contextId } from '../util/discord.js';
import rolls from '../util/rolls.js';

/**
 * Somewhere to store who-last-rolled-what.
 * @constant
 * @type {object}
 */
const lastRoll = {};

const separateRollArgs = args => {
  // Separate off a possible 'comment' at the end.
  let expr, suffix;
  if (args == null) {
    expr = '';
    suffix = '';
  } else {
    const argStr = args.join(' ');
    const pos = argStr.indexOf('#');

    if (pos > -1) {
      expr = argStr.substr(0, pos).trim();
      suffix = argStr.substr(pos + 1).trim();
    } else {
      expr = argStr;
      suffix = '';
    }
  }
  return { expr, suffix };
};

/**
 * Adds commands to the bot commands registry.
 *
 * @param {Commands} commands Bot command registry
 * @param {Logger} logger Logger for this set of commands.
 */
export default (commands, logger, config) => {
  const prefix = config.commandPrefix;

  /**
   * Does a roll, including producing a user-facing error message due to e.g. bad expressions.
   * 
   * @param {string} expr Dice expression
   * @param {string} contexId Originating member or author identifier.
   */
  const doRoll = (expr, contexId) => {
    let result;
    try {
      result = rolls.roll(expr);
    } catch (err) { // RollError
      if (err.quiet) {
        logger.info({ expr, contexId }, err.message);
      } else {
        logger.error({ expr, contexId, err }, err.message);
      }
      result = err.userMessage;
    }
    return result;
  };


  /**
   * Common parts of doing a roll e.g. handling user suffix.
   * 
   * @param {string} expr Roll expression
   * @param {string} suffix Message suffix
   * @param {string} contextId Context of the roll (who, where).
   */
  const rollCommon = (expr, suffix, contextId) => {
    const result = doRoll(expr, contextId);
    return suffix.length === 0 ? result : `${result} (${suffix})`;
  };

  commands.addCommand({
    icon: ':game_die:',
    name: 'Roll',
    description: 'Roll dice with expressions made of dice and fixed values, e.g.'
      + `\`${prefix}roll 4d6+2\` and optionally including a message on the end with \`# attack the skeleton\``,
    accept: cmd => cmd === 'roll',
    handle: async (args, context, eventBus) => {
      const cId = contextId(context);
      logger.debug({ args, cId }, "Roll");
      const { expr, suffix } = separateRollArgs(args);
      const result = rollCommon(expr, suffix, cId);
      lastRoll[cId] = args;
      eventBus.notify(Events.COMMAND_RESULT, { context, content: result });
    }
  });

  commands.addCommand({
    icon: ':arrows_counterclockwise:',
    name: 'Reroll',
    description: `\`${prefix}${prefix}\` Repeat your last ${prefix}roll. Maybe the next one will be better...`,
    accept: cmd => cmd === prefix, // i.e. react to !! if prefix is !
    handle: async (newArgs, context, eventBus) => {
      const cId = contextId(context);
      logger.debug({ args: newArgs, cId }, "Reroll");
      const oldArgs = lastRoll[cId];
      let result;
      if (oldArgs == null) {
        result = 'try rolling something first';
      } else {
        // Priority to suffix on this command, fall back to previous.
        const { suffix: newSuffix } = separateRollArgs(newArgs);
        const { expr, suffix: oldSuffix } = separateRollArgs(oldArgs);
        const suffix = newSuffix.length === 0 ? oldSuffix : newSuffix;
        if (suffix !== oldSuffix) {
          lastRoll[cId] = [expr, '#', suffix];
        }
        result = rollCommon(expr, suffix, cId);
      }
      eventBus.notify(Events.COMMAND_RESULT, { context, content: result });
    }
  });
};
