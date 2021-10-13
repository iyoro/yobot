/**
 * @file Unit spec for the bot command facade.
 */
import pino from 'pino';
import Facade from '../src/facade.js';

const config = {}; // Not actually used atm.
const logger = pino({ level: 'error' });
const stubCommand = {
    description: '',
    accept: function (cmd) { return cmd == this.name; },
    handle: () => new Promise(() => '')
};
const mkcommand = (name) => Object.assign({ name }, stubCommand);

/** @type Facade */
let client;
let facade;
beforeEach(function () {
    client = {};
    facade = new Facade(config, logger, client);
});

describe('Facade', () => {
    it('can have commands added', () => {
        expect(facade.commands).not.toBeNull();
        expect(facade.commands.length).toBe(0);
        facade.addCommand(mkcommand());
        expect(facade.commands.length).toBe(1);
    });

    it('can return configured commands', () => {
        const c1 = mkcommand();
        c1.hidden = true;
        facade.addCommand(c1);
        const c2 = mkcommand();
        facade.addCommand(c2);
        expect(facade.commands.length).toBe(2);
        const visibleCmds = facade.getCommands(false);
        expect(visibleCmds).not.toBeNull();
        expect(visibleCmds.length).toBe(1);
        expect(visibleCmds[0]).toEqual(c2);
        const allCmds = facade.getCommands(true);
        expect(allCmds).not.toBeNull();
        expect(allCmds.length).toBe(2);
        expect(allCmds[0]).toEqual(c1);
        expect(allCmds[1]).toEqual(c2);
    });

    it('executes a command if accepted by a handler', () => {
        const message = {}; // This would be a Discord.js Message, but newing off a stub of those isn't trivial.
        // Add a fallback command which accepts.
        const fallback = mkcommand('fb');
        const fbAccept = spyOn(fallback, 'accept').withArgs('something').and.returnValue(true);
        const fbHandle = spyOn(fallback, 'handle').withArgs(message, ['arg1', 'arg2'], 'something').and.resolveTo('');
        // A command which doesn't accept.
        const command = mkcommand('cmd');
        const cmdAccept = spyOn(command, 'accept').withArgs('something').and.returnValue(false);
        const cmdHandle = spyOn(command, 'handle').withArgs(message, ['arg1', 'arg2'], 'something').and.resolveTo('');
        facade.addCommand(command);
        facade.addCommand(fallback);
        // N.b. call param order is cmd, args but for handle it should be args, cmd because cms are less likely to 
        // care about exactly what string triggered them.
        facade.exec(message, 'something', ['arg1', 'arg2']);
        expect(cmdAccept).toHaveBeenCalledTimes(1);
        expect(cmdHandle).toHaveBeenCalledTimes(0);
        expect(fbAccept).toHaveBeenCalledTimes(1);
        expect(fbHandle).toHaveBeenCalledTimes(1);
    });

    it('can send a message to a channel provided directly', (done) => {
        const channel = { send() { /*stub*/ } };
        const send = spyOn(channel, 'send').withArgs('some text').and.resolveTo({});
        facade.send(channel, 'some text').then(() => {
            expect(send).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it('can send a message to a channel provided as a snowflake', (done) => {
        const channel = {
            send() { },
            isText() { return true; },
            isThread() { return false; },
        };
        client.channels = { fetch() { } };
        const getCh = spyOn(client.channels, 'fetch').withArgs('9').and.resolveTo(channel);
        const send = spyOn(channel, 'send').withArgs('some text').and.resolveTo({});
        facade.send('9', 'some text').then(() => {
            expect(getCh).toHaveBeenCalledTimes(1);
            expect(send).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it('can send to a thread channel provided as a snowflake', (done) => {
        const channel = {
            send() { },
            isText() { return true; },
            isThread() { return true; },
        };
        client.channels = { fetch() { } };
        const getCh = spyOn(client.channels, 'fetch').withArgs('9').and.resolveTo(channel);
        const send = spyOn(channel, 'send').withArgs('some text').and.resolveTo({});
        facade.send('9', 'some text').then(() => {
            expect(getCh).toHaveBeenCalledTimes(1);
            expect(send).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it('can correctly fail to send to a non-text or thread channel provided as a snowflake', (done) => {
        const channel = {
            send() { },
            isText() { return false; },
            isThread() { return false; },
        };
        client.channels = { fetch() { } };
        const getCh = spyOn(client.channels, 'fetch').withArgs('9').and.resolveTo(channel);
        const send = spyOn(channel, 'send').withArgs('some text').and.resolveTo({});
        facade.send('9', 'some text').then(() => {
            fail();
            done();
        }).catch(e => {
            expect(getCh).toHaveBeenCalledTimes(1);
            expect(send).not.toHaveBeenCalled();
            expect(e.message).toBe("9 is not a text channel");
            done();
        });
    });

    it('can send a reply to a message', () => {
        const channel = { send() {/*stub*/ } };
        const message = { channel };
        // Reply must go back to the channel the message came from.
        const send = spyOn(message.channel, 'send').withArgs({ content: 'some text', reply: { messageReference: message } }).and.resolveTo('');
        facade.reply(message, 'some text');
        expect(send).toHaveBeenCalledTimes(1);
    });

});
