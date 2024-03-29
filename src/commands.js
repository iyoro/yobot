/** @file Responds to events coming from Discord and executes bot commands. */
/** @typedef {import('./bus/eventbus.js').EventBus} EventBus */

import Events from './bus/events.js';

export default (eventBus, logger, config, commandGroups) => {
  const commands = new Commands(config, eventBus, logger);
  for (let group in commandGroups) {
    commandGroups[group](commands, logger.child({ group }), config);
  }
};

/** 
 * Command object.
 * @typedef Command
 * @property {function(string):boolean} accept Acceptance function. It is given the command name, lowercased, to test
 * if the command's handler can process it.
 * @property {function(Array<string>, object, EventBus, string):void} handle Message handling function
 * @property {string} name Command name for humans/help.
 * @property {string} description Command description/usage info
 * @property {boolean} hidden Whether the command is visible externally
*/
export class Commands {

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

  async notify(evt) {
    const { command, args, context } = evt;
    this.exec(command, args, context);
  }

  /**
   * Add a command to the bot.
   * 
   * @param {Command} command Command definition.
   */
  addCommand(command) {    
    const toggle = this.config.command?.toggle[command.name] ?? false;
    this.logger.debug({ command: command.name, toggle, action: "register" });
    if (toggle) {
      this.commands.push(command);
    }
  }

  /**
   * Get all registered commands.
   * @param {boolean} withHidden Whether to include hidden commands.
   * @returns {Array<Command>} commands.
   */
  getCommands(withHidden = false) {
    return withHidden ? this.commands : this.commands.filter(it => it.hidden !== true);
  }

  /**
   * Execute one of the bot's commands.
   * 
   * @param {string} command Command word
   * @param {Array<string>} args Other string tokens from the message.
   * @param {string} context An opaque context for where the command came from.   
   */
  async exec(command, args, context) {
    // N.b. param order when invoking the handler is args, helpers, then the command, since commands mostly already know what they are and can omit the last param.
    this.getCommands(true).find(it => it.accept(command)).handle(args, context, this.eventBus, command);
  }
}
