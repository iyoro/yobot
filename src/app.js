import Discord from 'discord.js';
import pino from 'pino';

import config from './config.js';
import Facade from './facade.js';
import commandGroups from './commands/index.js';
import messageHandler from './messages.js';
import ServiceAPI from './service.js';

// Root logger
const logger = pino({ level: config.logLevel });

const intents = new Discord.Intents();
intents.add(Discord.Intents.FLAGS.GUILDS);
intents.add(Discord.Intents.FLAGS.GUILD_MESSAGES);
if (config.allowDms) {
    intents.add(Discord.Intents.FLAGS.DIRECT_MESSAGES);
}
const partials = ["CHANNEL"];
logger.debug({ intents: intents.toArray(), partials }, "Registering intents:");

const client = new Discord.Client({ intents, partials });

const commandLogger = logger.child({ name: 'command' });
const facade = new Facade(config, commandLogger, client);
const messages = messageHandler(facade);

for (let group in commandGroups) {
    commandGroups[group](facade, commandLogger.child({ group }));
}

client.once('invalidated', () => {
    logger.info('Client invalidated, shutting down');
    process.exit(2);
});
client.on('rateLimit', limits => logger.info({ limits }, 'Rate limited'));
client.on('error', err => {
    logger.error({ err }, 'Client error');
    facade.log(client, 'Client error: ' + err, false);
});
client.on('warn', warning => {
    logger.warn({ warning }, 'Client warning');
    //facade.log(client, 'Client warning: ' + warning, false);
});
client.on('messageCreate', messages.onMessage);

const api = new ServiceAPI(client, logger);

client.login(config.clientToken)
    .then(() => facade.log(client, 'Client logged in'))
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
    logger.info("SIGINT - closing down");
    api.down()
        .then(() => client.destroy())
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
});
