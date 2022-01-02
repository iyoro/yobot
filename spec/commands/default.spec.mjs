import pino from 'pino';
import EventBus from '../../src/bus/eventbus.js';
import { Commands } from '../../src/commands.js';
import def from '../../src/commands/default.js';

const logger = pino({ level: 'error' });
let commands, command, eventBus, config;
beforeEach(() => {
  config = {};
  eventBus = new EventBus(logger);
  commands = new Commands(config, eventBus, logger);
  spyOn(commands, 'addCommand').and.callFake(cmd => command = cmd);
  spyOn(eventBus, 'notify').and.stub;
});

describe('Default command provider', () => {
  it('provides the default command', async () => {
    expect(command).toBeUndefined();
    expect(commands.addCommand).toHaveBeenCalledTimes(0);
    def(commands, logger);
    expect(commands.addCommand).toHaveBeenCalledTimes(1);
    expect(command.name).toBe('Default');
    // Command will accept any input.
    expect(command.accept('something')).toBe(true);
    expect(command.accept()).toBe(true);
    // Command doesn't do anything.
    expect(eventBus.notify).not.toHaveBeenCalled();
    await command.handle([], {}, eventBus, 'something');
    expect(eventBus.notify).not.toHaveBeenCalled();
  });
});
