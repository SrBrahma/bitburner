import { scripts } from 'lib/scripts';
import { Servers } from 'lib/servers';
import type { HWGW, HWGWSteps, StepData } from 'lib/steps';
import type { ServersList } from 'lib/types';
import { ns } from 'lib/utils';

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
  const delayMs = 5;
  const longestTime = steps.weakenHack.timeMs;

  const scheduledStepi = getScheduledSteps({ serversButHome, steps });

  ns.tprint('Batches: ', scheduledStepi.length);

  for (const scheduledSteps of scheduledStepi) {
    scripts.weaken.exec({
      hostname: scheduledSteps.weakenHack.host,
      args: {
        target,
      },
      threadOrOptions: scheduledSteps.weakenHack.threads,
    });
    await ns.sleep(delayMs);

    scripts.grow.exec({
      hostname: scheduledSteps.grow.host,
      args: {
        target,
      },
      threadOrOptions: scheduledSteps.grow.threads,
      options: {
        delay: longestTime - scheduledSteps.grow.timeMs,
      },
    });
    await ns.sleep(delayMs);

    scripts.weaken.exec({
      hostname: scheduledSteps.weakenGrow.host,
      args: {
        target,
      },
      threadOrOptions: scheduledSteps.weakenGrow.threads,
    });
    await ns.sleep(delayMs);

    scripts.weaken.exec({
      hostname: scheduledSteps.weakenGrow.host,
      args: {
        target,
      },
      options: {
        delay: longestTime - scheduledSteps.hack.timeMs,
      },
      threadOrOptions: scheduledSteps.weakenGrow.threads,
    });
    await ns.sleep(delayMs);
  }
};
