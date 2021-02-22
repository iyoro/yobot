// This catches anything no one else caught and silently ignores them.
export default (facade) => {
    const logger = facade.logger;
    return [
        {
            name: 'Default',
            description: 'It is a mystery',
            accept: () => true,
            hidden: true,
            handle: (message, args, cmd) => {
                logger.debug({ cmd, args, text: message.content }, "Unhandled command");
            }
        },
    ];
};
