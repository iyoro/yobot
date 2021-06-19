import ordinal from 'ordinal';

const CALENDAR = {
    months: [
        "Morning Star",
        "Sun's Dawn",
        "First Seed",
        "Rain's Hand",
        "Second Seed",
        "Midyear",
        "Sun's Height",
        "Last Seed",
        "Hearthfire",
        "Frostfall",
        "Sun's Dusk",
        "Evening Star"
    ],
    argoMonths: [
        ["Vakka", "Sun"],
        ["Xeech", "Nut"],
        ["Sisei", "Sprout"],
        ["Hist-Deek", "Hist Sapling"],
        ["Hist-Dooka", "Mature Hist"],
        ["Hist-Tsoko", "Elder Hist"],
        ["Thtithil-Gah", "Egg-Basket"],
        ["Thtithil", "Egg"],
        ["Nushmeeko", "Lizard"],
        ["Shaja-Nushmeeko", "Semi-Humanoid Lizard"],
        ["Saxhleel", "Argonian"],
        ["Xulomaht", "The Deceased"]
    ],
    realMonths: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ],
    days: [
        "Sundas",
        "Morndas",
        "Tirdas",
        "Middas",
        "Turdas",
        "Fredas",
        "Loredas",
    ]
};

// Day 0 is Sunday, so the list of days starts on Sunday because America.
const day = date => CALENDAR.days[date.getUTCDay()];
const month = date => CALENDAR.months[date.getUTCMonth()];
const argoMonth = date => CALENDAR.argoMonths[date.getUTCMonth()];
const year = date => date.getUTCFullYear() - 1432;

const date = date => {
    const d = day(date);
    const ord = ordinal(date.getDate());
    const m = month(date);
    const a = argoMonth(date);
    const y = year(date);
    return `${d} the ${ord} of ${m} (${a[0]}, *${a[1]}*) 2E ${y}`;
};

const months = date => {
    const m = date.getUTCMonth();
    return CALENDAR.months.reduce((acc, month, i) => {
        const fix = i === m ? '**' : '';
        const argo = CALENDAR.argoMonths[i][0] + ', *' + CALENDAR.argoMonths[i][1] + '*';
        const mark = i === m ? ' :arrow_left: You are here!' : '';
        return `${acc}${i + 1}. ${fix}${month} (${argo})${fix}${mark}\n`;
    }, '');
};

export default { argoMonth, date, day, month, months, year };
