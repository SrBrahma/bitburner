import { getCommonFunction } from 'scripts/lib/program/growHackWeakenCommon';
import { ns } from 'scripts/lib/utils';

export const { main, autocomplete } = getCommonFunction(ns.weaken);
