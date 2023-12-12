import { program } from 'lib/program/program';
import { ns } from 'lib/utils';

console.log('AAA');
export const getCommonFunction = ({
  fun,
  path,
}: {
  fun: typeof ns.weaken | typeof ns.hack | typeof ns.grow;
  path: string;
}) =>
  program({
    path,
    main: async ({ args, options }) => {
      if (options.times && options.times < 0) ns.tprint('ERROR: times arg must be >= 0.');

      for (let i = options.times || Infinity; i > 0; i--)
        await fun(args.target, { additionalMsec: options.delay });
    },
    args: {
      target: {
        type: 'string',
        description: 'The hostname that this program will target.',
      },
    },
    options: {
      delay: {
        type: 'number',
        argumentName: 'timeMs',
        description:
          'Additional time in milliseconds that will be waited before the main routine runs.',
      },
      times: {
        type: 'number',
        description: 'How many times to run it. If 0, run indefinitely.',
      },
    },
  });
