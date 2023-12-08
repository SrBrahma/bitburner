import { scripts } from 'scripts/lib/scripts';
import { Servers } from 'scripts/lib/servers';
import type { HWGW, HWGWSteps, StepData } from 'scripts/lib/steps';
import type { ServersList } from 'scripts/lib/types';
import { ns } from 'scripts/lib/utils';

type ScheduledStepData = StepData & {
  host: string;
};

type A = Record<HWGW, ScheduledStepData>;

type ScheduledSteps = Array<A>;

const deepCopy = <T>(obj: T) => JSON.parse(JSON.stringify(obj)) as T;

const getScheduledSteps = ({
  serversButHome,
  steps,
}: {
  serversButHome: ServersList;
  steps: HWGWSteps;
}): ScheduledSteps => {
  let serversRams = Servers.getServersRams(serversButHome);
  const scheduledSteps: ScheduledSteps = [];
  const stepsToFind = Object.entries(steps).sort((a, b) => b[1].threads - a[1].threads);

  while (true) {
    const tempServersRams = deepCopy(serversRams);
    const result: A | undefined = stepsToFind.reduce(
      (obj, x) => {
        if (!obj) return undefined;

        tempServersRams.sort((a, b) => a.ram - b.ram);
        const tempServer = tempServersRams.find((s) => s.ram >= x[1].ram);

        if (!tempServer) return undefined;

        tempServer.ram -= x[1].ram;
        const key: HWGW = x[0] as HWGW;
        const res: A = {
          ...obj,
          [key]: {
            ...x[1],
            host: tempServer.host,
          },
        };

        return res;
      },
      deepCopy(steps) as A | undefined,
    );

    if (!result) return scheduledSteps;

    serversRams = tempServersRams;
    scheduledSteps.push(result);
  }
};

export const runSuperSchedule = async ({
  target,
  steps,
  serversButHome,
}: {
  target: string;
  steps: HWGWSteps;
  serversButHome: ServersList;
}) => {
  const delayMs = 10;
  const longestTime = steps.weakenHack.timeMs;

  const scheduledStepi = getScheduledSteps({ serversButHome, steps });

  ns.tprint('Batches: ', scheduledStepi.length);

  for (const scheduledSteps of scheduledStepi) {
    scripts.weaken.exec({
      host: scheduledSteps.weakenHack.host,
      target,
      threads: scheduledSteps.weakenHack.threads,
      delayMs: 0,
    });
    await ns.sleep(delayMs);

    scripts.grow.exec({
      host: scheduledSteps.grow.host,
      target,
      threads: scheduledSteps.grow.threads,
      delayMs: longestTime - scheduledSteps.grow.timeMs,
    });
    await ns.sleep(delayMs);

    scripts.weaken.exec({
      host: scheduledSteps.weakenGrow.host,
      target,
      threads: scheduledSteps.weakenGrow.threads,
      delayMs: 0,
    });
    await ns.sleep(delayMs);

    scripts.weaken.exec({
      host: scheduledSteps.weakenGrow.host,
      target,
      threads: scheduledSteps.weakenGrow.threads,
      delayMs: longestTime - scheduledSteps.hack.timeMs,
    });
    await ns.sleep(delayMs);
  }
};
