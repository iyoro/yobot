/**
 * @file Pulls together all of the command groups.
 */
import calendar from './calendar.js';
import def from './default.js';
import help from './help.js';
import rolls from './rolls.js';
import rps from './rps.js';
import timestamp from './timestamp.js';

/**
 * @exports {object} Named groups of commands.
 */
export default { rolls, rps, help, calendar, timestamp, def, /* do not add any after def */ };
