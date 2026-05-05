const fs = require('fs');
const pkg = require('../package.json');

const dir = `${__dirname}/..`;

// Add `libc` fields only to platforms that have libc(Standard C library).
const triples = [
  {
    name: 'x86_64-apple-darwin',
  },
  {
    name: 'x86_64-unknown-linux-gnu',
    libc: 'glibc',
  },
  {
    name: 'x86_64-pc-windows-msvc',
  },
  {
    name: 'aarch64-pc-windows-msvc'
  },
  {
    name: 'aarch64-apple-darwin',
  },
  {
    name: 'aarch64-unknown-linux-gnu',
    libc: 'glibc',
  },
  {
    name: 'armv7-unknown-linux-gnueabihf',
  },
  {
    name: 'aarch64-unknown-linux-musl',
    libc: 'musl',
  },
  {
    name: 'x86_64-unknown-linux-musl',
    libc: 'musl',
  },
  {
    name: 'x86_64-unknown-freebsd'
  },
  {
    name: 'aarch64-linux-android'
  }
];
const cpuToNodeArch = {
  x86_64: 'x64',
  aarch64: 'arm64',
  i686: 'ia32',
  armv7: 'arm',
};
const sysToNodePlatform = {
  linux: 'linux',
  freebsd: 'freebsd',
  darwin: 'darwin',
  windows: 'win32',
  android: 'android'
};

let optionalDependencies = {};

try {
  fs.mkdirSync(dir + '/npm');
} catch (err) { }

for (let triple of triples) {
  // Add the libc field to package.json to avoid downloading both
  // `gnu` and `musl` packages in Linux.
  const libc = triple.libc;
  let [cpu, , os, abi] = triple.name.split('-');
  cpu = cpuToNodeArch[cpu] || cpu;
  os = sysToNodePlatform[os] || os;

  let t = `${os}-${cpu}`;
  if (abi) {
    t += '-' + abi;
  }

  buildNode(triple.name, cpu, os, libc, t);
}

pkg.optionalDependencies = optionalDependencies;
fs.writeFileSync(`${dir}/package.json`, JSON.stringify(pkg, false, 2) + '\n');

function buildNode(triple, cpu, os, libc, t) {
  let name = `lightningcss.${t}.node`;

  let pkg2 = { ...pkg };
  // Each platform package is published as @fellowapp/lightningcss-<platform>.
  pkg2.name = '@fellowapp/lightningcss-' + t;
  pkg2.os = [os];
  pkg2.cpu = [cpu];
  if (libc) {
    pkg2.libc = [libc];
  }
  pkg2.main = name;
  pkg2.files = [name];
  delete pkg2.exports;
  delete pkg2.napi;
  delete pkg2.devDependencies;
  delete pkg2.dependencies;
  delete pkg2.optionalDependencies;
  delete pkg2.targets;
  delete pkg2.scripts;
  delete pkg2.types;

  optionalDependencies[pkg2.name] = pkg.version;

  try {
    fs.mkdirSync(dir + '/npm/node-' + t);
  } catch (err) { }
  fs.writeFileSync(`${dir}/npm/node-${t}/package.json`, JSON.stringify(pkg2, false, 2) + '\n');
  fs.copyFileSync(`${dir}/artifacts/bindings-${triple}/${name}`, `${dir}/npm/node-${t}/${name}`);
  fs.writeFileSync(`${dir}/npm/node-${t}/README.md`, `This is the ${triple} build of @fellowapp/lightningcss. See https://github.com/fellowapp/lightningcss for details.`);
  fs.copyFileSync(`${dir}/LICENSE`, `${dir}/npm/node-${t}/LICENSE`);
}

