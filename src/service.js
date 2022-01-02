/** @typedef {import('discord.js').Client} Client */
/** @typedef {import('pino.js').Logger} Logger */
/** @typedef {import('./bus/eventbus.js').EventBus} EventBus */
import express from 'express';
import Events from './bus/events.js';
import config from './config.js';

export default (client, config, eventBus, logger) => {
  return new ServiceAPI(client, config, eventBus, logger);
}

export class ServiceAPI {
  /**
   * 
   * @param {Client} client Discord client
   * @param {object} config Config object
   * @param {EventBus} eventBus Bus instance
   * @param {Logger} logger Logger instance
   */
  constructor(client, config, eventBus, logger) {
    this.client = client;
    this.config = config;
    this.eventBus = eventBus;
    this.logger = logger;
    if (!config.api.enabled) {
      this.logger.info('ServiceAPI is suppressed by config');
      return;
    }
    this.app = express();
    eventBus.addListener({
      accept: type => type === Events.STARTUP,
      notify: () => this.up()
    });
    eventBus.addListener({
      accept: type => type === Events.SHUTDOWN,
      notify: () => this.down()
    });
  }

  async up() {
    if (!config.api.enabled) { return; }
    this.app.use('/', this.errHandler.bind(this));
    this.app.use('/', this.preflight.bind(this));
    this.app.get('/guilds', this.guilds.bind(this));
    this.app.get('/channels', this.channels.bind(this));
    this.app.get('/command', this.command.bind(this));
    const { host, port } = config.api;
    this.server = this.app.listen(port, host, () => {
      this.logger.info({ host, port }, 'API server up');
    });
    return this.server;
  }

  async down() {
    if (!config.api.enabled) { return; }
    return this.server.close(() => {
      this.logger.info('API server down');
    });
  }

  async errHandler(err, req, res, next) { // MUST have 4 args to be treated as an err handler.
    this.logger.error(err, 'Unhandled service error');
    res.status(500).send('Something went wrong');
  }

  async preflight(req, res, next) {
    if (this.client.isReady()) {
      next();
    } else {
      res.status(400).json({ message: 'Discord is not ready' });
    }
  }

  async guilds(req, res) {
    this.client.guilds.fetch({ limit: 100 }).then(guilds => {
      res.json(guilds.map(g => g.id));
    });
  }

  // TODO security: ids are user data, though internal between the web app and here.
  async channels(req, res) {
    const { guild: gId, user: uId } = req.query;
    this.logger.debug({ query: req.query }, "Get channels");
    if (gId && uId) {
      const guild = await this.client.guilds.fetch(gId);
      const guildChannels = await guild.channels.fetch().then(channels => channels.map(({ id, name }) => ({ id, name, isDM: false })));
      const user = await this.client.users.fetch(uId);
      const dmChannel = await user.createDM().then(({ id }) => ({ id, name: user.username, isDM: true }));
      res.json(guildChannels.concat(dmChannel));
    } else {
      res.status(400).send('Missing params').end(); // TODO json err object
    }
  }

  // TODO security: cmd, ids are user data, though internal between the web app and here.
  // Better I think to have a single-purpose roll action.
  async command(req, res) {
    const { channel, command, args, isSecret } = req.query;
    this.logger.debug({ channel, command, args, isSecret }, 'API command');
    switch (command) {
      case 'roll':
        if (channel) {
          this.eventBus.notify(Events.COMMAND, {
            command: 'roll',
            args: Array.isArray(args) ? args : (args ?? '').split(' '),
            context: {
              timestamp: new Date().getTime(),
              source: 'service',
              channel,
              isSecret,
            }
          });
          res.status(201).end();
        } else {
          res.status(400).send('Missing args').end(); // TODO json err object
        }
        break;
      default:
        res.status(400).send('Bad command').end(); // TODO json err object
    }
  }
}
