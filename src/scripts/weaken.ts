/* eslint-disable func-style */
import type { AutocompleteData } from '@ns';
import { program } from 'scripts/lib/program';
import type { Args } from 'scripts/lib/types';
import { ns } from 'scripts/lib/utils';

export const autocompletea = (data: AutocompleteData, args: Args) => {
  return data.servers;
};
export const { main, autocomplete } = program({
  main: async () => {
    while (true) await ns.weaken(ns.args[0] as string, { additionalMsec: ns.args[1] as number });
  },
});
