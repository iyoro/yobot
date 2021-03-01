/**
 * @file Logic code for making rolls. Mostly this is error handling.
*/
import {
    parse, DieTooBigError, ExpressionTooLongError, InvalidChunkError, RollLimitExceededError, TooManyChunksError, TooManyDiceError
} from 'fdice';

/**
 * For reporting errors from a roll.
 */
class RollError extends Error {
    /**
     * @param {string} message Exception message.
     * @param {string} userMessage User-facing message to respond with.
     * @param {any} cause Another Error.
     * @param {boolean} quiet If true, this was user error that isn't worth logging as an error, e.g. expression typo.
     */
    constructor(message, userMessage, cause, quiet = false) {
        super(message);
        this.userMessage = userMessage;
        this.cause = cause;
        this.quiet = quiet;
    }
}

/**
 * Makes a roll using the expression in the args.
 * @param {string} args Roll args (string of tokens like 1d20, +2, etc.)
 * @returns {string} Message to send for this roll.
 */
const roll = (args) => {
    const expr = args.length === 0 ? '1d20' : args;
    try {
        const roller = parse(expr);
        const result = roller(false);
        return prettyPrint(expr, result);
    } catch (err) {
        if (err instanceof InvalidChunkError) {
            throw new RollError("Invalid chunk in dice expr", 'does not compute :slight_frown:', err, true);
        } else if (err instanceof ExpressionTooLongError || err instanceof TooManyChunksError || err instanceof TooManyDiceError || err instanceof DieTooBigError) {
            throw new RollError('Excessive expression', 'take it easy! :hushed:', err);
        } else if (err instanceof RollLimitExceededError) {
            throw new RollError('Timed out', 'I don\'t have enough dice for that! :pensive:', err);
        } else {
            throw new RollError('Unhandled error during roll',
                'awkward, something has gone wrong. The error has been logged for investigation.', err);
        }
    }
};

/**
 * Transform a roll result array into user-facing string.
 * @param {string} expr Original roll expr
 * @param {Array} result Result array
 */
const prettyPrint = (expr, result) => {
    const pretty = prettify(expr, result);
    const str = pretty.map((it, i) => i == pretty.length - 1 ? `**${it}**` : it).join(' ➔ ');
    // 1500 chosen randomly. Discord message limit is 2000.
    return str.length < 1500 ? str : str.substr(0, 1500) + ' ... I ... can\'t ... :boom:';
};

/**
 * Produces the parts of a message to pretty print: expression, optionally groups, and then sum.
 * @param {Array} result Unflattened roll result.
 * @returns {Array} Pretty format parts.
 */
const prettify = (expr, result) => {
    const parts = [expr.trim().split(' ').join('')];
    const flat = result.flat();
    const sum = flat.reduce((a, b) => a + b);
    if (flat.length > 1) {
        parts.push(result.map(part => part instanceof Array ? part.join(', ') : part).reduce((a, b) => a + '; ' + b));
    }
    parts.push(sum);
    return parts;
};

export default { roll, RollError };
