export default {
    logLevel: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug',
    clientToken: process.env.CLIENT_TOKEN,
    commandPrefix: '!',
};