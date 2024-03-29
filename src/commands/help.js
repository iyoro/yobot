/**
 * @file Providees a help command to explain all the other commands, using their names and descriptions.
 */
/** @typedef {import('../commands').Commands} Commands */

import Events from '../bus/events.js';
import { contextId } from '../util/discord.js';

// Last time help was requested.
let lastHelpTime = {};

/**
 * Adds commands to the bot registry.
 * 
 * @param {Commands} commands Bot command registry 
 * @param {Logger} logger Logger for this set of commands.
 */
export default (commands, logger) => {
  commands.addCommand({
    icon: ':round_pushpin:',
    name: 'Help',
    description: '`!help` You are here.',
    accept: (cmd) => cmd === 'help',
    handle: async (args, context, eventBus) => {
      const mid = contextId(context);
      if (lastHelpTime[mid] == null) {
        lastHelpTime[mid] = 0;
      }
      const cooldown = context.timestamp > (lastHelpTime[mid] + 60000);
      logger.debug({ memberOrAuthor: mid, command: 'help', cooldown });
      if (cooldown) {
        const availableCmds = commands.getCommands();
        const embed = {
          title: 'Bot help',
          url: 'https://github.com/iyoro/yobot#readme',
          description: 'Hi! These are the commands I understand. Click on the link above for complete documentation.',
          // Future problem: max 25 fields are allowed in a message.
          fields: availableCmds.map(command => ({
            name: `${command.icon ? command.icon : ':exclamation:'} ${command.name}`,
            value: command.description,
          })),
          footer: 'Made for you with <3',
        };
        lastHelpTime[mid] = context.timestamp;
        eventBus.notify(Events.COMMAND_RESULT, { content: { embeds: [embed] }, context });
      }
    }
  });
};
