## About

My codes for [BitBurner](https://store.steampowered.com/app/1812820/Bitburner/) that I have some fun with in my spare time. Still WIP.

## Quick start

1) Do the following steps https://github.com/bitburner-official/typescript-template/blob/main/BeginnersGuide.md. Instead of downloading the linked template, download this repo you are reading now!
2) This repo uses Bun. Install it: https://bun.sh/docs/installation. Windows users need WSL for it as Bun doesn't support Windows yet.
   - You can also ignore Bun and just use npm/yarn/Pnpm. If npm, for example, you will need to rename the `bun` in `package.json`'s `scripts` to `npm run`.

### Note
As the template guide says:
> If the terminal shows error TS2307: Cannot find module '@ns' or its corresponding type declarations. (or see the same error in your editor), it is fine. The missing type declaration NetscriptDefinitions.d.ts will be downloaded from the game once connected.

## src/scripts/lib/program.ts

This is a util function that quickly creates a CLI program with typed arguments and options support and returns the `main` and `autocomplete` functions, consumed by BitBurner.

Your programs will automatically have `--help` options that will print its description, arguments, and options like this example, present in its test file:

```bash
This is a cool program that does cool stuff.

Usage: $SCRIPT_NAME [options] <source> <destination>

Arguments:

  source                 The path of the file you are copying.
  destination            The path where the file should be copied to.

Options:

  --name, -n <string>    Some cool description.
  --value, -v <number>   An even cooler description.
  --help, -h             Display the help.
```
