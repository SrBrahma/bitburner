import { expect, test } from 'bun:test';
import { getArgsString } from 'scripts/lib/program/utils';

test('getArgsString works', () => {
  expect(
    getArgsString({
      args: {
        b: 'B',
        a: 'A',
      },
      options: {
        boolean: true,
        ignore: false,
        string: 'a',
        number: 1,
      },
      originalArgs: {
        a: {
          type: 'string',
        },
        b: {
          type: 'string',
        },
      },
    }),
  ).toBe('--boolean --string a --number 1 A B');
});
