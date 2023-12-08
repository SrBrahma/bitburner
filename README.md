## About

My codes for [BitBurner](https://store.steampowered.com/app/1812820/Bitburner/) that I have some fun with in my spare time. Still WIP.

## Quick start

1) Do the following steps https://github.com/bitburner-official/typescript-template/blob/main/BeginnersGuide.md. Instead of downloading the linked template, download this repo you are reading now!
2) This repo uses Bun. Install it: https://bun.sh/docs/installation. Windows users need WSL for it as Bun doesn't support Windows yet.
   - You can also ignore Bun and just use npm/yarn/Pnpm. If npm, for example, you will need to rename the `bun` in `package.json`'s `scripts` to `npm run`.

### Note
As the template guide says:
> If the terminal shows error TS2307: Cannot find module '@ns' or its corresponding type declarations. (or see the same error at your editor), it is fine. The missing type declaration NetscriptDefinitions.d.ts will be downloaded from the game once connected.
