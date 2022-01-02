/**
 * @file Interface between internal app events and the Discord.js API.
 */
/** @typedef {import('discord.js').Channel} Channel */

import Discord from 'discord.js';
import Events from './bus/events.js';

/**
 * Check if a channel is suitable for command handling.
 * 
 * @param {Channel} channel The channel to check. 
 * @param {object} config Influences what is allowed.
 * @returns boolean Whether commands may be processed in this channel.
 */
export const isValidChannel = (channel, config) => {
  return channel.isText()
    && (channel.isThread() ? config.allowThreads : true)
    && (channel.type === 'DM' ? config.allowDms : true)
    && (config.channelPattern.test(channel.name) ? true : channel.type !== 'GUILD_TEXT'); // TODO remove channel pattern; server admins should use roles to control where the bot lives.
};

// These listeners/events aren't really too useful but do decouple the rest of the code from the API a bit.

export const InvalidatedListener = logger => ({
  accept: type => type === Events.Discord.INVALIDATED,
  notify: async (evt, eventBus) => {
    logger.info('Client invalidated, shutting down');
    eventBus.notify(Events.SHUTDOWN, {}).then(() => process.exit(2)); // Exit code 2: Discord client invalidated.
  },
});

export const RateLimitedListener = logger => ({
  accept: type => type === Events.Discord.RATE_LIMITED,
  notify: async ({ limits }) => logger.info({ limits }, 'Rate limited'),
});

export const ErrorListener = logger => ({
  accept: type => type === Events.Discord.ERROR,
  notify: async ({ err }, eventBus) => {
    logger.error({ err }, 'Client error');
    eventBus.notify(Events.ERROR, { msg: `Client error: ${err}` });
  },
});

export const WarningListener = logger => ({
  accept: type => type === Events.Discord.WARNING,
  notify: async ({ warning }, eventBus) => {
    logger.warn({ warning }, 'Client warning');
    eventBus.notify(Events.INFO, { msg: `Client warning: ${warning}` });
  }
});

export const LoginOkListener = logger => ({
  accept: type => type === Events.Discord.LOG_IN_OK,
  notify: async (evt, eventBus) => {
    logger.info('Client logged in');
    eventBus.notify(Events.INFO, { msg: 'Client logged in' });
    eventBus.notify(Events.STARTUP, {}); // This is the main event everyone else should listen to, if they want to know when the app is alive.
  },
});

export const LoginErrListener = logger => ({
  accept: type => type === Events.Discord.LOG_IN_ERR,
  notify: async ({ error }, eventBus) => {
    logger.error(error, 'Client initialisation failed');
    eventBus.notify(Events.SHUTDOWN, {}).then(() => process.exit(1)); // Exit code 1: Client initialisation error
  }
});

export const GuildCreateDeleteListener = (isDelete, logger) => ({
  accept: type => type === (isDelete ? Events.Discord.GUILD_DELETE : Events.Discord.GUILD_CREATE),
  notify: async ({ id, name }, eventBus) => {
    logger.info({ id, name, isDelete }, 'Guilds changed');
    eventBus.notify(Events.INFO, { msg: `${isDelete ? "Removed from" : "Added to"} guild **${name}** (${id})` });
  }
});

export const MessageListener = (config, logger) => ({
  accept: type => type === Events.Discord.MESSAGE,
  notify: async ({ message }, eventBus) => {
    logger.trace(message, 'Message');
    if (message.author.bot) { return; }
    if (!isValidChannel(message.channel, config)) { return; }
    if (!message.content.startsWith(config.commandPrefix)) { return; }
    if (!/^.\S/.test(message.content)) { return; } // Ignores "! foo"
    const parts = message.content.split(/\s/);
    const command = parts[0].substring(1).toLowerCase();
    const args = parts.length > 1 ? parts.slice(1) : [];
    // We must provide some hook back here which anyone handling the event can use to let them identify where to send a message.
    // But do not want a leaky abstraction; cannot pass any Discord.js object. The context object can be considered opaque.
    eventBus.notify(Events.COMMAND, {
      command, args, context: {
        timestamp: message.createdTimestamp,
        source: 'discord',
        channel: message.channelId,
        message: message.id,
        author: message.author?.id,
        member: message.member?.id,
      }
    });
  }
});

/**
 * 
 * @param {Discord.Client} client Discord client.
 * @param {object} logger Logger instance.
 */
export const CommandResponder = (client, config, logger) => ({
  accept: type => type == Events.COMMAND_RESULT,
  notify: async event => {
    const { context, content } = event;
    if (!context) {
      logger.error(event, "Event with no context");
      return;
    }
    // Determine where we are responding to. Don't check the context.source, this allows non-discord origins to send their command results to discord.
    // But we do need to make sure we have a channel we are responding to.
    if (context.channel == null) {
      logger.error(event, "Event without a channel context");
      return;
    }
    // context.message can be a snowflake in order to reply to this message.
    const reply = context.message == null ? null : { messageReference: context.message };

    // Message itself can be a str or a object that is magically already compatible with MessagePayload.
    const payload = (typeof content === 'string') ? { content } : content;
    if (payload == null || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
      logger.error({ context }, "Event would have resulted in an empty message; not sending");
      return;
    }
    if (reply) {
      payload.reply = reply;
    }

    // Note that this does not check the config to see if it's allowed to use e.g. threads, DMs - that config only controls where it will process commands.
    // Sending responses is assumed to only be triggered appropriately.
    client.channels.fetch(context.channel).then(channel => {
      if (channel.isText()) {
        channel.send(payload);
      } else {
        logger.error({ event, channel }, "Cannot respond to a non-text channel");
        return;
      }
    }).catch(err => {
      logger.error({ err, channel: context.channel }, "Could not fetch channel");
    });
  },
});

export const DiscordLogger = (messageType, client, config, logger) => ({
  accept: type => type === messageType && [Events.INFO, Events.ERROR].includes(messageType),
  notify: async event => {
    const { msg } = event;
    if (!msg) {
      logger.error(event, "Log event with no message");
      return;
    }
    if (!config.logChannel) {
      logger.debug(event, "Ignore log event; no logChannel is configured");
      return;
    }
    const icon = messageType === Events.ERROR ? ':red_square:' : ':blue_square:';

    client.channels.fetch(config.logChannel).then(channel => {
      if (channel.isText()) {
        channel.send({ content: `${icon} ${msg}` });
      } else {
        logger.error({ event, channel }, "Cannot log to a non-text channel");
        return;
      }
    }).catch(err => {
      logger.error({ err, channel: config.logChannel, msg }, "Could not fetch log channel");
    });
  },
});

/**
 * Module for interfacing with Discord.
 */
export default (config, eventBus, logger) => {
  const intents = new Discord.Intents();
  const partials = [];
  intents.add(Discord.Intents.FLAGS.GUILDS);
  intents.add(Discord.Intents.FLAGS.GUILD_MESSAGES);
  if (config.allowDms) {
    intents.add(Discord.Intents.FLAGS.DIRECT_MESSAGES);
    partials.push("CHANNEL");
  }
  const client = new Discord.Client({ intents, partials });

  // Glue event handlers.
  const glueLogger = logger.child({ name: 'events-glue' });
  eventBus.addListener(InvalidatedListener(glueLogger));
  eventBus.addListener(RateLimitedListener(glueLogger));
  eventBus.addListener(ErrorListener(glueLogger));
  eventBus.addListener(WarningListener(glueLogger));
  eventBus.addListener(LoginOkListener(glueLogger));
  eventBus.addListener(LoginErrListener(glueLogger));
  eventBus.addListener(GuildCreateDeleteListener(true, glueLogger));
  eventBus.addListener(GuildCreateDeleteListener(false, glueLogger));
  eventBus.addListener({
    accept: type => type === Events.SHUTDOWN,
    notify: () => client.destroy(),
  });
  eventBus.addListener(DiscordLogger(Events.ERROR, client, config, glueLogger));
  eventBus.addListener(DiscordLogger(Events.INFO, client, config, glueLogger));

  // Main message event processing entrypoint.
  const msgsLogger = logger.child({ name: 'events-messages' });
  eventBus.addListener(MessageListener(config, msgsLogger));
  eventBus.addListener(CommandResponder(client, config, msgsLogger));  

  client
    .once('invalidated', () => eventBus.notify(Events.Discord.INVALIDATED, {}))
    .on('rateLimit', limits => eventBus.notify(Events.Discord.RATE_LIMITED, { limits }))
    .on('error', err => eventBus.notify(Events.Discord.ERROR, { err }))
    .on('warn', warning => eventBus.notify(Events.Discord.WARNING, { warning }))
    .on('messageCreate', message => eventBus.notify(Events.Discord.MESSAGE, { message }))
    .on("guildCreate", guild => eventBus.notify(Events.Discord.GUILD_CREATE, { name: guild.name, id: guild.id })) // join 
    .on("guildDelete", guild => eventBus.notify(Events.Discord.GUILD_DELETE, { name: guild.name, id: guild.id })) // kicked or guild is deleted
    ;

  client.login(config.clientToken)
    .then(() => eventBus.notify(Events.Discord.LOG_IN_OK), {})
    .catch(error => eventBus.notify(Events.Discord.LOG_IN_ERR, { error }));

  // The service API does really need this to be exposed.
  return client;
};
