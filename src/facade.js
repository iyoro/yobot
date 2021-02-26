/** @typedef {import('discord.js').Message} Message */
/** 
 * Command object.
 * @typedef Command
 * @property {function(string):boolean} accept Acceptance function
 * @property {function(Message, string, array):Promise<Message|Message[]>} handle Message handling function
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
     * @param {Discord.StringResolvable} text What to send.
     * @returns {Promise<Message|Message[]>}
     */
    send(channel, text) {
        const p = channel.send(text);
        p.then(sent => this.logger.debug({ sent }, 'Sent message'))
            .catch(err => this.logger.error({ err }, 'Send message failed'));
        return p;
    }

    /**
     * Send a message as a reply to another.
     * 
     * @param {Discord.Message} message Message being replied-to.
     * @param {Discord.StringResolvable} ressponse What to reply with.
     * @returns {Promise<Message|Message[]>}
     */
    reply(message, text) {
        const p = message.channel.send(text, { reply: message });
        p.then(sent => this.logger.debug({ sent }, 'Sent reply'))
            .catch(err => this.logger.error({ err }, 'Send reply failed'));
        return p;
    }
}
