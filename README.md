# yobot

A Discord dice-roll bot.

Created for the Wayrest Mages Guild RP group discord as a learning exercise after the demise of Sidekick, and because
everyone agrees that RPBot hates us all.

**Note: the bot only responds in text channels which have `dice` or `roll` somewhere in their name.**

## Commands

Commands are prefixed with `!` but this can be easily changed on request.

| Command | What |
|---|---|
| !roll | Rolls some dice |
| !! | Repeats your last `!roll` |
| !help | Shows a summary of each command |

### `!roll`

Roll one or several dice, apply modifiers and add/subtract fixed values. Some examples:

* `!roll` on its own behaves the same as `!roll 1d20`
* `d20` or `4d8` to roll some dice
*  `+2` or `-4` insert a fixed value into the result
* `d%` can be used to mean `d100`
* `dF` rolls a Fudge/Fate die which results in -1, 0 or 1 (and so `3dF` gives -3 to +3)
* `-4d6` rolls `4d6` and then negates all the values (i.e. the result is from `-4` to `-24`)
* `2d20kl` rolls disadvantage (keep lowest), `2d20kh` rolls advantage (keep highest)

The bot uses the `fdice` library to roll dice which suports some fairly complex expressions, so [please click or tap here to get to fdice's documentation which explains all of the possible things you can do in a roll.](https://github.com/iyoro/fdice#dice-notation)

The response to a `!roll` looks like this:

```
4d6+8-2d4 ➔ 3, 5, 3, 2; 8; -2, -1 ➔ 18             
             └────────┘  ╵  └────┘    ╵
                4d6     +8   -2d4    Total (3+5+3+2+8-2-1)
```

The middle section is omitted if your roll produces a single value.

### `!!` aka reroll

The reroll command repeats your previous `!roll`.

### `!help`

Will show a brief summary of all of the commands. This command can only be used once per minute.

## Help & support

Please either create an issue here on github, or contact iyoro#0003 on Discord.

The bot is developed in the open in the interests of transparency.

## Technical

