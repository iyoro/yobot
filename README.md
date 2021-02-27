# yobot

A Discord dice-roll bot.

yobot was created for the Wayrest Mages Guild RP group discord after the demise of Sidekick, and because everyone agrees
that RPBot hates us all.

## Commands

Commands are prefixed with `!`, and the examples below use this.

### `!roll`

Rolls a dice. Dice expressions use fairly standard syntax.

Some examples:

* `!roll` on its own behaves the same as `!roll 1d20`
* `d20` or `4d8` to roll some dice
*  `+2` or `-4` insert a fixed value into the result
* `d%` can be used to mean `d100`
* `dF` rolls a Fudge/Fate die which results in -1, 0 or 1 (`3dF` thus rolls a number from -3 to +3)
* `-4d6` rolls `4d6` and then negates all the values (i.e. the result is from `-4` to `-24`)
* `2d20kl` rolls disadvantage, `2d20kh` rolls advantage

The bot uses the `fdice` library to roll dice which does suport some fairly complex expressions, so [please click or tap here to get to fdice's documentation which explains all of the possible things you can do in a roll.](https://github.com/iyoro/fdice#dice-notation)

The response to a !roll looks like this:

```
4d6+8-2d4 ➔ 3, 5, 3, 2; 8; -2, -1 ➔ 18
```

`3, 5, 3, 2` come from `4d6`, `8` is from the `+8` and `-2, -1` is from the `-2d4`. All of these numbers are summed to give the total, `18`.

If you roll an expression with only one term then the result will omit the middle bit:

```
1d20 ➔ 18
```

### `!!` aka reroll

The reroll command repeats your previous `!roll`.

### `!help`

Will show a brief summary of all of the commands. This command can only be used once per minute.

## Help & support

Please either create an issue here on github, or contact iyoro#0003 on Discord.

The bot is developed in the open in the interests of transparency.
