/** @typedef {import('discord.js').Message} Message */
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

    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
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
     * @param {Discord.TextChannel} channel Where to send.
     * @param {string|Discord.MessagePayload|Discord.MessageOptions} content What to send.
     * @returns {Promise<Message|Message[]>}
     */
    send(channel, content) {
        const p = channel.send(content);
        p.then(sent => this.logger.debug({ sent }, 'Sent message'))
            .catch(err => this.logger.error({ err }, 'Send message failed'));
        return p;
    }

    /**
     * Send a a message as a reply to another.
     * 
     * @param {Discord.Message} message Message being replied-to.
     * @param {string|Discord.MessagePayload|Discord.MessageOptions} content What to reply with.
     * @returns {Promise<Message|Message[]>}
     */
    reply(message, content) {
        let payload = (typeof content === 'string') ? { content } : content;
        const p = message.channel.send({ ...payload, reply: { messageReference: message } });
        p.then(sent => this.logger.debug({ sent }, 'Sent reply'))
            .catch(err => this.logger.error({ err }, 'Send reply failed'));
        return p;
    }
}
