import fetch from 'node-fetch';
import * as core from '@actions/core';
import { platform } from 'os';
import { Platform } from './types';
import * as semver from 'semver';

export const denoZipName = {
  ubuntu: 'deno-x86_64-unknown-linux-gnu.zip',
  linux: 'deno-x86_64-unknown-linux-gnu.zip',
  macos: 'deno-x86_64-apple-darwin.zip',
  darwin: 'deno-x86_64-apple-darwin.zip',
  windows: 'deno-x86_64-pc-windows-msvc.zip',
  win32: 'deno-x86_64-pc-windows-msvc.zip',
};

export async function getDenoVersions() {
  const versions = await fetch('https://github.com/denoland/deno_website2/raw/main/versions.json').then((res) =>
    res.json()
  );
  return versions.cli;
}

export async function getDownloadLink(os: Platform, version?: string): Promise<string> {
  core.debug(`os: ${os}`);
  core.debug(`input version: ${version}`);

  version = await clearVersion(version ?? '');
  core.debug(`parsed version: ${version}`);

  const zip: string = denoZipName[os];
  core.debug(`zip: ${zip}`);

  let dl: string;
  if (version == 'canary') {
    const commit = await fetch('https://dl.deno.land/canary-latest.txt').then((res) => res.text());
    dl = `https://dl.deno.land/canary/${commit.replace('\n', '')}/${zip}`;
  } else if (version) {
    dl = `https://github.com/denoland/deno/releases/download/v${version}/${zip}`;
  } else {
    dl = `https://github.com/denoland/deno/releases/latest/download/${zip}`;
  }
  core.debug(`download: ${dl}`);

  return dl;
}

export function getPlatform(): Platform {
  const ptfm = platform();

  if (ptfm == 'darwin') {
    return 'macos';
  } else if (ptfm == 'linux') {
    return 'ubuntu';
  } else if (ptfm == 'win32') {
    return 'windows';
  } else {
    const err = `Unexpected OS ${ptfm}`;
    core.error(err);
    throw new Error(err);
  }
}

export async function clearVersion(version: string): Promise<string> {
  if (version === 'canary') return version;

  const c = semver.clean(version) || '';

  if (semver.valid(c)) {
    version = c;
  } else {
    // query deno tags for a matching version
    version = await queryLatestMatch(version);
    if (!version) {
      const err = `Unable to find Deno version '${version}'`;
      core.error(err);
      // throw new Error(err);
    }
  }

  return version;
}

async function queryLatestMatch(version: string): Promise<string> {
  if (version === 'canary') return version;

  const versions: string[] = (await getDenoVersions()).sort(semver.compare);
  core.debug(`found ${versions.length} Deno versions`);

  for (let i = versions.length - 1; i >= 0; --i) {
    if (semver.satisfies(versions[i], version)) {
      version = versions[i];
      break;
    }
  }

  if (version) {
    core.debug(`matched: ${version}`);
  } else {
    core.debug(`'${version}' did not match any version`);
  }

  return version;
}
