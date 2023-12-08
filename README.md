## About

My codes for [BitBurner](https://store.steampowered.com/app/1812820/Bitburner/) that I have some fun with in my spare time. Still WIP.

## Quick start

- Do the following steps https://github.com/bitburner-official/typescript-template/blob/main/BeginnersGuide.md. Instead of downloading the linked template, download this repo you are reading now!
- This repo uses Bun instead of NPM. Install it: https://bun.sh/docs/installation. Windows users need WSL for it, as Bun doesn't support Windows yet.
  - You can also ignore Bun and just use NPM/Yarn/PNPM. If NPM, for example, you will need to rename the `bun` in `package.json`'s `scripts` to `npm run`.

## [src/scripts/lib/program.ts](https://github.com/SrBrahma/bitburner/blob/main/src/scripts/lib/program/program.ts)

This is a util function that quickly creates a CLI program with typed arguments and options support and returns the `main` and `autocomplete` functions, consumed by BitBurner.

Your programs will automatically have `--help` options that will print its description, arguments, and options like this example, present in its [test file](https://github.com/SrBrahma/bitburner/blob/main/src/scripts/lib/program/program.test.ts):

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
