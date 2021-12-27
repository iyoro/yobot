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

const d3 = parse('d3');
const play = theme => `${RPS_PREFIX[theme]} ➔ ${RPS_FORMATS[theme][d3()]}`;
export default { play };
