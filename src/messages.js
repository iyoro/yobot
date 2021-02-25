/** @typedef {import('../facade').default} Facade */
/** @typedef {import('discord.js').Message} Message */
import { TextChannel } from 'discord.js';

/**
 * Initialises message handling against the given facade.
 *
 * @param {Facade} facade Bot command facade
 */
export default facade => ({
    /**
     * Process an incoming message.
     * 
     * @param {Message} message 
     */
    onMessage: message => {
        if (!(message.channel instanceof TextChannel)) { return }
        if (message.author.bot) { return }
        if (!/dice|roll/.test(message.channel.name)) { return }
        if (!message.content.startsWith(facade.config.commandPrefix)) { return }
        if (!/^.\S/.test(message.content)) { return } // Ignores "! foo"
        const parts = message.content.split(/\s/);
        const cmd = parts[0].substring(1);
        const args = parts.length > 1 ? parts.slice(1) : [];
        facade.exec(message, cmd, args);
    }
});
