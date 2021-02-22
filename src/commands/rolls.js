// Per-user roll history since startup.
const lastRoll = {};

export default (facade) => {
    const logger = facade.logger;
    const prefix = facade.config.commandPrefix;
    return [
        {
            name: 'Roll :game_die:',
            description: `\`${prefix}roll\` Roll dice with expressions like \`4d6+2\``,
            accept: (cmd) => cmd === 'roll',
            handle: (message, args) => {
                logger.debug("Roll: Handle msg with %s", args);
            }
        },
        {
            name: 'Reroll :arrows_counterclockwise:',
            description: `\`${prefix}${prefix}\` Repeat your last ${prefix}roll. Maybe the next one will be better...`,
            accept: (cmd) => cmd === prefix, // i.e. react to !! if prefix is !
            handle: (message, args) => {
                logger.debug("Reroll: Handle msg with %s", args);
            }
        },
    ]
}
