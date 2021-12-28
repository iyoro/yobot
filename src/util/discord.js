/** @file Discord related util functions. */

/**
* Get the ID for who sent a message. This is either the guild member ID (guild messages) or the author ID (DMs).
* 
* @param {Message} message A message that was received.
* @param {boolean} prefix Whether "M" or "A" and a colon should be prefixed to the returned id.
* @returns A key to use for caching/memorising things about it.
*/
export const contextCommon = (context, prefix = true) => {
    const pre = prefix ? (context.member ? 'M:' : 'A:') : '';
    return pre + (context.member ?? context.author);
};
// TODO revisit this, is there a nicer way that doesn't mean introspecting the context for known keys?
export const contextId = context => contextCommon(context, false);
export const contextKey = context => contextCommon(context, true);
