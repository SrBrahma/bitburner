import { Server } from 'lib/server';
import type { ServersList } from 'lib/types';
import { ns } from 'lib/utils';

export const Servers = {
  servers: [],
  serversButHome: [],
  seed: (serversButHome: ServersList) => {
    const sourceFiles = ns.ls('home', '');

    serversButHome.forEach((host) => {
      const filesToBeRemoved = ns.ls(host, '.js');

      filesToBeRemoved.forEach((fileToBeRemoved) => ns.rm(fileToBeRemoved, host));
      ns.scp(sourceFiles, host);
    });
  },

  getRoots: (servers: ServersList): ServersList => servers.filter((host) => Server.getRoot(host)),

  getAvailableRam: (servers: ServersList) =>
    Servers.getRoots(servers).reduce((ram, host) => ram + ns.getServerMaxRam(host), 0),
  getBestServer: (_: ServersList) => {
    _;

    return 'phantasy';
  },

  getServersRams: (servers: ServersList) =>
    Servers.getRoots(servers)
      .map((host) => ({ host, ram: ns.getServerMaxRam(host) }))
      .sort((a, b) => a.ram - b.ram),

  killAll: (servers: ServersList) => {
    servers.forEach((server) => ns.killall(server));
  },

  getAllServers: () => {
    ns.tprint('AAAA');
    const scan = (host: string, servers: Set<string>) => {
      if (!servers.has(host)) {
        servers.add(host);
        ns.scan(host).forEach((server) => scan(server, servers));
      }

      return servers;
    };

    const servers = [...scan('home', new Set('home')).values()];

    return {
      servers,
      serversButHome: servers.filter((server) => server !== 'home'),
    };
  },
};
