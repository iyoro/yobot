export default {
    logLevel: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug',
    clientToken: process.env.CLIENT_TOKEN,
    commandPrefix: process.env.COMMAND_PREFIX ? process.env.COMMAND_PREFIX : '!',
};
