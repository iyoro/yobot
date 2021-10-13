import { getTextChannel } from '../src/util/discord.js';

const client = {
    channels: {
        fetch() { }
    },
};
const textChannel = {
    isText() { return true; },
    isThread() { return false; },
    type: 'GUILD_TEXT',
};
const threadChannel = {
    isText() { return true; },
    isThread() { return true; },
    type: 'GUILD_PUBLIC_THREAD',
};
const dmChannel = {
    isText() { return true; },
    isThread() { return false; },
    type: 'DM',
};
const otherKindOfChannel = {
    isText() { return false; },
    isThread() { return false; },
    type: 'UNKNOWN',
};

describe('Discord utilities', () => {
    describe('getTextChannel', () => {
        it('does not re-fetch an existing channel', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').and.stub();
            getTextChannel(client, textChannel, true).then(chan => {
                expect(chan).toBe(textChannel);
                expect(fetch).not.toHaveBeenCalled();
                done();
            });
        });

        it('fetches a text channel by snowflake', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').withArgs('1').and.resolveTo(textChannel);
            getTextChannel(client, '1', false).then(chan => {
                expect(chan).toBe(textChannel);
                expect(fetch).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('fetches a thread channel by snowflake when allowed', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').withArgs('1').and.resolveTo(threadChannel);
            getTextChannel(client, '1', true, false).then(chan => {
                expect(chan).toBe(threadChannel);
                expect(fetch).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('does not fetch a thread channel by snowflake when disallowed', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').withArgs('1').and.resolveTo(threadChannel);
            getTextChannel(client, '1', false, false).then(() => {
                fail();
                done();
            }).catch(e => {
                expect(e.message).toBe("1 is not a text channel");
                expect(fetch).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('fetches a DM channel by snowflake when allowed', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').withArgs('1').and.resolveTo(dmChannel);
            getTextChannel(client, '1', false, true).then(chan => {
                expect(chan).toBe(dmChannel);
                expect(fetch).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('does not fetch a DM channel by snowflake when disallowed', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').withArgs('1').and.resolveTo(dmChannel);
            getTextChannel(client, '1', false, false).then(() => {
                fail();
                done();
            }).catch(e => {
                expect(e.message).toBe("1 is not a text channel");
                expect(fetch).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('does not fetch any other kind of channel by snowflake', async (done) => {
            const fetch = spyOn(client.channels, 'fetch').withArgs('1').and.resolveTo(otherKindOfChannel);
            getTextChannel(client, '1', false, false).then(() => {
                fail();
                done();
            }).catch(e => {
                expect(e.message).toBe("1 is not a text channel");
                expect(fetch).toHaveBeenCalledTimes(1);
                done();
            });
        });
    });
});
