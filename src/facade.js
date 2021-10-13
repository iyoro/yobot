/** @typedef {import('discord.js').Message} Message */

import { getTextChannel } from './util/discord.js';

/** 
 * Command object.
 * @typedef Command
 * @property {function(string):boolean} accept Acceptance function. It is given the command name, lowercased, to test
 * if the command's handler can process it.
 * @property {function(Message, string, string):Promise<Message|Message[]>} handle Message handling function
 * @property {string} name Command name for humans/help.
 * @property {string} description Command description/usage info
 * @property {boolean} hidden Whether the command is visible externally
*/
export default class Facade {

    constructor(config, logger, client) {
        this.config = config;
        this.logger = logger;
        this.client = client;
        /**
         * @type Array<Command>
         * */
        this.commands = [];
    }

    /**
     * Add a command to the bot.
     * 
     * @param {Command} command Command definition.
     */
    addCommand(command) {
        this.logger.debug({ command: command.name, action: "register" });
        this.commands.push(command);
    }

    /**
     * Get all registered commands.
     * @param {boolean} withHidden Whether to include hidden commands.
     * @returns {Array<Command>} commands.
     */
    getCommands(withHidden = false) {
        // TODO only enabled commands regardless of hidden filter
        return withHidden ? this.commands : this.commands.filter(it => it.hidden !== true);
    }

    /**
     * Execute one of the bot's commands.
     * 
     * @param {Discord.Message} message Triggering messsage
     * @param {string} cmd Command word
     * @param {Array<string>} args Other string tokens from the message
     */
    exec(message, cmd, args) {
        // N.b. param order is args then command - commands mostly already know what they are.
        this.logger.debug({ command: cmd, args }, "Try to exec");
        this.getCommands(true).find(it => it.accept(cmd)).handle(message, args, cmd);
    }

    /**
     * Send a message.
     *
     * @param {Discord.TextChannel|string} channel Where to send, either the TextChannel or a channel ID as a string.
     * @param {string|Discord.MessagePayload|Discord.MessageOptions} content What to send.
     * @returns {Promise<Message|Message[]>}
     */
    async send(channel, content) {
        return getTextChannel(this.client, channel, this.config.allowThreads, this.config.allowDms)
            .then(ch => ch.send(content))
            .then(sent => {
                this.logger.debug({ sent }, 'Sent message');
                return sent;
            });
    }

    /**
     * Send a a message as a reply to another.
     * 
     * @param {Discord.Message} message Message being replied-to.
     * @param {string|Discord.MessagePayload|Discord.MessageOptions} content What to reply with.
     * @returns {Promise<Message|Message[]>}
     */
    async reply(message, content) {
        let payload = (typeof content === 'string') ? { content } : content;
        return message.channel.send({ ...payload, reply: { messageReference: message } })
            .then(sent => this.logger.debug({ sent }, 'Sent reply'));
    }

    /**
     * Send a log message to discord as a chat message to the configured log channel.
     * 
     * @param {Discord.client} client 
     * @param {any} message Message content to send.
     */
    log(client, message, alsoLogInfo = true) {
        // TODO requires test coverage
        if (this.config.logChannel) {
            if (alsoLogInfo) {
                this.logger.info(message);
            }
            client.channels.fetch(this.config.logChannel).then(ch => {
                if (ch.isText() || ch.isThread()) {
                    ch.send(message);
                } else {
                    this.logger.error("Tried to log to non-text/thread channel", { message });
                }
            });
        }
    }
}
