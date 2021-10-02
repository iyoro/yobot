import Discord from 'discord.js';
import pino from 'pino';

import config from './config.js';
import Facade from './facade.js';
import commandGroups from './commands/index.js';
import messageHandler from './messages.js';
import ServiceAPI from './service.js';

// Root logger
const logger = pino({ level: config.logLevel });

const facadeLogger = logger.child({ name: 'command' });
const facade = new Facade(config, facadeLogger);
for (let group in commandGroups) {
    commandGroups[group](
        facade, facadeLogger.child({ group }));
}
const messages = messageHandler(facade);

const client = new Discord.Client();
client.once('invalidated', () => {
    logger.info('Client invalidated, shutting down');
    process.exit(2);
});
client.on('rateLimit', limits => logger.info({ limits }, 'Rate limited'));
client.on('error', err => logger.error({ err }, 'Client error'));
client.on('message', messages.onMessage);

const api = new ServiceAPI(client, logger);

client.login(config.clientToken)
    .then(() => logger.info('Client logged in'))
    .then(() => api.up().catch(error => {
        logger.error(error, 'API initialisation failed');
        process.exit(4);
    }))
    .catch(error => {
        logger.error(error, 'Client initialisation failed');
        process.exit(2);
    });

process.on('uncaughtException', function (err) {
    logger.error({ err }, "Uncaught exception");
    process.exit(3);
});

process.once('SIGINT', () => {
    logger.info("Closing down");
    api.down()
        .then(() => client.destroy())
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
});
