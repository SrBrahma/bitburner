/* eslint-disable @typescript-eslint/no-explicit-any */
import * as growProgram from 'scripts/grow';
import * as hackProgram from 'scripts/hack';
import type { Program } from 'scripts/lib/program/program';
import { ns } from 'scripts/lib/utils';
import * as weakenProgram from 'scripts/weaken';

type Script<T extends Program> = Pick<T, 'exec' | 'path'> & {
  ram: (threads: number) => number;
};

const getScript = <T extends Program<any, any, any>>(props: T): Script<T> => ({
  ...props,
  ram: (threads: number): number => ns.getScriptRam(props.path) * threads,
});

export const scripts = {
  grow: getScript(growProgram),
  weaken: getScript(weakenProgram),
  hack: getScript(hackProgram),
};
