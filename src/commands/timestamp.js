/**
 * @file Provides a time code command to generate embeddable discord times.
 */
/** @typedef {import('../commands').Commands} Commands */

import Events from '../bus/events.js';

export const DATE_PATTERN = /^\d\d{1,3}-[01]?\d-[0-3]?\d$/;
export const TIME_PATTERN = /^[012]?\d:[0-5][0-9]$/;
export const TZ_PATTERN = /^[+-](\d|[01]\d|2[0-3])?(:[0-5]\d)?$/;

export const parseTime = async args => {
  // Required format (H=required, h=optional): YYyy-mM-dD hH:MM +-
  if (args.length == 3) {
    const strToParse = args.join(' ');
    if (DATE_PATTERN.test(args[0]) && TIME_PATTERN.test(args[1]) && TZ_PATTERN.test(args[2])) {
      const dt = new Date(strToParse).getTime();
      return Math.floor(dt / 1000);
    } else {
      throw new Error('Unsupported date format, expected YYYY-MM-DD hh:mm +hh:mm');
    }
  } else {
    throw new Error("Args missing or in wrong format: " + args.join(' '));
  }
};

const buildMessageContent = async timestamp => ({
  embeds: [
    {
      fields: [
        {
          name: 'Fixed date',
          value: `\`<t:${timestamp}>\` <t:${timestamp}>`,
        },
        {
          name: 'Relative date',
          value: `\`<t:${timestamp}:R>\` <t:${timestamp}:R>`,
        }
      ],
    }
  ],
});

/**
 * Adds commands to the bot registry.
 * 
 * @param {Commands} commands Bot command registry 
 * @param {Logger} logger Logger for this set of commands.
 */
export default (commands, logger) => {
  commands.addCommand({
    icon: ':clock130:',
    name: 'Timestamp',
    description: '`!timestamp` Creates copy-pastable Discord timestamp codes',
    accept: (cmd) => cmd === 'timestamp',
    handle: async (args, context, eventBus) => {
      logger.debug({ command: 'timestamp' });
      await parseTime(args)
        .then(buildMessageContent)
        .then(content => eventBus.notify(Events.COMMAND_RESULT, { content, context }))
        .catch(err => {
          logger.error({ err }, "Error processing timestamp command");
          eventBus.notify(Events.COMMAND_RESULT, { context, content: ':shrug: are you sure about that?' });
        });
    },
  });

};

