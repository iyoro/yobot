/**
 * @file Providees a help command to explain all the other commands, using their names and descriptions.
 */
/** @typedef {import('../facade').default} Facade */

import { MessageEmbed } from 'discord.js'

// Last time help was requested. TODO multiserver: needs to be a map, keyed by guild.
let lastHelpTime = 0

/**
 * Adds commands to the bot facade.
 * 
 * @param {Facade} facade Bot command facade 
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade, logger) => {
    facade.addCommand({
        name: ':round_pushpin: Help',
        description: '`!help` You are here.',
        accept: (cmd) => cmd === 'help',
        handle: (message) => {
            const cooldown = message.createdTimestamp > (lastHelpTime + 60000);
            logger.debug({ member: message.member.id, command: 'help', cooldown });
            if (cooldown) {
                const commands = facade.getCommands();
                const embed = new MessageEmbed()
                    .setTitle('Bot help')
                    .setURL('https://github.com/iyoro/yobot#readme')
                    .setDescription('Hi! These are the commands I understand. Click on the link above for complete documentation.');
                for (let cmd in commands) {
                    const command = commands[cmd];
                    embed.addField(command.name, command.description);
                }
                embed.setTimestamp().setFooter('Made for you with <3');
                facade.send(message.channel, embed).then(() => lastHelpTime = message.createdTimestamp)
            }
        }
    });
};
