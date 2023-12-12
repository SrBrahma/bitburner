const fs = require('node:fs');
const path = require('node:path');
const chokidar = require('chokidar');
const { src, dist } = require('./config');
const {} = require('../../bitburner-filesync/src');

/** Format dist path for printing */
const normalize = (p) => p.replace(/\\/g, '/');

const watchTypeScript = () => {
  chokidar.watch(`${src}/**/*.ts`).on('unlink', async (p) => {
    // called on *.ts file get deleted
    const relative = path.relative(src, p).replace(/\.ts$/, '.js');
    const distFile = path.resolve(dist, relative);

    // if distFile exists, delete it
    if (fs.existsSync(distFile)) {
      await fs.promises.unlink(distFile);
      console.log(`${normalize(relative)} deleted`);
    }
  });
};

const syncTypeScript = () => {
  fs.rmSync(src);

  return watchTypeScript();
};

console.log('Start watching TS files...');
syncTypeScript();
