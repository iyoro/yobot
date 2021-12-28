import pino from 'pino';
import EventBus from '../src/bus/eventbus.js';
import Events from '../src/bus/events.js';
import { CommandResponder, DiscordLogger, ErrorListener, InvalidatedListener, isValidChannel, LoginErrListener, LoginOkListener, MessageListener, RateLimitedListener, WarningListener } from '../src/discord.js';

const textChannel = {
  isText() { return true; },
  isThread() { return false; },
  type: 'GUILD_TEXT',
};
const threadChannel = {
  isText() { return true; },
  isThread() { return true; },
  type: 'GUILD_PUBLIC_THREAD',
};
const dmChannel = {
  isText() { return true; },
  isThread() { return false; },
  type: 'DM',
};
const otherKindOfChannel = {
  isText() { return false; },
  isThread() { return false; },
  type: 'UNKNOWN',
};

let config;
beforeEach(() => {
  config = {
    commandPrefix: '!',
    channelPattern: /dice|roll/,
  };
});

describe('Function isValidChannel', () => {
  it('only considers text channels valid', () => {
    config.allowThreads = true;
    config.allowDms = true;
    config.channelPattern = /^.*$/;
    expect(isValidChannel(textChannel, config)).toBeTrue();
    expect(isValidChannel(otherKindOfChannel, config)).toBeFalse();
  });

  it('only allows DMs according to config', () => {
    config.allowDms = false;
    expect(isValidChannel(dmChannel, config)).toBeFalse();
    config.allowDms = true;
    expect(isValidChannel(dmChannel, config)).toBeTrue();
  });

  it('only allows threads according to config', () => {
    config.allowThreads = false;
    expect(isValidChannel(threadChannel, config)).toBeFalse();
    config.allowThreads = true;
    expect(isValidChannel(threadChannel, config)).toBeTrue();
  });

  it('only allows guild channels matching config pattern', () => { // TODO: Remove this check, let admins use permissions.
    config.allowDms = false;
    config.allowThreads = false;
    expect(isValidChannel({
      isText() { return true; },
      isThread() { return false; },
      type: 'GUILD_TEXT',
      name: 'foo-bar'
    }, config)).toBeFalse();
    config.allowThreads = true;
    expect(isValidChannel({
      isText() { return true; },
      isThread() { return false; },
      type: 'GUILD_TEXT',
      name: 'roll-room'
    }, config)).toBeTrue();
  });
});

describe('Event handler', () => {
  let logger, eventBus;
  beforeEach(() => {
    logger = pino({ level: 'error' });
    eventBus = new EventBus(logger);  
    spyOn(eventBus, 'notify').and.resolveTo(undefined);
    spyOn(process, 'exit').and.stub; // Do not want listeners to be able to kill the process!
  });

  describe('InvalidatedListener', () => {
    it('accepts invalidation events', () => {
      const listener = InvalidatedListener(logger);
      expect(listener.accept(Events.Discord.INVALIDATED)).toBeTrue();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('initiates shutdown', async () => {
      const listener = InvalidatedListener(logger);
      await listener.notify({}, eventBus);
      expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.SHUTDOWN, {});
    });
  });

  describe('RateLimitedListener', () => {
    it('accepts rate limit events', () => {
      const listener = RateLimitedListener(logger);
      expect(listener.accept(Events.Discord.RATE_LIMITED)).toBeTrue();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('logs incidents', async () => {
      spyOn(logger, 'info').and.stub;
      const listener = RateLimitedListener(logger);
      await listener.notify({}, eventBus);
      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(eventBus.notify).not.toHaveBeenCalled();
    });
  });

  describe('ErrorListener', () => {
    it('accepts client error events', () => {
      const listener = ErrorListener(logger);
      expect(listener.accept(Events.Discord.ERROR)).toBeTrue();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('logs incidents and relays them to other handlers', async () => {
      const err = new Error("Something went wrong");
      spyOn(logger, 'error').and.stub;
      const listener = ErrorListener(logger);
      await listener.notify({ err }, eventBus);
      expect(logger.error).toHaveBeenCalledOnceWith(jasmine.objectContaining({ err }), "Client error");
      expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.ERROR, jasmine.anything());
    });
  });

  describe('WarningListener', () => {

    it('accepts client warning events', () => {
      const listener = WarningListener(logger);
      expect(listener.accept(Events.Discord.WARNING)).toBeTrue();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('logs incidents and relays them to other handlers', async () => {
      const warning = "Something notable happened";
      spyOn(logger, 'warn').and.stub;
      const listener = WarningListener(logger);
      await listener.notify({ warning }, eventBus);
      expect(logger.warn).toHaveBeenCalledOnceWith(jasmine.objectContaining({ warning }), "Client warning");
      // warnings relayed as info messages to chat.
      expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.INFO, jasmine.anything());
    });
  });

  describe('LoginOkListener', () => {
    it('accepts login events', () => {
      const listener = LoginOkListener(logger);
      expect(listener.accept(Events.Discord.LOG_IN_OK)).toBeTrue();
      expect(listener.accept(Events.Discord.LOG_IN_ERR)).toBeFalse();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('notifies of startup, logs, and relays info to other handlers', async () => {
      spyOn(logger, 'info').and.stub;
      const listener = LoginOkListener(logger);
      await listener.notify({}, eventBus);
      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(eventBus.notify).toHaveBeenCalledTimes(2);
      expect(eventBus.notify).toHaveBeenCalledWith(Events.INFO, jasmine.anything());
      expect(eventBus.notify).toHaveBeenCalledWith(Events.STARTUP, jasmine.anything());
    });
  });

  describe('LoginErrListener', () => {
    it('accepts login err events', () => {
      const listener = LoginErrListener(logger);
      expect(listener.accept(Events.Discord.LOG_IN_ERR)).toBeTrue();
      expect(listener.accept(Events.Discord.LOG_IN_OK)).toBeFalse();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('notifies of startup, logs, and relays info to other handlers', async () => {
      spyOn(logger, 'error').and.stub;
      const listener = LoginErrListener(logger);
      await listener.notify({ err: 'invalid creds' }, eventBus);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(eventBus.notify).toHaveBeenCalledTimes(1);
      // This cannot log to the log channel since it couldn't collect; can only shut down everything else.
      expect(eventBus.notify).toHaveBeenCalledWith(Events.SHUTDOWN, jasmine.anything());
    });
  });

  describe('MessageListener', () => {
    const mockMessage = (bot, channel, content, thread, dm) => ({
      message: {
        content,
        author: { bot },
        channel: { name: channel, isText() { return true; }, isThread() { return thread; }, type: dm ? 'DM' : 'GUILD_TEXT' },
      }
    });
    it('accepts message events', () => {
      const listener = MessageListener(config, logger);
      expect(listener.accept(Events.Discord.MESSAGE)).toBeTrue();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('invokes commands by firing command events', async () => {
      // A 'correct' message should trigger a command.
      const listener = MessageListener(config, logger);
      await listener.notify(mockMessage(false, 'dice-room', '!something foo bar baz', false, false), eventBus);
      expect(eventBus.notify).toHaveBeenCalledWith(Events.COMMAND, jasmine.objectContaining({
        command: 'something',
        args: ['foo', 'bar', 'baz'],
      }));
    });

    it('ignores command case', async () => {
      const listener = MessageListener(config, logger);
      await listener.notify(mockMessage(false, 'dice-room', '!SOMETHING FOO BAR BAZ', false, false), eventBus);
      expect(eventBus.notify).toHaveBeenCalledWith(Events.COMMAND, jasmine.objectContaining({
        command: 'something',
        args: ['FOO', 'BAR', 'BAZ'],
      }));
    });

    it('ignores messages sent by bots', async () => {
      const listener = MessageListener(config, logger);
      await listener.notify(mockMessage(true, 'dice-room', '!SOMETHING', false, false), eventBus);
      expect(eventBus.notify).not.toHaveBeenCalled();
    });

    it('ignores messages without the correct command prefix', async () => {
      const listener = MessageListener(config, logger);
      await listener.notify(mockMessage(false, 'dice-room', '%something', false, false), eventBus);
      expect(eventBus.notify).not.toHaveBeenCalled();
      config.commandPrefix = '%';
      await listener.notify(mockMessage(false, 'dice-room', '%something', false, false), eventBus);
      expect(eventBus.notify).toHaveBeenCalledTimes(1);
    });

    it('ignores messages sent to irrelevant channels', async () => { // TODO do away with this check, let server owners use permish
      const listener = MessageListener(config, logger);
      await listener.notify(mockMessage(false, 'misc-room', '!something', false, false), eventBus);
      expect(eventBus.notify).not.toHaveBeenCalled();
      await listener.notify(mockMessage(false, 'dice-room', '!something', false, false), eventBus);
      expect(eventBus.notify).toHaveBeenCalledTimes(1);
    });

    it('ignores false-start commands', async () => {
      const listener = MessageListener(config, logger);
      await listener.notify(mockMessage(false, 'misc-room', '! something', false, false), eventBus);
      expect(eventBus.notify).not.toHaveBeenCalled();
    });
  });

  describe('CommandResponder', () => {
    const client = {
      channels: {
        fetch: async () => ({}),
      }
    };
    it('accepts command result events', () => {
      const listener = CommandResponder(client, config, logger);
      expect(listener.accept(Events.COMMAND_RESULT)).toBeTrue();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('ignores messages without suitable context', async () => {
      const listener = CommandResponder(client, config, logger);
      [
        undefined,
        null,
        {},
        { channel: null },
      ].forEach(async context => {
        await listener.notify({ context }, eventBus);
        expect(eventBus.notify).not.toHaveBeenCalled();
      });
    });

    it('ignores messages without content', async () => {
      const listener = CommandResponder(client, config, logger);
      [
        undefined,
        null,
        {},
      ].forEach(async content => {
        await listener.notify({ context: { channel: 'test-snowflake' }, content }, eventBus);
        expect(eventBus.notify).not.toHaveBeenCalled();
      });
    });

    it('will not send to non-text channels', async () => {
      const listener = CommandResponder(client, config, logger);
      const channel = { send: async () => undefined };
      Object.assign(channel, otherKindOfChannel);
      spyOn(client.channels, 'fetch').withArgs('test-channel-snowflake').and.resolveTo(channel);
      spyOn(channel, 'send').and.stub;
      await listener.notify({
        context: { channel: 'test-channel-snowflake' },
        content: 'test command result',
      }, eventBus);
      expect(channel.send).not.toHaveBeenCalled();
    });

    it('will send to any text channel', async () => {
      spyOn(client.channels, 'fetch').and.stub; // set up spy that can be changed inside the loop.
      const listener = CommandResponder(client, config, logger);
      [
        textChannel,
        dmChannel,
        threadChannel
      ].forEach(async baseChannel => {
        const channel = { send: async () => undefined };
        Object.assign(channel, baseChannel);
        client.channels.fetch.calls.reset(); // only resets counter, not impl
        client.channels.fetch.and.resolveTo(channel);
        spyOn(channel, 'send').and.stub;
        await listener.notify({
          context: { channel: 'test-channel-snowflake' },
          content: 'test command result',
        }, eventBus);
        expect(client.channels.fetch).toHaveBeenCalledOnceWith('test-channel-snowflake');
        expect(channel.send).toHaveBeenCalledOnceWith(jasmine.objectContaining({ content: 'test command result' }));
      });
    });

    it('will reply to an originating message', async () => {
      const listener = CommandResponder(client, config, logger);
      const channel = { send: async () => undefined };
      Object.assign(channel, textChannel);
      spyOn(client.channels, 'fetch').withArgs('test-channel-snowflake').and.resolveTo(channel);
      spyOn(channel, 'send').and.stub;
      await listener.notify({
        context: {
          channel: 'test-channel-snowflake',
          message: 'test-message-snowflake',
        },
        content: 'test command result',
      }, eventBus);
      expect(channel.send).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        content: 'test command result',
        reply: { messageReference: 'test-message-snowflake' },
      }));
    });
  });

  describe('DiscordLogger', () => {
    let client;
    beforeEach(() => {
      config.logChannel = 'test-log-chan-snowflake';
      client = {
        channels: {
          fetch: async () => ({}),
        }
      };
    });

    it('accepts log events only', () => {
      let listener = DiscordLogger(Events.ERROR, client, config, logger);
      expect(listener.accept(Events.ERROR)).toBeTrue();
      expect(listener.accept(Events.INFO)).toBeFalse();
      expect(listener.accept('something else')).toBeFalse();

      listener = DiscordLogger(Events.INFO, client, config, logger);
      expect(listener.accept(Events.INFO)).toBeTrue();
      expect(listener.accept(Events.ERROR)).toBeFalse();
      expect(listener.accept('something else')).toBeFalse();

      listener = DiscordLogger('something else', client, config, logger);
      expect(listener.accept(Events.INFO)).toBeFalse();
      expect(listener.accept(Events.ERROR)).toBeFalse();
      expect(listener.accept('something else')).toBeFalse();
    });

    it('ignores messages without a message', async () => {
      spyOn(client.channels, 'fetch').and.stub;
      const listener = DiscordLogger(Events.INFO, client, config, logger);
      [
        undefined,
        null,
        "",
      ].forEach(async msg => {
        await listener.notify({ msg }, eventBus);
        expect(client.channels.fetch).not.toHaveBeenCalled();
        expect(eventBus.notify).not.toHaveBeenCalled();
      });
    });

    it('ignores messages if no channel is configured', async () => {
      spyOn(client.channels, 'fetch').and.stub;
      config.logChannel = undefined;
      const listener = DiscordLogger(Events.INFO, client, config, logger);
      await listener.notify({ msg: "test message" }, eventBus);
      expect(client.channels.fetch).not.toHaveBeenCalled();
      expect(eventBus.notify).not.toHaveBeenCalled();
    });

    it('will not send to non-text channels', async () => {
      const listener = DiscordLogger(Events.INFO, client, config, logger);
      const channel = { send: async () => undefined };
      Object.assign(channel, otherKindOfChannel);
      spyOn(client.channels, 'fetch').and.resolveTo(channel);
      spyOn(channel, 'send').and.stub;
      await listener.notify({ msg: 'test message' }, eventBus);
      expect(client.channels.fetch).toHaveBeenCalledOnceWith('test-log-chan-snowflake');
      expect(channel.send).not.toHaveBeenCalled();
    });

    it('will log an info message', async () => {
      const listener = DiscordLogger(Events.INFO, client, config, logger);
      const channel = { send: async () => undefined };
      Object.assign(channel, textChannel);
      spyOn(client.channels, 'fetch').and.resolveTo(channel);
      spyOn(channel, 'send').and.stub;
      await listener.notify({ msg: 'test message' }, eventBus);
      expect(client.channels.fetch).toHaveBeenCalledOnceWith('test-log-chan-snowflake');
      expect(channel.send).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        content: ':blue_square: test message',
      }));
    });

    it('will log an error message', async () => {
      const listener = DiscordLogger(Events.ERROR, client, config, logger);
      const channel = { send: async () => undefined };
      Object.assign(channel, textChannel);
      spyOn(client.channels, 'fetch').and.resolveTo(channel);
      spyOn(channel, 'send').and.stub;
      await listener.notify({ msg: 'test message' }, eventBus);
      expect(client.channels.fetch).toHaveBeenCalledOnceWith('test-log-chan-snowflake');
      expect(channel.send).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        content: ':red_square: test message',
      }));
    });
  });
});
