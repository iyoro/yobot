import pino from 'pino';
import EventBus from './bus/eventbus.js';
import commandGroups from './commands/index.js';
import config from './config.js';
import discord from './discord.js';
import facade from './facade.js';

const logger = pino({ level: config.logLevel });
const commandLogger = logger.child({ name: 'command' });

const eventBus = new EventBus(logger.child({ name: 'eventbus' }));
// This is the main event everyone else should listen to, if they want to know when the app is closing down.
eventBus.addListener({
  accept: type => type === 'shutdown',
  notify: (evt, eventBus) => eventBus.shutdown(),
});

discord(config, eventBus, logger.child({ name: 'discord' }));
facade(eventBus, commandLogger, config, commandGroups); // TODO rename, facade is a bit meaningless with eventbus refactoring... it's the bot core logic itself basically

// const facade = new Facade(config, commandLogger, client);
// const messages = messageHandler(facade);

// for (let group in commandGroups) {
    // commandGroups[group](facade, commandLogger.child({ group }));
// }

//const api = new ServiceAPI(client, logger);

process.on('uncaughtException', function (err) {
  logger.error({ err }, "Uncaught error");
  try {
    eventBus.notify('shutdown', {});
    process.exit(3); // Exit code 3: Unhandled error
  } catch (err) {
    logger.error({ err }, "Error in shutdown");
    process.exit(4); // Exit code 4: Unhandled error with a further error during attempted clean shutdown.
  }  
});

process.once('SIGINT', () => {
  logger.info("SIGINT - closing down");
  eventBus.notify('shutdown', {});
  process.exit(0); // Exit code 0: Interrupted, probably a clean shutdown.
});
