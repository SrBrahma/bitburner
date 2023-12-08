/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { printHelp } from 'scripts/lib/program/help';
import { getArgsString, parseInput } from 'scripts/lib/program/utils';
import { errorExitWithHelp, ns, setNs } from 'scripts/lib/utils';
import type { AutocompleteData, NS, RunOptions } from '../../../../NetscriptDefinitions';

type Argument = {
  description?: string;
  type: 'string' | 'number';
};

type Empty = Record<string, never>;

export type Arguments = Record<string, Argument>;

export type Option = {
  description?: string;
  alias?: string;
} & (
  | {
      /** The type of the option. */
      type: 'boolean';
    }
  | {
      /** The type of the option. */
      // TODO add 'server'
      type: 'string' | 'number';
      /**
       * How is the option's argument called. Used in the help.
       * Defaults to the type of the option, such as `<string>`.
       * @example "maxValue" in `--max, -m <maxValue>`
       */
      argumentName?: string;
    }
);

export type Options = Record<string, Option>;

export type GetArgumentsTypes<T extends Arguments> = {
  [K in keyof T]: T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'string'
      ? string
      : T[K]['type'] extends 'number'
        ? number
        : unknown;
};

export type GetOptionsTypes<T extends Options> = {
  [K in keyof T]?: T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'string'
      ? string
      : T[K]['type'] extends 'number'
        ? number
        : unknown;
};

export type MainProps<A extends Arguments = Arguments, O extends Options = Options> = {
  args: GetArgumentsTypes<A>;
  options: GetOptionsTypes<O>;
};

export type ProgramProps<
  A extends Arguments = Arguments,
  O extends Options = Options,
  R = unknown,
> = {
  /**
   * The order of the arguments is the same as how they are defined on the object.
   * @example (cp) `<source> <destination>`
   */
  args?: A;
  /**
   * @example `--foo`, `-f`, `--foo <bar>`
   */
  options?: O;
  main: MainType<A, O, R>;
  /**
   * The path from the server's root ('/') to the program file.
   *
   * Used in the program's returning .exec and also returned by program() for further usages.
   * @example 'scripts/hack.js'
   */
  path?: string;
  /** The description of this program. Shown on --help. */
  description?: string;
};

type MainType<A extends Arguments = Arguments, O extends Options = Options, R = unknown> = (
  props: MainProps<A, O>,
) => R | void;

export type GetMainFromProps<T extends Pick<ProgramProps, 'args' | 'options'>> = MainType<
  T['args'] extends Arguments ? T['args'] : Empty,
  T['options'] extends Options ? T['options'] : Empty
>;

type ExpectedOption<O extends Options = Options> = { name: keyof O & string } & Omit<
  Option,
  'type'
> & { type: Exclude<Option['type'], 'boolean'> };

type ExecProps<A extends Arguments, O extends Options> = MainProps<A, O> & {
  /** @default 'home' */
  hostname?: string;
  threadOrOptions?: number | RunOptions;
};

export type Exec<A extends Arguments = Arguments, O extends Options = Options> = (
  props: ExecProps<A, O>,
) => number;

export type Program<A extends Arguments = Arguments, O extends Options = Options, R = unknown> = {
  main: (ns: NS) => R | void;
  autocomplete: (data: AutocompleteData, args: Array<string | number>) => Array<string>;
  exec: Exec<A, O>;
} & Required<Pick<ProgramProps, 'path'>>;

export const program = <A extends Arguments, O extends Options, R = unknown>(
  props: ProgramProps<A, O, R>,
): Program<A, O, R> => {
  const extendedProps = {
    ...props,
    options: {
      ...props.options,
      help: {
        type: 'boolean',
        alias: 'h',
        description: 'Display the help.',
      },
    } as unknown as O,
  };

  const optionsArray = Object.entries(extendedProps.options).map(([name, opt]) => ({
    ...opt,
    name: name as keyof O & string,
  }));

  const argumentsArray = Object.entries(extendedProps.args ?? {}).map(([name, arg]) => ({
    ...arg,
    name: name as keyof A & string,
  }));

  const main = (ns: NS) => {
    setNs(ns);

    const resultingArguments: Partial<GetArgumentsTypes<A>> = {};
    const resultingOptions: Partial<GetOptionsTypes<O>> = {};
    const remainingArguments = [...argumentsArray];
    let expectedOptArg: ExpectedOption<O> | null = null;

    for (const arg of ns.args) {
      // Check if it's an option's argument (the value you provide after a --option that expects a value for it)
      if (expectedOptArg) {
        const optionArgumentValue = parseInput({
          input: arg,
          type: expectedOptArg.type,
          mode: 'option',
          name: expectedOptArg.name,
          programProps: extendedProps,
        });

        resultingOptions[expectedOptArg.name] =
          optionArgumentValue as (typeof resultingOptions)[typeof expectedOptArg.name];
        expectedOptArg = null;
      }
      // Check if it's an option (e.g. --option)
      else if (typeof arg === 'string' && arg.startsWith('-')) {
        const isFullName = arg.startsWith('--');
        const optionWithoutDashes = arg.replace(/^-{1,2}/, '');
        const option = optionsArray.find((option) =>
          isFullName ? option.name === optionWithoutDashes : option.alias === optionWithoutDashes,
        );

        if (!option)
          errorExitWithHelp(
            `The option "${optionWithoutDashes}" isn't a valid option.`,
            extendedProps,
          );
        if (option.name === 'help') return printHelp(extendedProps as any);
        if (option.type === 'boolean') {
          resultingOptions[option.name] = true as (typeof resultingOptions)[typeof option.name];
        } else {
          expectedOptArg = { ...option };
        }
      }
      // Check if it's an argument (e.g. <source>)
      else if (remainingArguments[0]) {
        const argument = remainingArguments[0];

        remainingArguments.shift();

        const argumentValue = parseInput({
          input: arg,
          type: argument.type,
          mode: 'argument',
          name: argument.name,
          programProps: extendedProps,
        });

        resultingArguments[argument.name] =
          argumentValue as (typeof resultingArguments)[typeof argument.name];
      }
      // Else, error
      else {
        errorExitWithHelp(`Received unexpected arg ${arg}.`, extendedProps);
      }
    }

    if (remainingArguments[0])
      errorExitWithHelp(
        `Missing value for the argument "${remainingArguments[0].name}".`,
        extendedProps,
      );

    if (expectedOptArg)
      errorExitWithHelp(`Missing value for the option "${expectedOptArg.name}".`, extendedProps);

    return extendedProps.main({
      args: resultingArguments as GetArgumentsTypes<A>,
      options: resultingOptions as GetOptionsTypes<O>,
    });
  };

  const path = extendedProps.path ?? 'Define path property to use .exec';

  return {
    main,
    path,
    // TODO. Shouldn't be hard.
    autocomplete: () => [],
    exec: (execProps) =>
      ns.exec(
        path,
        execProps.hostname ?? 'home',
        execProps.threadOrOptions,
        getArgsString({
          args: execProps.args,
          options: execProps.options,
          originalArgs: extendedProps.args ?? {},
        }),
      ),
  };
};

export type GetMainType<T extends ProgramProps> = T['main'];
