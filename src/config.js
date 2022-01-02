const env = (k, def = null) => process.env[k] ? process.env[k] : def;

export default {
    // Logging verbosity
    logLevel: env('LOG_LEVEL', 'info'),
    // Discord API client token.
    clientToken: env('CLIENT_TOKEN'),
    // Magic prefix for in-chat commands (!foo)
    commandPrefix: env('COMMAND_PREFIX', '!'),
    // Pattern for channel names to match in order for the bot to respond there.
    channelPattern: /dice|roll|^bot/,
    // Allow responding to DMs?
    allowDms: true,
    // Allow responding to threads?
    allowThreads: true,
    // Channel ID for a channel that certain logging can be reported to.
    logChannel: env('LOG_CHANNEL'),
    command: {
        // Feature toggles for individual commands, keyed by name.
        toggle: {
            'Default': true, // Not the default toggle, it is the toggle for the default (catch all) command handler.
            'Lore day': true,
            'Lore date': true,
            'Lore month': true,
            'Lore months': true,
            'Help': true,
            'Roll': true,
            'Reroll': true,
            'Rock, paper, scissors': true,
            'Soulgem, parchment, clippers': true,
        }
    },
    // Config for webservice.
    api: {
        enabled: false,
        host: 'localhost',
        port: '6969'
    }
};
