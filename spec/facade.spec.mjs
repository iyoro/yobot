/**
 * @file Unit spec for the bot command facade.
 */
import { Message } from 'discord.js';
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
let facade;
beforeEach(function () {
    facade = new Facade(config, logger);
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
        const message = new Message();
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

    it('can send a message to a channel', () => {
        const channel = { send() {/*stub*/ } };
        const send = spyOn(channel, 'send').withArgs('some text').and.resolveTo('');
        facade.send(channel, 'some text');
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('can send a reply to a message', () => {
        const channel = { send() {/*stub*/ } };
        const message = { channel };
        // Reply must go back to the channel the message came from.
        const send = spyOn(message.channel, 'send').withArgs('some text', { reply: message }).and.resolveTo('');
        facade.reply(message, 'some text');
        expect(send).toHaveBeenCalledTimes(1);
    });

});
