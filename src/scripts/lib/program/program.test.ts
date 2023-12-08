import { expect, jest, test } from 'bun:test';
import type { MainProps, ProgramProps } from 'scripts/lib/program/program';
import { program } from 'scripts/lib/program/program';
import type { NS } from '../../../../NetscriptDefinitions';

const mockNs = (props: Partial<NS>) =>
  ({
    tprint: console.log,
    getScriptName: () => '$SCRIPT_NAME',
    exit: () => {
      throw new Error('ns.exit was called.');
    },
    ...props,
  }) as Partial<NS> as NS;

const mainReturnProps = jest.fn((mainProps: MainProps) => mainProps);

test('simple main body should be called', () => {
  const myProgram = program({
    main: mainReturnProps,
  });

  expect(mainReturnProps).toHaveBeenCalledTimes(0);
  myProgram.main(mockNs({ args: [] }));
  expect(mainReturnProps).toHaveBeenCalledTimes(1);
});

const booleanProgramOptions = {
  check: {
    type: 'boolean',
    alias: 'c',
  },
} satisfies ProgramProps['options'];

test('parse boolean option', () => {
  const myProgram = program({
    options: booleanProgramOptions,
    main: mainReturnProps,
  });

  expect(myProgram.main(mockNs({ args: ['--check'] }))?.options).toStrictEqual({ check: true });
  expect(myProgram.main(mockNs({ args: ['-c'] }))?.options).toStrictEqual({ check: true });
});

const stringAndNumberOptions = {
  name: {
    type: 'string',
    alias: 'n',
    description: 'Some cool description',
  },
  value: {
    type: 'number',
    alias: 'v',
    description: 'An even cooler description',
  },
} satisfies ProgramProps['options'];

test('parse string and number options', () => {
  const myProgram = program({
    options: stringAndNumberOptions,
    main: mainReturnProps,
  });

  const expected = {
    name: 'abc',
    value: 5,
  };

  expect(
    myProgram.main(mockNs({ args: ['--name', 'abc', '--value', '5'] }))?.options,
  ).toStrictEqual(expected);
  expect(myProgram.main(mockNs({ args: ['-n', 'abc', '-v', 5] }))?.options).toStrictEqual(expected);
});

const twoArguments = {
  source: {
    type: 'string',
    description: 'The path of the file you are copying',
  },
  destination: {
    type: 'string',
    description: 'The path where the file should be copied to',
  },
} satisfies ProgramProps['args'];

test('parse argument', () => {
  const myProgram = program({
    args: twoArguments,
    main: mainReturnProps,
  });

  expect(myProgram.main(mockNs({ args: ['./src', './dist'] }))?.args).toStrictEqual({
    source: './src',
    destination: './dist',
  });
});

test('parse all', () => {
  const myProgram = program({
    args: twoArguments,
    options: stringAndNumberOptions,
    main: mainReturnProps,
  });

  expect(myProgram.main(mockNs({ args: ['-n', 'abc', './src', './dist', '-v', 5] }))).toStrictEqual(
    {
      args: {
        source: './src',
        destination: './dist',
      },
      options: {
        name: 'abc',
        value: 5,
      },
    },
  );
});

test('have --help and -h options and display the help', () => {
  const myProgram = program({
    description: 'This is a cool program that does cool stuff.',
    args: twoArguments,
    options: stringAndNumberOptions,
    main: mainReturnProps,
  });

  let weGot: string | undefined;
  const tprint = jest.fn((e) => {
    weGot = e;
  });
  const text = `This is a cool program that does cool stuff.

Usage: $SCRIPT_NAME [options] <source> <destination>

Arguments:

  source                 The path of the file you are copying.
  destination            The path where the file should be copied to.

Options:

  --name, -n <string>    Some cool description.
  --value, -v <number>   An even cooler description.
  --help, -h             Display the help.
`;

  myProgram.main(mockNs({ args: ['--help'], tprint }));
  // .toHaveBeenCalledWith error message isn't as good as .toBe. This saves time when text doesn't match.
  expect(weGot).toBe(text);
  weGot = undefined as string | undefined;
  myProgram.main(mockNs({ args: ['-h'] }));
  expect(weGot).toBe(text);
});
