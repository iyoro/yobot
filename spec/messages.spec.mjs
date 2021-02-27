import handlers from '../src/messages.js';
import Facade from '../src/facade.js';

let facade, messages;
beforeEach(() => {
    facade = new Facade({ commandPrefix: '!' }, null);
    spyOn(facade, 'exec').and.stub();
    messages = handlers(facade);
});

describe('Message handler', () => {
    it('produces an object containing event handlers', () => {
        expect(handlers).not.toThrowError();
        expect(messages).toBeDefined();
        expect(messages.onMessage).toBeInstanceOf(Function);
    });

    describe('onMesssage', () => {
        const aMessage = (bot, channel, content) => ({
            author: { bot }, channel: { name: channel }, content
        });

        it('invokes commands', () => {
            // A 'correct' message should trigger a command.
            messages.onMessage(aMessage(false, 'dice-room', '!something'));
            expect(facade.exec).toHaveBeenCalledTimes(1);
        });

        it('ignores messages sent by bots', () => {
            messages.onMessage(aMessage(true, 'dice-room', '!something'));
            expect(facade.exec).not.toHaveBeenCalled();
        });

        it('ignores messages without the correct command prefix', () => {
            messages.onMessage(aMessage(false, 'dice-room', '%something'));
            expect(facade.exec).not.toHaveBeenCalled();
            facade.config.commandPrefix = '%';
            messages.onMessage(aMessage(false, 'dice-room', '%something'));
            expect(facade.exec).toHaveBeenCalledTimes(1);
        });

        it('ignores messages sent to irrelevant channels', () => {
            messages.onMessage(aMessage(false, 'misc-room', '!something'));
            expect(facade.exec).not.toHaveBeenCalled();
            messages.onMessage(aMessage(false, 'dice-room', '!something'));
            expect(facade.exec).toHaveBeenCalledTimes(1);
            messages.onMessage(aMessage(false, 'roll-room', '!something'));
            expect(facade.exec).toHaveBeenCalledTimes(2);
        });

        it('ignores false-start commands', () => {
            messages.onMessage(aMessage(false, 'dice-room', '! something'));
            expect(facade.exec).not.toHaveBeenCalled();
        });
    });
});
