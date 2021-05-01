/**
 * @file Logic code for playing rock, paper, scissors. Mostly this is pretty printing.
*/
import { parse } from 'fdice';

const RPS_PREFIX = {
    'rps': 'Rock, paper, scissors',
    'spc': 'Soulgem, parchment, clippers'
};

const RPS_FORMATS = {
    'rps': {
        1: '**Rock** :rock:',
        2: '**Paper** :page_with_curl:',
        3: '**Scissors** :scissors:',
    },
    'spc': {
        1: '**Soulgem** :gem:',
        2: '**Parchment** :scroll:',
        3: '**Clippers** :scissors:',
    },
};

const ROLL = parse('d3');
const play = theme => {
    const result = ROLL();
    if (theme in RPS_FORMATS && result in RPS_FORMATS[theme]) {
        return `${RPS_PREFIX[theme]} ➔ ${RPS_FORMATS[theme][result]}`;
    }
    throw new Error("Mysterious combination of command and result for Rock, Paper, Scissors", theme, result);
};
export default { play };
