import { scripts } from 'lib/scripts';
import { ns } from 'lib/utils';

export class Server {
  // TODO gather servers to run it together
  static setSecurityToMin = async (props: { target: string; additional?: number }) => {
    while (true) {
      const threadsToWeakenToMin = Server.threadsToWeakenToMin(props.target);

      if (threadsToWeakenToMin <= 0) return;

      const threads = Math.min(
        Server.availableThreads({
          scriptRam: scripts.weaken.ram,
          host: 'home',
        }),
        threadsToWeakenToMin,
      );
      const executionTime = ns.getWeakenTime(props.target);

      ns.tprint(
        `Using ${threads} threads to lower the security (requires a total of ${threadsToWeakenToMin}). This will take ${ns.tFormat(
          executionTime,
        )}.`,
      );

      await scripts.weaken.execAsync(
        {
          args: { target: props.target },
          threadOrOptions: threads,
        },
        executionTime,
      );
    }
  };

  static setGrowToMax = async (props: { target: string }) => {
    while (true) {
      const threadsToGrowToMax = Server.threadsToGrowToMax(props.target);

      if (threadsToGrowToMax <= 0) return;

      const threads = Math.min(
        Server.availableThreads({
          scriptRam: scripts.grow.ram,
          host: 'home',
        }),
        threadsToGrowToMax,
      );
      const executionTime = ns.getGrowTime(props.target);

      ns.tprint(
        `Using ${threads} threads to lower the security (requires a total of ${threadsToGrowToMax}). This will take ${ns.tFormat(
          executionTime,
        )}.`,
      );

      await scripts.grow.execAsync(
        {
          args: { target: props.target },
          threadOrOptions: threads,
        },
        executionTime,
      );
    }
  };

  // TODO can be improved
  // 1) we could run weaken with the extra threads required by
  static prepareServerForHack = async (target: string): Promise<void> => {
    await Server.setSecurityToMin({ target });
    await Server.setGrowToMax({ target });
    await Server.setSecurityToMin({ target });
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

  static threadsToGrowToMax = (target: string): number => {
    const multiplier = Server.getMoneyMultDelta(target) * 1.001;

    return Math.max(0, Math.ceil(ns.growthAnalyze(target, multiplier)));
  };

  static getSecurityDelta = (target: string) =>
    ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);

  static getMoneyMultDelta = (target: string) =>
    ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);

  static threadsToWeakenToMin = (target: string): number =>
    Server.getThreadsToWeaken(Server.getSecurityDelta(target));

  static getThreadsToWeaken = (security: number) => Math.ceil(security / 0.05);

  static availableRam = (host: string) => ns.getServerMaxRam(host) - ns.getServerUsedRam(host);

  static availableThreads = (props: { scriptRam: number; host: string }) =>
    Math.floor(Server.availableRam(props.host) / props.scriptRam);
}
