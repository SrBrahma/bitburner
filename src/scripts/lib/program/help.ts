import type { Option, ProgramProps } from 'scripts/lib/program/program';
import { ns } from 'scripts/lib/utils';

export const printHelp = (props: ProgramProps) => {
  const optionsArray = Object.entries(props.options ?? {}).map((e) => ({
    ...e[1],
    name: e[0],
  }));

  const argumentsArray = Object.entries(props.args ?? {}).map((e) => ({
    ...e[1],
    name: e[0],
  }));

  const getOptionFirstColumn = (opt: Option & { name: string }): string =>
    '--' +
    (opt.name +
      (opt.alias ? `, -${opt.alias}` : '') +
      (opt.type !== 'boolean' ? ` <${opt.argumentName ?? opt.type}>` : ''));

  let text = '';

  if (props.description) text += `${props.description}\n\n`;

  text += `Usage: ${ns.getScriptName()}`;

  if (optionsArray.length) text += ' [options]';
  if (argumentsArray.length) text += ' ' + argumentsArray.map((a) => `<${a.name}>`).join(' ');

  const minSpaces = 3;

  const maxLength =
    ([
      ...argumentsArray.map((a) => a.name.length),
      ...optionsArray.map((o) => getOptionFirstColumn(o).length),
    ].sort((a, b) => b - a)[0] ?? 0) + minSpaces;

  if (argumentsArray.length) {
    text += `\n\nArguments:`;
    text += `\n\n${argumentsArray
      .map((arg) => '  ' + arg.name.padEnd(maxLength) + arg.description)
      .join('\n')}`;
  }

  if (optionsArray.length) {
    text += `\n\nOptions:`;
    text += `\n\n${optionsArray
      .map((opt) => '  ' + getOptionFirstColumn(opt).padEnd(maxLength) + opt.description)
      .join('\n')}`;
  }

  text += '\n';
  ns.tprint(text);
};
