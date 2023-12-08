/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { printHelp } from 'scripts/lib/program/help';
import type { Args } from 'scripts/lib/types';
import { ns, setNs } from 'scripts/lib/utils';
import type { AutocompleteData, NS } from '../../../../NetscriptDefinitions';

type Argument = {
  description?: string;
  type: 'string' | 'number';
};

type Empty = Record<string, never>;

type Arguments = Record<string, Argument>;

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

type Options = Record<string, Option>;

type GetTypes<T extends Arguments | Options> = {
  [K in keyof T]: T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'string'
      ? string
      : T[K]['type'] extends 'number'
        ? number
        : unknown;
};

export type MainProps<A extends Arguments = Arguments, O extends Options = Options> = {
  args: GetTypes<A>;
  options: Partial<GetTypes<O>>;
};

export type ProgramProps<
  A extends Arguments = Arguments,
  O extends Options = Options,
  R = unknown,
> = {
  /**
   * @example (cp) `<source> <destination>`
   */
  args?: A;
  /**
   * @example `--foo`, `-f`, `--foo <bar>`
   */
  options?: O;
  main: MainType<A, O, R>;
  description?: string;
};

type MainType<A extends Arguments = Arguments, O extends Options = Options, R = unknown> = (
  props: MainProps<A, O>,
) => R | void;

export type GetMainFromProps<T extends Pick<ProgramProps, 'args' | 'options'>> = MainType<
  T['args'] extends Arguments ? T['args'] : Empty,
  T['options'] extends Options ? T['options'] : Empty
>;

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
function errorExitWithHelp(errorMessage: string, props: ProgramProps<any, any, any>): never {
  ns.tprint('ERROR: ' + errorMessage + '\n');
  printHelp(props);
  ns.exit();
}

const isValidNumber = (value: unknown) =>
  typeof value === 'number'
    ? true
    : typeof value !== 'string'
      ? false
      : !isNaN(value as any) && !isNaN(parseFloat(value));

const parseInput = ({
  input,
  type,
  mode,
  name,
  programProps,
}: {
  input: string | number | boolean;
  type: 'string' | 'number';
  name: string;
  mode: 'option' | 'argument';
  programProps: ProgramProps<any, any, any>;
}): string | number => {
  switch (type) {
    case 'string':
      return String(input);
    case 'number': {
      if (!isValidNumber(input))
        errorExitWithHelp(
          `Expected a valid number for the ${mode} "${name}" but received "${input}".`,
          programProps,
        );

      return Number(input);
    }
  }
};

type ExpectedOption<O extends Options = Options> = { name: keyof O & string } & Omit<
  Option,
  'type'
> & { type: Exclude<Option['type'], 'boolean'> };

type ProgramReturn<R = unknown> = {
  main: (ns: NS) => R | void;
  autocomplete: (data: AutocompleteData, args: Args) => Array<string>;
};

export const program = <A extends Arguments, O extends Options, R = unknown>(
  props: ProgramProps<A, O, R>,
): ProgramReturn<R> => {
  const extendedProps = {
    ...props,
    options: {
      ...props.options,
      help: {
        type: 'boolean',
        alias: 'h',
        description: 'Display the help',
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

    const resultingArguments: Partial<GetTypes<A>> = {};
    const resultingOptions: Partial<GetTypes<O>> = {};
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
      args: resultingArguments as GetTypes<A>,
      options: resultingOptions as GetTypes<O>,
    });
  };

  return {
    main,
    // TODO. Shouldn't be hard.
    autocomplete: (data, args) => [],
  };
};

export type GetMainType<T extends ProgramProps> = T['main'];
