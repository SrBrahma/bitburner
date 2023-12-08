/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NS } from '@ns';
import { printHelp } from 'scripts/lib/program/help';
import type { ProgramProps } from 'scripts/lib/program/program';

export let ns: NS;

export const setNs = (ns_: NS) => {
  ns = ns_;
};

export const printTable = (data: Array<Array<string | number>>): void => {
  // Find the maximum width of each column
  const columnWidths = data[0]?.map((_, columnIndex) =>
    Math.max(...data.map((row) => String(row[columnIndex]).length)),
  );

  let result = '\n';

  // Print each row with padding for each column
  data.forEach((row) => {
    const paddedRow = row
      .map((item, index) => String(item).padEnd(columnWidths?.[index] ?? 0, ' '))
      .join(' | ');

    result += paddedRow + '\n';
  });
  ns.tprint(result);
};

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
export function errorExitWithHelp(errorMessage: string, props: ProgramProps<any, any, any>): never {
  ns.tprint('ERROR: ' + errorMessage + '\n');
  printHelp(props);
  ns.exit();
}
