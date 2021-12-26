/** @file Responds to events coming from Discord and executes bot commands. */
/** @typedef {import('discord.js').Message} Message */

import commandGroups from './commands/index.js';
import Events from './events.js';

export default (config, eventBus, logger) => {
  const facade = new Facade(config, eventBus, logger);
  for (let group in commandGroups) {
    commandGroups[group](facade, logger.child({ group }));
  }
};

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
class Facade { // TODO rename

  constructor(config, eventBus, logger) {
    this.config = config;
    this.eventBus = eventBus;
    this.logger = logger;

    eventBus.addListener(this);

    /**
     * @type Array<Command>
     * */
    this.commands = [];
  }

  accept(type) {
    return type === Events.COMMAND;
  }

  notify(evt) {
    this.onCommand(evt);
  }

  onCommand({ command, args, context }) {
    this.exec(command, args, context);
  }

  /**
   * Add a command to the bot.
   * 
   * @param {Command} command Command definition.
   */
  addCommand(command) {
    this.logger.debug({ command: command.name, action: "register" });
    this.commands.push(command); // TODO is this registry needed?
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
   * @param {string} command Command word
   * @param {Array<string>} args Other string tokens from the message.
   * @param {string} context An opaque context for where the command came from.   
   */
  exec(command, args, context) {
    // N.b. param order when invoking the handler is args, helpers, then the command, since commands mostly already know what they are and can omit the last param.
    this.getCommands(true).find(it => it.accept(command)).handle(args, context, this.eventBus, command);
  }

  /**
   * Send a message.
   *
   * @param {Discord.TextChannel|string} channel Where to send, either the TextChannel or a channel ID as a string.
   * @param {string|Discord.MessagePayload|Discord.MessageOptions} content What to send.
   * @returns {Promise<Message|Message[]>}
   */
  /* async send(channel, content) {
    return getTextChannel(this.client_TODO_REMOVE_ME, channel, this.config.allowThreads, this.config.allowDms)
      .then(ch => ch.send(content))
      .then(sent => {
        this.logger.debug({ sent }, 'Sent message');
        return sent;
      });
  } */

  /**
   * Send a a message as a reply to another.
   * 
   * @param {Discord.Message} message Message being replied-to.
   * @param {string|Discord.MessagePayload|Discord.MessageOptions} content What to reply with.
   * @returns {Promise<Message|Message[]>}
   */
 /*  async reply(message, content) {
    let payload = (typeof content === 'string') ? { content } : content;
    return message.channel.send({ ...payload, reply: { messageReference: message } })
      .then(sent => this.logger.debug({ sent }, 'Sent reply'));
  } */

  /**
   * Send a log message to discord as a chat message to the configured log channel.
   * 
   * @param {Discord.client} client 
   * @param {any} message Message content to send.
   */
 /*  log(client, message) {
    // TODO requires test coverage
    if (this.config.logChannel) {
      client.channels.fetch(this.config.logChannel).then(ch => {
        if (ch.isText() || ch.isThread()) {
          ch.send(message);
        } else {
          this.logger.error("Tried to log to non-text/thread channel", { message });
        }
      });
    }
  } */
}
