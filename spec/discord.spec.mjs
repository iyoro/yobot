import pino from 'pino';
import EventBus from '../src/bus/eventbus.js';
import Events from '../src/bus/events.js';
import { ErrorListener, InvalidatedListener, isValidChannel, LoginErrListener, LoginOkListener, MessageListener, RateLimitedListener, WarningListener } from '../src/discord.js';

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
        //facade = new Facade(eventBus, logger);        
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

        it('invokes commands by firing command events', () => {
            // A 'correct' message should trigger a command.
            const listener = MessageListener(config, logger);
            listener.notify(mockMessage(false, 'dice-room', '!something foo bar baz', false, false), eventBus);
            expect(eventBus.notify).toHaveBeenCalledWith(Events.COMMAND, jasmine.objectContaining({
                command: 'something',
                args: ['foo', 'bar', 'baz'],
            }));
        });

        it('ignores command case', () => {
            const listener = MessageListener(config, logger);
            listener.notify(mockMessage(false, 'dice-room', '!SOMETHING FOO BAR BAZ', false, false), eventBus);
            expect(eventBus.notify).toHaveBeenCalledWith(Events.COMMAND, jasmine.objectContaining({
                command: 'something',
                args: ['FOO', 'BAR', 'BAZ'],
            }));
        });

        it('ignores messages sent by bots', () => {
            const listener = MessageListener(config, logger);
            listener.notify(mockMessage(true, 'dice-room', '!SOMETHING', false, false), eventBus);
            expect(eventBus.notify).not.toHaveBeenCalled();
        });

        it('ignores messages without the correct command prefix', () => {
            const listener = MessageListener(config, logger);
            listener.notify(mockMessage(false, 'dice-room', '%something', false, false), eventBus);
            expect(eventBus.notify).not.toHaveBeenCalled();
            config.commandPrefix = '%';
            listener.notify(mockMessage(false, 'dice-room', '%something', false, false), eventBus);
            expect(eventBus.notify).toHaveBeenCalledTimes(1);
        });

        it('ignores messages sent to irrelevant channels', () => { // TODO do away with this check, let server owners use permish
            const listener = MessageListener(config, logger);
            listener.notify(mockMessage(false, 'misc-room', '!something', false, false), eventBus);
            expect(eventBus.notify).not.toHaveBeenCalled();
            listener.notify(mockMessage(false, 'dice-room', '!something', false, false), eventBus);
            expect(eventBus.notify).toHaveBeenCalledTimes(1);
        });

        it('ignores false-start commands', () => {
            const listener = MessageListener(config, logger);
            listener.notify(mockMessage(false, 'misc-room', '! something', false, false), eventBus);
            expect(eventBus.notify).not.toHaveBeenCalled();
        });
    });

    describe('CommandResponder', () => {
        it('accepts ??? events', () => {
            const listener = InvalidatedListener(logger);
            expect(listener.accept(Events.Discord.INVALIDATED)).toBeTrue();
            expect(listener.accept('something else')).toBeFalse();
        });

        it('', async () => { });
    });
});