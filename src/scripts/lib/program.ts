/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Args } from 'scripts/lib/types';
import { ns, setNs } from 'scripts/lib/utils';
import type { AutocompleteData, NS } from '../../../NetscriptDefinitions';

// type Command = {
//   description: string;
//   arguments: Array<Argument>;
//   options: Array<Option>;
// };

type Argument = {
  description?: string;
  type: 'string' | 'number';
};

type Empty = Record<string, never>;

type Arguments = Record<string, Argument>;

type Option = {
  description?: string;
  alias?: string;
} & (
  | {
      /** The type of the option. */
      type: 'boolean';
    }
  | {
      /** The type of the option. */
      type: 'string' | 'number';
      /**
       * How is the option's argument called. Used in the help.
       * @example The "maxValue" in `--max <maxValue>`
       * @default value
       */
      // TODO default should be 'string' or 'number' deppending on `type`
      argumentName?: string;
    }
);

type Options = Record<string, Option>;

type GetNamesAndTypes<T extends Arguments | Options> = {
  [K in keyof T]: T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'string'
      ? string
      : T[K]['type'] extends 'number'
        ? number
        : unknown;
};

export type MainProps<A extends Arguments = Arguments, O extends Options = Options> = {
  arguments: GetNamesAndTypes<A>;
  options: GetNamesAndTypes<O>;
};

export type ProgramProps<
  A extends Arguments = Arguments,
  O extends Options = Options,
  R = unknown,
> = {
  /**
   * @example (cp) `<source> <destination>`
   */
  arguments?: A;
  /**
   * @example `--foo`, `-f`, `--foo <bar>`
   */
  options?: O;
  main: MainType<A, O, R>;
};

type MainType<A extends Arguments = Arguments, O extends Options = Options, R = unknown> = (
  props: MainProps<A, O>,
) => R;

export type GetMainFromProps<T extends Pick<ProgramProps, 'arguments' | 'options'>> = MainType<
  T['arguments'] extends Arguments ? T['arguments'] : Empty,
  T['options'] extends Options ? T['options'] : Empty
>;

const printHelp = () => {
  ns.tprint('HELP MESSAGE HERE');
};

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
function errorExitWithHelp(errorMessage: string): never {
  ns.tprint('ERROR: ' + errorMessage + '\n\n');
  printHelp();
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
}: {
  input: string | number | boolean;
  type: 'string' | 'number';
  name: string;
  mode: 'option' | 'argument';
}): string | number => {
  switch (type) {
    case 'string':
      return String(input);
    case 'number': {
      if (!isValidNumber(input))
        errorExitWithHelp(
          `Expected a valid number for the ${mode} "${name}" but received "${input}".`,
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
  main: (ns: NS) => R;
  autocomplete: (data: AutocompleteData, args: Args) => Array<string>;
};

export const program = <A extends Arguments, O extends Options, R = unknown>(
  props: ProgramProps<A, O, R>,
): ProgramReturn<R> => {
  const main = (ns: NS) => {
    setNs(ns);

    const resultingArguments: Partial<GetNamesAndTypes<A>> = {};
    const resultingOptions: Partial<GetNamesAndTypes<O>> = {};

    const optionsArray = Object.entries(props.options ?? {}).map((e) => ({
      ...e[1],
      name: e[0] as keyof O & string,
    }));

    let expectedOptArg: ExpectedOption<O> | null = null;

    const remainingArguments = Object.entries(props.arguments ?? {}).map((e) => ({
      ...e[1],
      name: e[0] as keyof A & string,
    }));

    for (const arg of ns.args) {
      if (expectedOptArg) {
        // Convert to string if we specified that the type is string but BitBurner implicitly converted to number
        const optionArgumentValue = parseInput({
          input: arg,
          type: expectedOptArg.type,
          mode: 'option',
          name: expectedOptArg.name,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultingOptions[expectedOptArg.name] = optionArgumentValue as any;
        expectedOptArg = null;
      } else if (typeof arg === 'string' && arg.startsWith('-')) {
        const isFullName = arg.startsWith('--');
        const optionWithoutDashes = arg.replace(/^-{1,2}/, '');
        const option = optionsArray.find((option) =>
          isFullName ? option.name === optionWithoutDashes : option.alias === optionWithoutDashes,
        );

        if (!option) errorExitWithHelp(`The option "${optionWithoutDashes}" isn't a valid option.`);
        if (option.type === 'boolean') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resultingOptions[option.name] = true as any;
        } else {
          expectedOptArg = { ...option };
        }
      } else if (remainingArguments[0]) {
        const argument = remainingArguments[0];

        remainingArguments.shift();

        const argumentValue = parseInput({
          input: arg,
          type: argument.type,
          mode: 'argument',
          name: argument.name,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultingArguments[argument.name] = argumentValue as any;
      } else {
        errorExitWithHelp(`Received unexpected arg ${arg}.`);
      }
    }

    if (remainingArguments[0]) {
      errorExitWithHelp(`Missing value for the argument "${remainingArguments[0].name}".`);
    }

    if (expectedOptArg) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      errorExitWithHelp(`Missing value for the option "${expectedOptArg.name}".`);
    }

    return props.main({
      arguments: resultingArguments as GetNamesAndTypes<A>,
      options: resultingOptions as GetNamesAndTypes<O>,
    });
  };

  return {
    main,
    autocomplete: (data, args) => [],
  };
};

export type GetMainType<T extends ProgramProps> = T['main'];
