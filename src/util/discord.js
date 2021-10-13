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
 * @returns {boolean}
 */
const isTextChannel = (channel, allowThreads) => channel.isText() || (allowThreads && channel.isThread()); // TEST ME

/**
 * 
 * @param {Client} client Discord client
 * @param {string} snowflake Channel snowflake for a text channel (or thread if allowed).
 * @param {boolean} allowThreads Whether threads should count as a text channel.
 * @returns {Promise<TextChannel>}
 */
const fetchTextChannel = async (client, snowflake, allowThreads) => client.channels.fetch(snowflake) // TEST ME
    .then(ch => new Promise((resolve, reject) => isTextChannel(ch, allowThreads)
        ? resolve(ch)
        : reject(new Error(snowflake + " is not a text channel"))));

/**
 * Get a text channel.
 * 
 * @param {Client} client Discord client
 * @param {string|Channel} channel A channel snowflake or an existing Channel
 * @param {boolean} allowThreads Whether to allow a thread to be considered when a snowflake is provided.
 * @returns {Promise<TextChannel>}
 */
export const getTextChannel = async (client, channel, allowThreads = true) => typeof channel === 'string' // TEST ME
    ? fetchTextChannel(client, channel, allowThreads)
    : Promise.resolve(channel);
