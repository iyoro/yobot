/**
 * @file Providees a command which catches anything and ignores it.
 */
/** @typedef {import('../facade').default} Facade */

/**
 * Adds commands to the bot facade.
 * 
 * @param {Facade} facade Bot command facade 
 * @param {Logger} logger Logger for this set of commands.
 */
export default (facade, logger) => {
    facade.addCommand({
        name: 'Default',
        description: 'It is a mystery',
        accept: () => true,
        hidden: true,
        handle: (message, args, cmd) => {
            logger.debug({ cmd, args, text: message.content }, "Unhandled command");
        }
    });
};
