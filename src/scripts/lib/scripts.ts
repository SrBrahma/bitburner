/* eslint-disable @typescript-eslint/no-explicit-any */
import * as growProgram from 'scripts/grow';
import * as hackProgram from 'scripts/hack';
import type { Program } from 'scripts/lib/program/program';
import { ns } from 'scripts/lib/utils';
import * as weakenProgram from 'scripts/weaken';

type Script<T extends Program> = Pick<T, 'exec' | 'path'> & {
  ram: number;
  ramForThreads: (threads: number) => number;
  execOrExit: T['exec'];
  execAsync: (props: Parameters<T['exec']>[0], expectedTime: number) => Promise<void>;
};

const getScript = <T extends Program<any, any, any>>(props: T): Script<T> => {
  const execOrExit: Script<T>['execOrExit'] = (p) => {
    const pid = props.exec(p);

    if (pid === -1) {
      ns.tprint(`ERROR: Couldn't start process. Missing RAM.`);
      ns.exit();
    }

    return pid;
  };

  return {
    ...props,
    ram: ns.getScriptRam(props.path),
    ramForThreads: (threads) => ns.getScriptRam(props.path) * threads,
    execOrExit,
    execAsync: async (props, expectedTime) => {
      const pid = execOrExit(props);

      await awaitPid({ pid, expectedTime });
    },
  };
};

export const scripts = {
  grow: getScript(growProgram),
  weaken: getScript(weakenProgram),
  hack: getScript(hackProgram),
};

export const awaitPid = async (props: { expectedTime: number; pid: number }): Promise<void> => {
  await ns.sleep(props.expectedTime + 5);
  while (ns.getRunningScript(props.pid)) {
    const delay = 10;

    ns.tprint(
      `WARNING: The script is still running after the expected time! Waiting more ${delay}ms.`,
    );
    await ns.sleep(delay);
  }
};
