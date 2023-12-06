import { scripts } from 'scripts/lib/scripts';
import { getThreadsToWeaken, ns } from 'scripts/lib/utils';

export type StepData = {
  threads: number;
  ram: number;
  timeMs: number;
};

export type HWGW = 'grow' | 'hack' | 'weakenGrow' | 'weakenHack';

export type HWGWSteps = Record<HWGW, StepData>;

export const getHWGWSteps = ({
  target,
  percentageToHack,
}: {
  target: string;
  percentageToHack: number;
}): HWGWSteps => {
  const safeMult = 1.2; // Just to be sure. Later remove this when more mature.
  const moneyToHack = ns.getServerMaxMoney(target) * percentageToHack;

  const threadsToGrow = Math.max(
    1,
    Math.ceil(ns.growthAnalyze(target, 1 / (1 - percentageToHack)) * safeMult),
  );
  const threadsToHack = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, moneyToHack)));
  const threadsWeakenGrow = getThreadsToWeaken(0.004 * threadsToGrow * safeMult);
  const threadsWeakenHack = getThreadsToWeaken(0.002 * threadsToHack * safeMult);

  return {
    grow: {
      threads: threadsToGrow,
      timeMs: ns.getGrowTime(target),
      ram: scripts.grow.ram(threadsToGrow),
    },
    hack: {
      threads: threadsToHack,
      timeMs: ns.getHackTime(target),
      ram: scripts.hack.ram(threadsToHack),
    },
    weakenGrow: {
      threads: threadsWeakenGrow,
      timeMs: ns.getWeakenTime(target),
      ram: scripts.weaken.ram(threadsWeakenGrow),
    },
    weakenHack: {
      threads: threadsWeakenHack,
      timeMs: ns.getWeakenTime(target),
      ram: scripts.weaken.ram(threadsWeakenHack),
    },
  };
};
