import { scripts } from 'scripts/lib/scripts';
import { getThreadsToWeaken, ns } from 'scripts/lib/utils';

export class Server {
  static setSecurityToMin = async ({
    target,
    additional = 0,
  }: {
    target: string;
    additional?: number;
  }) => {
    const deltaSecurity =
      ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target) + additional;

    if (deltaSecurity > 0) {
      const threadsToWeaken = getThreadsToWeaken(deltaSecurity);
      const timeToWeaken = ns.getWeakenTime(target);

      ns.tprint(
        `Security delta is ${deltaSecurity}. Using ${threadsToWeaken} threads to set it to the minimum. Will take ${ns.tFormat(
          timeToWeaken,
        )}.`,
      );
      const process = ns.run(scripts.weaken.path, { threads: threadsToWeaken }, target);

      if (process === -1) {
        ns.tprint(`ERROR: Couldn't start weaken process. Missing RAM.`);
        ns.exit();
      }
      await ns.sleep(ns.getWeakenTime(target) + 10);
      while (ns.getRunningScript(process)) {
        const delay = 100;

        ns.tprint(
          `WARNING: The weaken script is still running after the expected time! Waiting more ${delay}ms.`,
        );
        await ns.sleep(delay);
      }
    }
  };

  /** Returns true if already had root or it was now adquired. */
  static getRoot = (host: string): boolean => {
    if (ns.hasRootAccess(host)) return true;

    const hacks = [
      ns.fileExists('BruteSSH.exe') && ((host: string) => ns.brutessh(host)),
      ns.fileExists('FTPCrack.exe') && ((host: string) => ns.ftpcrack(host)),
      ns.fileExists('relaySMTP.exe') && ((host: string) => ns.relaysmtp(host)),
      ns.fileExists('HTTPWorm.exe') && ((host: string) => ns.httpworm(host)),
      ns.fileExists('SQLInject.exe') && ((host: string) => ns.sqlinject(host)),
    ].filter(Boolean);

    if (
      ns.getHackingLevel() < ns.getServerRequiredHackingLevel(host) ||
      ns.getServerNumPortsRequired(host) > hacks.length
    )
      return false;

    hacks.forEach((hack) => hack(host));
    ns.nuke(host);

    return true;
  };
}
