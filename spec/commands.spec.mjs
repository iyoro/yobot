/**
 * @file Unit spec for the bot command registry.
 */
import pino from 'pino';
import EventBus from '../src/bus/eventbus.js';
import Events from '../src/bus/events.js';
import { Commands } from '../src/commands.js';

const logger = pino({ level: 'error' });
const stubCommand = {
    description: '',
    accept: () => true,
    handle: async () => new Promise(() => '')
};
const mkcommand = (name = 'Test command') => Object.assign({ name }, stubCommand);

let eventBus, commands, context, config;
beforeEach(function () {
    config = { command: { toggle: {} } };
    eventBus = new EventBus(logger);
    commands = new Commands(config, eventBus, logger);
    context = { 'source': 'test' };
});

describe('Commands registry', () => {
    it('adds commands that are enabled in config', () => {
        expect(commands.commands).not.toBeNull();
        expect(commands.commands.length).toBe(0);
        commands.addCommand(mkcommand());
        expect(commands.commands.length).toBe(0);
        config.command.toggle['Test command'] = false;
        commands.addCommand(mkcommand());
        expect(commands.commands.length).toBe(0);
        config.command.toggle['Test command'] = true;
        commands.addCommand(mkcommand());
        expect(commands.commands.length).toBe(1);
        commands.addCommand(mkcommand('Another command'));
        expect(commands.commands.length).toBe(1);
        config.command.toggle['Another command'] = true;
        commands.addCommand(mkcommand('Another command'));
        expect(commands.commands.length).toBe(2);
    });

    it('can return configured commands', () => {
        config.command.toggle['Test command'] = true;
        const c1 = mkcommand();
        c1.hidden = true;
        commands.addCommand(c1);
        const c2 = mkcommand();
        commands.addCommand(c2);
        expect(commands.commands.length).toBe(2);
        const visibleCmds = commands.getCommands(false);
        expect(visibleCmds).not.toBeNull();
        expect(visibleCmds.length).toBe(1);
        expect(visibleCmds[0]).toEqual(c2);
        const allCmds = commands.getCommands(true);
        expect(allCmds).not.toBeNull();
        expect(allCmds.length).toBe(2);
        expect(allCmds[0]).toEqual(c1);
        expect(allCmds[1]).toEqual(c2);
    });

    it('executes a command if accepted by a handler', () => {
        config.command.toggle['fb'] = true;
        config.command.toggle['cmd'] = true;
        // Add a fallback command which accepts anything.
        const fallback = mkcommand('fb');
        const fbAccept = spyOn(fallback, 'accept').withArgs('something').and.returnValue(true);
        const fbHandle = spyOn(fallback, 'handle').withArgs(['arg1', 'arg2'], context, eventBus, 'something').and.resolveTo('');
        // A command which doesn't accept anything.
        const command = mkcommand('cmd');
        const cmdAccept = spyOn(command, 'accept').withArgs('something').and.returnValue(false);
        const cmdHandle = spyOn(command, 'handle').withArgs(['arg1', 'arg2'], context, eventBus, 'something').and.resolveTo('');
        commands.addCommand(command);
        commands.addCommand(fallback);
        // N.b. call param order is cmd, args but for handle it should be args, cmd because cms are less likely to 
        // care about exactly what string triggered them.
        commands.exec('something', ['arg1', 'arg2'], context);
        expect(cmdAccept).toHaveBeenCalledTimes(1);
        expect(cmdHandle).toHaveBeenCalledTimes(0);
        expect(fbAccept).toHaveBeenCalledTimes(1);
        expect(fbHandle).toHaveBeenCalledTimes(1);
    });

    it('responds to command events', async () => {
        config.command.toggle['Test command'] = true;
        const cmd = mkcommand();
        spyOn(cmd, 'accept').and.callThrough();
        spyOn(cmd, 'handle');
        const cmdEvent = {
            command: 'something',
            args: ['foo', 'bar', 'baz'],
            context: { test: 'yes' }
        };
        commands.addCommand(cmd);
        expect(commands.accept(Events.COMMAND)).toBeTrue();
        expect(commands.accept('anything else')).toBeFalse();
        // The bus should not notify it with something it does not accept, so do not test that.
        await commands.notify(cmdEvent);
        expect(cmd.accept).toHaveBeenCalledOnceWith('something');
        expect(cmd.handle).toHaveBeenCalledOnceWith(['foo', 'bar', 'baz'], jasmine.objectContaining({ test: 'yes' }), eventBus, 'something');
    });
});
