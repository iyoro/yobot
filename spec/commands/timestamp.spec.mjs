/* @file THIS FILE GENERATES *ALL THE TESTS* :D */
import pino from 'pino';
import EventBus from '../../src/bus/eventbus.js';
import Events from '../../src/bus/events.js';
import { Commands } from '../../src/commands.js';
import timestamp, { DATE_PATTERN, TIME_PATTERN, TZ_PATTERN } from "../../src/commands/timestamp.js";

let logger, commands, eventBus, context, config;
let commandsAdded;
beforeEach(() => {
  config = {};
  logger = pino({ level: 'error' });
  eventBus = new EventBus(logger);
  commands = new Commands(config, eventBus, logger);
  context = { source: 'test' };
  commandsAdded = [];
  spyOn(commands, 'addCommand').and.callFake(cmd => commandsAdded.push(cmd));
  spyOn(eventBus, 'notify').and.stub;
});

// Generate number sequence [from, to): seq(0, 3) => [0, 1, 2]
const seq = (from, to, step = 1) => Array(to - from).fill(1).map((it, i) => i % step == 0 ? i + from : null).filter(it => it != null);
// Hackily format a number to 2 digits if it's only 1.
const twoDigit = m => m < 10 ? `0${m}` : m;

describe('timestamp command', () => {

  describe('date pattern', () => {
    ["2021", "21", "99"].forEach(y => {
      ["09", "9", "12"].forEach(m => {
        ["05", "5", "15"].forEach(d => {
          const dateStr = `${y}-${m}-${d}`;
          it(`matches valid date ${dateStr}`, async () => {
            expect(DATE_PATTERN.test(dateStr)).toBeTrue();
          });
        });
      });
    });

    ["0", "x"].forEach(y => {
      ["13", "14", "120", "20", "0", "x"].forEach(m => {
        ["32", "0", "150"].forEach(d => {
          const dateStr = `${y}-${m}-${d}`;
          it(`rejects invalid date ${dateStr}`, async () => {
            expect(DATE_PATTERN.test(dateStr)).toBeFalse();
          });
        });
      });
    });
  });

  describe('time pattern', () => {
    seq(0, 23).forEach(h => {
      // Seq step = 5 here just to reduce the number of test cases.
      seq(0, 60, 15).map(twoDigit).forEach(m => {
        const timeStr = `${h}:${m}`;
        it(`matches valid time ${timeStr}`, async () => {
          expect(TIME_PATTERN.test(timeStr)).toBeTrue();
        });
      });
    });

    [-1, 24, 25, 100, "x"].forEach(h => {
      [-1, 60, 61, "x"].forEach(m => {
        const timeStr = `${h}:${m}`;
        it(`rejects invalid time ${timeStr}`, async () => {
          expect(TIME_PATTERN.test(timeStr)).toBeFalse();
        });
      });
    });
  });

  describe('timezone pattern', () => {
    ["-", "+"].forEach(s => {
      seq(0, 23).forEach(h => {
        seq(0, 60, 30).map(twoDigit).forEach(m => {
          const timeStr = `${s}${h}:${m}`;
          it(`matches valid timezone offset ${timeStr}`, async () => {
            expect(TZ_PATTERN.test(timeStr)).toBeTrue();
          });
        });
      });
    });

    ["-0", "+0", "-1", "+1", "-12", "+12", "-12", "+12"].forEach(i => {
      it(`accepts valid timezone ${i}`, async () => {
        expect(TZ_PATTERN.test(i)).toBeTrue();
      });
    });

    ["00:00", "01:00", "x", ""].forEach(i => {
      it(`rejects invalid time ${i}`, async () => {
        expect(TZ_PATTERN.test(i)).toBeFalse();
      });
    });
  });

});


describe('Timestamp command provider', () => {
  it('provides the timestamp command', () => {
    expect(commands.addCommand).not.toHaveBeenCalled();
    timestamp(commands, logger);
    expect(commands.addCommand).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Timestamp' }));
  });
});

describe('Timestamp command', () => {
  it('accepts the \'timestamp\' command', () => {
    expect(commands.addCommand).not.toHaveBeenCalled();
    timestamp(commands, logger);
    const timestampCmd = commandsAdded.find(it => it.name === 'Timestamp');
    expect(timestampCmd).toBeDefined();
    expect(timestampCmd.accept).toBeDefined();
    expect(timestampCmd.accept('timestamp')).toBe(true);
  });

  it('generates suitable outputs', async () => {
    timestamp(commands, logger);
    const timestampCmd = commandsAdded.find(it => it.name === 'Timestamp');
    expect(timestampCmd?.handle).toBeDefined();

    await timestampCmd.handle('2021-06-14 23:15 +02:00'.split(' '), context, eventBus, 'timestamp');
    expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({
      content: {
        embeds: [{
          title: 'Timestamp',
          fields: [{
            name: 'Interpretation',
            value: jasmine.anything(),
          },
          {
            name: 'Fixed date',
            value: '`<t:1623705300>` <t:1623705300>'
          },
          {
            name: 'Relative date',
            value: '`<t:1623705300:R>` <t:1623705300:R>'
          }]
        }]
      }
    }));
  });

  it('rejects invalid dates', async () => {
    timestamp(commands, logger);
    const timestampCmd = commandsAdded.find(it => it.name === 'Timestamp');
    expect(timestampCmd?.handle).toBeDefined();

    await timestampCmd.handle('invalid date'.split(' '), context, eventBus, 'timestamp');
    expect(eventBus.notify).toHaveBeenCalledOnceWith(Events.COMMAND_RESULT, jasmine.objectContaining({
      content: ':shrug: are you sure about that?',
      context
    }));
  });
});