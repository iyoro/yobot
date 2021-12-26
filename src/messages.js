/** @typedef {import('../facade').default} Facade */
/** @typedef {import('discord.js').Message} Message */

/**
 * Check if a channel is suitable for command handling.
 * 
 * @param {Channel} channel The channel to check. 
 * @param {object} config Influences what is allowed.
 * @returns boolean Whether commands may be processed in this channel.
 */
const isValidChannel = (channel, config) => {
    return channel.isText() && (
        channel.type === 'GUILD_TEXT'
        || (channel.isThread() && config.allowThreads)
        || (channel.type === 'DM' && config.allowDms)
    );
};

/**
 * Initialises message handling against the given facade.
 *
 * @param {Facade} facade Bot command facade
 */
export default facade => ({
    /**
     * Process an incoming message in a text channel.
     * 
     * @param {Message} message 
     */
    onMessage: message => {
        if (message.author.bot) { return; }
        if (!isValidChannel(message.channel, facade.config)) { return; }
        if (!message.content.startsWith(facade.config.commandPrefix)) { return; }
        if (!/^.\S/.test(message.content)) { return; } // Ignores "! foo"
        const parts = message.content.split(/\s/);
        const cmd = parts[0].substring(1).toLowerCase();
        const args = parts.length > 1 ? parts.slice(1) : [];
        facade.exec(message, cmd, args.join(' '));
    }
});
