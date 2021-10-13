/** @typedef {import('../facade').default} Facade */
/** @typedef {import('discord.js').Message} Message */

/**
 * Check if a channel is suitable for command handling.
 * 
 * @param {Channel} channel 
 * @param {object} config 
 * @returns boolean
 */
const isValidChannel = (channel, config) => {
    return channel.isText()
        && (channel.isThread() ? config.allowThreads : true)
        && (channel.type === 'DM' ? config.allowDms : true)
        && (config.channelPattern.test(channel.name) ? true : channel.type !== 'GUILD_TEXT');
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
