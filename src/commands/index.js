/**
 * @file Pulls together all of the command groups.
 */
import def from './default.js';
import help from './help.js';
import rolls from './rolls.js';

/**
 * @exports {object} Named groups of commands.
 */
export default { rolls, help, def };
