import { expect, jest, test } from 'bun:test';
import type { MainProps, ProgramProps } from 'scripts/lib/program';
import { program } from 'scripts/lib/program';
import type { NS } from '../../../NetscriptDefinitions';

const fun = jest.fn();

const getNs = ({ args }: { args: Array<string | number> }) =>
  ({
    args,
    tprint: console.log,
    exit: () => {
      throw new Error('ns.exit was called.');
    },
  }) as Partial<NS> as NS;

test('simple main body should be called', () => {
  const myProgram = program({
    main: fun,
  });

  expect(fun).toHaveBeenCalledTimes(0);
  myProgram.main(getNs({ args: [] }));
  expect(fun).toHaveBeenCalledTimes(1);
});

const booleanProgramOptions = {
  check: {
    type: 'boolean',
    alias: 'c',
  },
} satisfies ProgramProps['options'];

const mainReturnProps = jest.fn((mainProps: MainProps) => mainProps);

test('parse boolean option', () => {
  const myProgram = program({
    options: booleanProgramOptions,
    main: mainReturnProps,
  });

  expect(myProgram.main(getNs({ args: ['--check'] })).options).toStrictEqual({ check: true });
  expect(myProgram.main(getNs({ args: ['-c'] })).options).toStrictEqual({ check: true });
});

const stringAndNumberOptions = {
  name: {
    type: 'string',
    alias: 'n',
  },
  value: {
    type: 'number',
    alias: 'v',
  },
} satisfies ProgramProps['options'];

test('parse string and number options', () => {
  const myProgram = program({
    options: stringAndNumberOptions,
    main: mainReturnProps,
  });

  expect(myProgram.main(getNs({ args: ['--name', 'abc', '--value', '5'] })).options).toStrictEqual({
    name: 'abc',
    value: 5,
  });

  expect(myProgram.main(getNs({ args: ['-n', 'abc', '-v', 5] })).options).toStrictEqual({
    name: 'abc',
    value: 5,
  });
});

const twoArguments = {
  source: {
    type: 'string',
  },
  destination: {
    type: 'string',
  },
} satisfies ProgramProps['arguments'];

test('parse argument', () => {
  const myProgram = program({
    arguments: twoArguments,
    main: mainReturnProps,
  });

  expect(myProgram.main(getNs({ args: ['./src', './dist'] })).arguments).toStrictEqual({
    source: './src',
    destination: './dist',
  });
});

test('parse all', () => {
  const myProgram = program({
    arguments: twoArguments,
    options: stringAndNumberOptions,
    main: mainReturnProps,
  });

  expect(myProgram.main(getNs({ args: ['-n', 'abc', './src', './dist', '-v', 5] }))).toStrictEqual({
    arguments: {
      source: './src',
      destination: './dist',
    },
    options: {
      name: 'abc',
      value: 5,
    },
  });
});
