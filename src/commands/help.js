import { MessageEmbed } from 'discord.js'

// Last time help was requested. TODO multiserver: needs to be a map, keyed by guild.
let lastHelpTime = 0

export default (facade) => {
    const logger = facade.logger;
    let embed;
    const getEmbed = () => {
        if (!embed) {
            const commands = facade.getCommands();
            embed = new MessageEmbed()
                .setTitle('Bot help')
                .setURL('https://github.com/iyoro/yobot#readme')
                .setDescription('Hi! These are the commands I understand. Click on the link above for complete documentation.');
            for (let cmd in commands) {
                const command = commands[cmd];
                embed.addField(command.name, command.description);
            }
            embed.setTimestamp()
                .setFooter('Made for you with <3');
        }
        return embed;
    };
    return [
        {
            name: ':round_pushpin: Help',
            description: '`!help` You are here.',
            accept: (cmd) => cmd === 'help',
            handle: (message, args, cmd) => {
                logger.debug({ member: message.member.id, command: 'help' })
                if (message.createdTimestamp > (lastHelpTime + 60_000)) {
                    facade.send(message.channel, getEmbed()).then(() => lastHelpTime = message.createdTimestamp)
                }
            }
        },
    ];
};
