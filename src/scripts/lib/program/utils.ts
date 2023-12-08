/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Arguments,
  GetArgumentsTypes,
  GetOptionsTypes,
  Options,
  ProgramProps,
} from 'scripts/lib/program/program';
import { errorExitWithHelp } from 'scripts/lib/utils';

export const isValidNumber = (value: unknown) =>
  typeof value === 'number'
    ? true
    : typeof value !== 'string'
      ? false
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        !isNaN(value as any) && !isNaN(parseFloat(value));

export const parseInput = ({
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

export const getArgsString = <A extends Arguments, O extends Options>(props: {
  args: GetArgumentsTypes<A>;
  options: GetOptionsTypes<O>;
  /** So we can properly order the given args obj into the resulting string */
  originalArgs: A;
}): string => {
  const result: Array<string> = [];

  Object.entries(props.options).forEach(([key, val]) => {
    if (val !== false) {
      result.push(`--${key}`);
      if (val !== true) result.push(String(val));
    }
  });

  Object.keys(props.originalArgs).forEach((argKey) => {
    const val = props.args[argKey as keyof A];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (val === undefined) throw new Error(`Missing value for the parameter of name ${argKey}`);

    result.push(String(val));
  });

  return result.join(' ');
};
