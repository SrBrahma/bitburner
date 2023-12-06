import type { AutocompleteData, NS } from '@ns';
import type { Args } from 'scripts/lib/types';

export const main = async (ns: NS) => {
  while (true) {
    const growth = await ns.grow(ns.args[0] as string, { additionalMsec: ns.args[1] as number });

    if (ns.args.find((arg) => arg === '-s')) {
      ns.toast(`Finished, grown by ${ns.formatNumber(growth)}`, 'success');

      return;
    }
  }
};

export const autocomplete = (data: AutocompleteData, args: Args) => data.servers;
