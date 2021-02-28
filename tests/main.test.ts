import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as semver from 'semver';
import * as io from '@actions/io';

import install from '../src/install';
import { getDenoVersions, clearVersion, getLatestRelease, getLatestCanary } from '../src/utils';

const randomStr = Math.random().toString(36).substring(7);
const toolDir = path.join(__dirname, '_temp', 'runner', randomStr, 'tools');
const tempDir = path.join(__dirname, '_temp', 'runner', randomStr, 'temp');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;

const EXTENSION = process.platform == 'win32' ? '.exe' : '';

async function cleanup(): Promise<void> {
  await io.rmRF(path.join(__dirname, '_temp'));
}

describe('install', () => {
  beforeAll(cleanup, 2000);
  afterAll(cleanup, 2000);

  it('version: canary', async () => {
    const version = 'canary';
    const canaryHash = await getLatestCanary();

    await install(version);
    const denoDir = path.join(toolDir, 'deno', canaryHash, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('version: latest', async () => {
    const version = 'latest';
    const latestVersion = await getLatestRelease().then((tag) => clearVersion(tag));

    await install(version);
    const denoDir = path.join(toolDir, 'deno', latestVersion, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('version: 4b56537ea9d5c3e5f60ca817ed00c55dcbb2131c', async () => {
    const version = '4b56537ea9d5c3e5f60ca817ed00c55dcbb2131c';
    const clearedVersion = await clearVersion(version);

    await install(version);
    const denoDir = path.join(toolDir, 'deno', clearedVersion, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('version: 1', async () => {
    const version = '1';
    const clearedVersion = await clearVersion(version);

    await install(version);
    const denoDir = path.join(toolDir, 'deno', clearedVersion, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('version: v1', async () => {
    const version = 'v1';
    const clearedVersion = await clearVersion(version);

    await install(version);
    const denoDir = path.join(toolDir, 'deno', clearedVersion, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('version: 1.7', async () => {
    const version = '1.7';
    const clearedVersion = await clearVersion(version);

    await install(version);
    const denoDir = path.join(toolDir, 'deno', clearedVersion, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('version: v0.38.0', async () => {
    const version = '0.38.0';
    await install(version);
    const denoDir = path.join(toolDir, 'deno', version, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  // // disabled for the time being
  // it('version: <= v0.35.0', async () => {
  //   const version = '0.34.0';
  //   await install(version);
  //   const denoDir = path.join(toolDir, 'deno', version, os.arch());

  //   expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
  //   expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  // }, 100000);

  it('version: v404', async () => {
    let thrown = false;
    try {
      await install('v404');
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('version: validate', async () => {
    const versions = await getDenoVersions();

    // the number of versions is increasing
    expect(versions.length).toBeGreaterThanOrEqual(39);

    for (const v of versions) {
      expect(semver.valid(v)).not.toBeNull();
    }
  });
});

describe('cache', () => {
  beforeAll(cleanup, 2000);
  afterAll(cleanup, 2000);

  it('cache: not cached', async () => {
    const versions = await getDenoVersions();
    const version = await clearVersion(versions[Math.floor(Math.random() * versions.length)]);

    await install(version);
    const denoDir = path.join(toolDir, 'deno', version, os.arch());

    expect(fs.existsSync(`${denoDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(denoDir, `deno${EXTENSION}`))).toBe(true);
  }, 100000);

  it('cache: incomplete', async () => {
    const version = '404.0.0';
    const denoDir: string = path.join(toolDir, 'deno', version, os.arch());
    await io.mkdirP(denoDir);
    let thrown = false;
    try {
      // This will throw if it doesn't find it in the cache (because no such version exists)
      await install(version);
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
    return;
  });

  it('cache: complete', async () => {
    const version = '1.0.0';
    const denoDir = path.join(toolDir, 'deno', version, os.arch());
    await io.mkdirP(denoDir);
    fs.writeFileSync(`${denoDir}.complete`, '');
    // This will throw if it doesn't find it in the cache (because no such version exists)
    await install(version);
    return;
  });

  it('cache: use cache', async () => {
    const version = '1.6.3';
    const deno: string = path.join(toolDir, 'deno', version, os.arch());
    await io.mkdirP(deno);
    fs.writeFileSync(`${deno}.complete`, '');
    // These will throw if it doesn't find it in the cache (because no such version exists)
    await install('v1.6.3');
    await install('1.6.3');
    await install('v1.6.x');
    await install('1.6.x');
    await install('v1.6');
    await install('1.6');
  });
});
