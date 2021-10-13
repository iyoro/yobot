/**
 * @file Providees a help command to explain all the other commands, using their names and descriptions.
 */
/** @typedef {import('../facade').default} Facade */

import { MessageEmbed } from 'discord.js';
import { memberOrAuthorId } from '../util/discord.js';

// Last time help was requested. TODO multiserver: needs to be a map, keyed by guild.
let lastHelpTime = {};

/**
 * Adds commands to the bot facade.
 * 
 * @param {Facade} facade Bot command facade 
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade, logger) => {
    facade.addCommand({
        icon: ':round_pushpin:',
        name: 'Help',
        description: '`!help` You are here.',
        accept: (cmd) => cmd === 'help',
        handle: async message => {
            const mid = memberOrAuthorId(message);
            if (lastHelpTime[mid] == null) {
                lastHelpTime[mid] = 0;
            }
            const cooldown = message.createdTimestamp > (lastHelpTime[mid] + 60000);
            logger.debug({ memberOrAuthor: mid, command: 'help', cooldown });
            if (cooldown) {
                const commands = facade.getCommands();
                const embed = new MessageEmbed()
                    .setTitle('Bot help')
                    .setURL('https://github.com/iyoro/yobot#readme')
                    .setDescription('Hi! These are the commands I understand. Click on the link above for complete documentation.');
                for (let cmd in commands) {
                    const command = commands[cmd];
                    embed.addField(`${command.icon ? command.icon : ':exclamation:'} ${command.name}`, command.description);
                }
                embed.setTimestamp().setFooter('Made for you with <3');
                return facade.reply(message, { embeds: [embed] }).then(() => lastHelpTime[mid] = message.createdTimestamp);
            }
        }
    });
};
