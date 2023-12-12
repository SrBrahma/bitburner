import { getCommonFunction } from 'lib/program/growHackWeakenCommon';
import { ns } from 'lib/utils';

export const { main, autocomplete, exec, path } = getCommonFunction({
  fun: ns.hack,
  path: 'grow',
});
