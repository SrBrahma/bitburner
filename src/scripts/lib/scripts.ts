import type { Obj } from 'scripts/lib/types';
import { ns } from 'scripts/lib/utils';

type ExecProps = Obj;

type ScriptInput<T extends ExecProps = ExecProps> = {
  path: string;
  exec: (initProps: { script: string }) => (props: T) => number;
};

type Script<T extends ExecProps> = Omit<ScriptInput<T>, 'exec'> & {
  ram: (threads: number) => number;
  exec: (props: T) => number;
};

const getScript = <T extends ExecProps>(props: ScriptInput<T>): Script<T> => ({
  ...props,
  ram: (threads): number => ns.getScriptRam(scripts.hack.path) * threads,
  exec: props.exec({ script: props.path }),
});

type CommonExecProps = {
  /** @default 'home' */
  host?: string;
  threads: number;
  target: string;
  delayMs?: number;
};

export const scripts = {
  hack: getScript({
    path: 'scripts/hack.js',
    exec:
      ({ script }) =>
      (props: CommonExecProps) =>
        ns.exec(
          script,
          (props.host = 'home'),
          { threads: props.threads },
          props.target,
          (props.delayMs = 0),
        ),
  }),
  grow: getScript({
    path: 'scripts/grow.js',
    exec:
      ({ script }) =>
      (props: CommonExecProps) =>
        ns.exec(
          script,
          (props.host = 'home'),
          { threads: props.threads },
          props.target,
          (props.delayMs = 0),
        ),
  }),
  weaken: getScript({
    path: 'scripts/weaken.js',
    exec:
      ({ script }) =>
      (props: CommonExecProps) =>
        ns.exec(
          script,
          (props.host = 'home'),
          { threads: props.threads },
          props.target,
          (props.delayMs = 0),
        ),
  }),
};
