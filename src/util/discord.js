/** @file Discord related util functions. */
/** @typedef {import('discord.js').Client} Client */
/** @typedef {import('discord.js').Channel} Channel */
/** @typedef {import('discord.js').TextChannel} TextChannel */

/**
 * Get a text channel.
 * 
 * @param {Client} client Discord client instance.
 * @param {string|Channel} channel A channel or a snowflake.
 * @param {boolean} allowThreads Whether threads are considered as valid text channels.
 * @returns {Promise<TextChannel>}
 */

/**
 * Test if a channel is a text channel.
 * 
 * @param {Channel} channel Channel to test
 * @param {boolean} allowThreads Whether threads count as text channels.
 * @param {boolean} allowDms Whether DMs count as text channels.
 * @returns {boolean}
 */
const isTextChannel = (channel, allowThreads, allowDms) => channel.isText()
    && (channel.isThread() ? allowThreads : true)
    && (channel.type === 'DM' ? allowDms : true);

/**
 * 
 * @param {Client} client Discord client
 * @param {string} snowflake Channel snowflake for a text channel (or thread if allowed).
 * @param {boolean} allowThreads Whether threads should count as a text channel.
 * @param {boolean} allowDms Whether DMs should count as a text channel.
 * @returns {Promise<TextChannel>}
 */
const fetchTextChannel = async (client, snowflake, allowThreads, allowDms) => client.channels.fetch(snowflake)
    .then(ch => new Promise((resolve, reject) => isTextChannel(ch, allowThreads, allowDms)
        ? resolve(ch)
        : reject(new Error(snowflake + " is not a text channel"))));

/**
 * Get a text channel.
 * 
 * @param {Client} client Discord client
 * @param {string|Channel} channel A channel snowflake or an existing Channel
 * @param {boolean} allowThreads Whether to allow a thread to be considered when a snowflake is provided.
 * @param {boolean} allowDms Whether to allow a DM to be considered when a snowflake is provided.
 * @returns {Promise<TextChannel>}
 */
export const getTextChannel = async (client, channel, allowThreads = true, allowDms = true) => typeof channel === 'string'
    ? fetchTextChannel(client, channel, allowThreads, allowDms)
    : Promise.resolve(channel);
