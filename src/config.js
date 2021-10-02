export default {
    logLevel: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug',
    clientToken: process.env.CLIENT_TOKEN,
    commandPrefix: process.env.COMMAND_PREFIX ? process.env.COMMAND_PREFIX : '!',
    channelPattern: /dice|roll|^bot/,
    api: {
        enabled: false,
        host: 'localhost',
        port: '6969'
    }
};
