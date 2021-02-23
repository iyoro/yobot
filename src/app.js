import Discord, { TextChannel } from 'discord.js'
import pino from 'pino'
import config from './config.js'
import helpCommands from './commands/help.js';
import defaultCommands from './commands/default.js';
import rollCommands from './commands/rolls.js';
const logger = pino({ level: config.logLevel })

const commands = [];
const facade = {
    config: config,
    logger: logger.child({ name: 'command' }),

    /**
     * Get all registered commands.
     * @returns {Array} commands.
     */
    getCommands() {
        console.debug("getting commands", commands);
        return commands.filter(it => it.hidden !== true)
    },

    /**
     * Send a message as a reply to another.
     *
     * @param {Discord.StringResolvable} response What to send.
     * @returns {Promise<Message|Message[]>}
     */
    send(response) {
        const p = message.channel.send(response);
        p.then(sent => logger.debug({ sent }, 'Sent message'))
            .catch(err => logger.error({ err }, 'Send message failed'))
        return p;
    },

    /**
     * Send a message as a reply to another.
     * 
     * @param {Discord.Message} message Message being replied-to.
     * @param {Discord.StringResolvable} ressponse What to reply with.
     * @returns {Promise<Message|Message[]>}
     */
    reply(message, response) {
        const p = message.channel.send(response, { reply: message });
        p.then(sent => logger.debug({ sent }, 'Sent reply'))
            .catch(err => logger.error({ err }, 'Send reply failed'))
        return p;
    }
}

const prov = [rollCommands, helpCommands, defaultCommands];
prov.map(provider => provider(facade)).flat().forEach(it => commands.push(it));

const onMessage = message => {
    if (!(message.channel instanceof TextChannel)) { return }
    if (message.author.bot) { return }
    if (!/dice|roll/.test(message.channel.name)) { return }
    if (!message.content.startsWith(config.commandPrefix)) { return }
    if (!/^.\S/.test(message.content)) { return } // Ignores "! foo"
    const parts = message.content.split(/\s/);
    const cmd = parts[0].substring(1);
    const args = parts.length > 1 ? parts.slice(1) : [];
    commands.find(it => it.accept(cmd)).handle(message, args, cmd, facade);
}

const client = new Discord.Client();
client.once('invalidated', () => {
    logger.info('Client invalidated, shutting down');
    process.exit(2);
});
client.on('rateLimit', limits => logger.info({ limits }, 'Rate limited'));
client.on('error', err => logger.error({ err }, 'Client error'));
client.on('message', onMessage);

client.login(config.clientToken)
    .then(() => logger.info('Client logged in'))
    .catch(error => {
        logger.error(error, 'Client login failed');
        process.exit(1);
    });

process.once('SIGINT', () => {
    logger.info("Closing down");
    client.destroy();
    process.exit(0);
});
/**/