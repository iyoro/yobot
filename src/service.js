import express from 'express';
import config from './config.js';


export default class ServiceAPI {
    constructor(client, logger) {
        this.logger = logger.child({ name: 'api' });
        if (!config.api.enabled) {
            this.logger.info('ServiceAPI is suppressed by config');
            return;
        }
        this.app = express();
    }

    async up() {
        if (!config.api.enabled) { return; }
        this.app.get('/guilds', this.guilds);
        this.app.get('/channels', this.channels);
        this.app.get('/command', this.command);
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

    async guilds(req, res) {
        res.json([
            123,
            234,
            345,
            456
        ]);
    }

    async channels(req, res) {
        const guildId = req.query.guild;
        if (guildId) {
            res.status(200).json([
                123,
                234,
                345,
                456
            ]);
        } else {
            res.status(400).end();
        }
    }

    async command(req, res) {
        const guildId = req.query.guild;
        const chanId = req.query.chan; // TODO this may not work for sending DMs?
        if (guildId && chanId) {
            // TODO: figure out how to synthesize a message. We could REALLY gnarlyly new off and populate a Message
            // but it seems the better option is to separate the commands registry, etc. from Discord a bit so that we can call
            // the same func just not via the message handler. So, "run the command !roll d6 for <user> in <channel>"
            // so that we know what, who, where the output goes, but don't need to pass a full Message around. Need my
            // own 'Command' object?
        } else {
            res.status(400).end();
        }
    }
}
