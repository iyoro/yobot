/**
 * @file Logic code for making rolls. Mostly this is error handling.
*/
import {
    parse, DieTooBigError, ExpressionTooLongError, InvalidChunkError, RollLimitExceededError, TooManyChunksError, TooManyDiceError
} from 'fdice';

class RollError extends Error {
    /**
     * 
     * @param {string} message Exception message.
     * @param {string} userMessage User-facing message to respond with.
     * @param {any} cause Another Error.
     * @param {boolean} quiet If true, this was user error that isn't worth logging as an error, e.g. expression typo.
     */
    constructor(message, userMessage, cause, quiet = false) {
        super(message)
        this.userMessage = userMessage
        this.cause = cause
        this.quiet = quiet
    }
}

const roll = (args) => rollCommon(args.length === 0 ? '1d20' : args.join(' '))

const rollCommon = (expr) => {
    try {
        // if (expr === 'explode') {
        //     throw new Error('Deliberate explosion')
        // }
        const roller = parse(expr);
        const result = roller(false);
        return prettyPrint(expr, result);
    } catch (err) {
        if (err instanceof InvalidChunkError) {
            throw new RollError("Invalid chunk in dice expr", 'does not compute :slight_frown:', err, true)
        } else if (err instanceof ExpressionTooLongError || err instanceof TooManyChunksError || err instanceof TooManyDiceError || err instanceof DieTooBigError) {
            throw new RollError('Excessive expression', 'take it easy! :hushed:', err)
        } else if (err instanceof RollLimitExceededError) {
            throw new RollError('Timed out', 'I don\'t have enough dice for that! :pensive:', err)
        } else {
            throw new RollError('Unhandled error during roll',
                'awkward, something has gone wrong. The error has been logged for investigation.', err)
        }
    }
}

const prettyPrint = (expr, result) => {
    // Uglify the expression a little. Prevent reams of whitespace flooding us.
    const prettyExpr = expr.trim().split(' ').join('')
    // Prettify the results somewhat: a, a, a, a; b, b, b; c, c 
    const groups = result.map(part => part instanceof Array ? part.join(', ') : part).reduce((a, b) => a + '; ' + b)
    const sum = result.flat().reduce((a, b) => a + b)
    const pretty = `${prettyExpr} ➔ ${groups} ➔ **${sum}**`
    // 1500 chosen randomly. Discord message limit is 2000.
    return pretty.length < 1500 ? pretty : pretty.substr(0, 1500) + '... :boom:';
}

export default (logger) => ({ roll, RollError })
