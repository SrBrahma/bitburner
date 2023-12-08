import { program } from 'scripts/lib/program/program';
import { runSuperSchedule } from 'scripts/lib/schedule';
import { Server } from 'scripts/lib/server';
import { Servers } from 'scripts/lib/servers';
import { getHWGWSteps } from 'scripts/lib/steps';
import { ns, printTable } from 'scripts/lib/utils';

export const { main, path } = program({
  path: 'scripts/all.ts',
  main: async () => {
    const modes = getModes();

    const mode = String(ns.args[0] ?? 'list');
    const fun = modes[mode];

    if (!fun) {
      ns.tprint('ERROR: invalid mode. Available modes are: ', Object.keys(modes));
      ns.exit();
    }

    await fun();
  },
});

const getModes = (): Record<string, () => void | Promise<void>> => {
  const { servers, serversButHome } = Servers.getAllServers();

  return {
    list: () => ns.tprint(`hostnames list (${servers.length}):\n`, servers, '\n'),
    killAll: () => Servers.killAll(serversButHome),
    getRoots: () => void Servers.getRoots(serversButHome),
    availableRam: () => ns.tprint('Total RAM: ', Servers.getAvailableRam(serversButHome)),
    test: () => {
      const servers = Servers.getRoots(serversButHome)
        .filter((s) => ns.getServerMaxMoney(s))
        .filter((s) => ns.hackAnalyzeChance(s))
        .sort((a, b) => ns.hackAnalyzeChance(b) - ns.hackAnalyzeChance(a));

      const res = servers.map((target) => {
        const timeToHack = ns.getHackTime(target) / 1000;
        const din = ns.getServerMaxMoney(target) / ns.getHackTime(target);
        const threadsToWeaken =
          (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / 0.05;

        return [
          target,
          ns.getServerRequiredHackingLevel(target),
          ns.formatPercent(ns.hackAnalyzeChance(target)),
          ns.formatNumber(ns.getServerMaxMoney(target)),
          timeToHack.toFixed(1),
          ns.formatNumber(din),
          ns.formatNumber(ns.getServerMoneyAvailable(target)),
          ns.formatNumber(ns.growthAnalyze(target, 2), 0),
          threadsToWeaken,
        ];
      });

      printTable([
        ['Host', 'Level', 'Chance', 'Max $', 'Time', '$/s', '$', 'Grow * 2', 'T-Weak'],
        ...res,
      ]);
    },
    t: () => {
      const host = Servers.getBestServer(serversButHome);
      const table = [];

      for (let i = 1; i < 25; i++) {
        const percentageToHack = i / 100;

        const moneyToHack = ns.getServerMaxMoney(host) * percentageToHack;

        const threadsToGrow = Math.ceil(ns.growthAnalyze(host, 1 + percentageToHack));
        const threadsToWeakenGrow = Math.ceil((0.004 * threadsToGrow) / 0.05); // Math.ceil(ns.growthAnalyzeSecurity(threadsToGrow, host));
        const threadsToHack = Math.floor(ns.hackAnalyzeThreads(host, moneyToHack));
        const threadsToWeakenHack = Math.ceil((0.002 * threadsToHack) / 0.05); // Math.ceil(ns.hackAnalyzeSecurity(threadsToHack, host));

        const threads = threadsToHack + threadsToGrow + threadsToWeakenGrow + threadsToWeakenHack;

        const moneyPerThread = moneyToHack / threads;

        table.push([
          percentageToHack,
          ns.formatNumber(moneyToHack),
          threads,
          ns.formatNumber(moneyPerThread),
          threadsToHack,
          threadsToGrow,
          threadsToWeakenHack,
          threadsToWeakenGrow,
        ]);
      }

      printTable(table);
    },
    super: async () => {
      ns.tprint('Killing all processes...');
      Servers.killAll(serversButHome);
      Servers.seed(serversButHome);

      ns.tprint('Choosing best server...');
      const target = Servers.getBestServer(serversButHome);

      ns.tprint('Ensuring Security & Grow are on the optimal levels...');
      // const requiredGrow
      await Server.setSecurityToMin({ target });
      // setGrowToMax // TODO
      ns.tprint('Setting up processes...');
      const steps = getHWGWSteps({ target, percentageToHack: 0.1 });

      ns.tprint(
        'Threads ',
        Object.values(steps).reduce((sum, s) => sum + s.threads, 0),
      );
      ns.tprint(
        'Ram ',
        Object.values(steps).reduce((sum, s) => sum + s.ram, 0),
      );
      ns.tprint('Total servers RAM ', Servers.getAvailableRam(serversButHome));
      await runSuperSchedule({ steps, target, serversButHome });

      ns.tprint('Running!');
    },
    upgrade: () => {
      ns.upgradePurchasedServer(String(ns.args[1]), Number(ns.args[2]));
    },
    upgradeAll: () => {
      const servers = ns
        .getPurchasedServers()
        .sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b));

      while (true) {
        for (const host of servers) {
          if (!ns.upgradePurchasedServer(host, ns.getServerMaxRam(host) * 2) && host === servers[0])
            return;
        }
      }
    },
    seed: () => Servers.seed(serversButHome),
  };
};

// const setGrowToMax = async (host: string) => {
//   const deltaGrow = ns.getServerGrowth(host) - ns.getServerMinSecurityLevel(host)
//   ns.run(scripts.weaken.path, {threads: ns.grow(deltaSecurity)})
//   await ns.asleep(ns.getWeakenTime(host) + 1);
// };

export const autocomplete = () => Object.keys(getModes());
