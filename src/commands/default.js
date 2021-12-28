/**
 * @file Providees a command which catches anything and ignores it.
 */
/** @typedef {import('../commands').Commands} Commands */

/**
 * Adds commands to the bot registry.
 * 
 * @param {Commands} commands Bot command registry 
 * @param {Logger} logger Logger for this set of commands.
 */
export default (commands, logger) => {
  commands.addCommand({
    icon: ':question:',
    name: 'Default',
    description: 'It is a mystery',
    accept: () => true,
    hidden: true,
    handle: async (message, args, cmd) => {
      logger.info({ cmd, args, text: message.content }, "Unhandled command");
    }
  });
};
