import type { AutocompleteData, NS } from '@ns';
import type { Args } from 'scripts/lib/types';

export const main = async (ns: NS) => {
  while (true) await ns.hack(ns.args[0] as string, { additionalMsec: ns.args[1] as number });
};

export const autocomplete = (data: AutocompleteData, args: Args) => {
  return data.servers;
};
