/**
 * @file Unit spec for the bot command facade.
 */
import pino from 'pino';
import EventBus from '../src/bus/eventbus.js';
import Events from '../src/bus/events.js';
import { Facade } from '../src/facade.js';

const logger = pino({ level: 'error' });
const stubCommand = {
    description: '',
    accept: () => true,
    handle: async () => new Promise(() => '')
};
const mkcommand = (name) => Object.assign({ name }, stubCommand);

let eventBus;
let facade;
let context;
beforeEach(function () {
    eventBus = new EventBus(logger);
    facade = new Facade(eventBus, logger);
    context = { 'source': 'test' };
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
        // Add a fallback command which accepts anything.
        const fallback = mkcommand('fb');
        const fbAccept = spyOn(fallback, 'accept').withArgs('something').and.returnValue(true);
        const fbHandle = spyOn(fallback, 'handle').withArgs(['arg1', 'arg2'], context, eventBus, 'something').and.resolveTo('');
        // A command which doesn't accept anything.
        const command = mkcommand('cmd');
        const cmdAccept = spyOn(command, 'accept').withArgs('something').and.returnValue(false);
        const cmdHandle = spyOn(command, 'handle').withArgs(['arg1', 'arg2'], context, eventBus, 'something').and.resolveTo('');
        facade.addCommand(command);
        facade.addCommand(fallback);
        // N.b. call param order is cmd, args but for handle it should be args, cmd because cms are less likely to 
        // care about exactly what string triggered them.
        facade.exec('something', ['arg1', 'arg2'], context);
        expect(cmdAccept).toHaveBeenCalledTimes(1);
        expect(cmdHandle).toHaveBeenCalledTimes(0);
        expect(fbAccept).toHaveBeenCalledTimes(1);
        expect(fbHandle).toHaveBeenCalledTimes(1);
    });

    it('responds to command events', async () => {
        const cmd = mkcommand('test');
        spyOn(cmd, 'accept').and.callThrough();
        spyOn(cmd, 'handle');
        const cmdEvent = {
            command: 'something',
            args: ['foo', 'bar', 'baz'],
            context: { test: 'yes' }
        };
        facade.addCommand(cmd);
        expect(facade.accept(Events.COMMAND)).toBeTrue();
        expect(facade.accept('anything else')).toBeFalse();
        // The bus should not notify it with something it does not accept, so do not test that.
        await facade.notify(cmdEvent);
        expect(cmd.accept).toHaveBeenCalledOnceWith('something');
        expect(cmd.handle).toHaveBeenCalledOnceWith(['foo', 'bar', 'baz'], jasmine.objectContaining({ test: 'yes' }), eventBus, 'something');
    });
});
