import fetch from 'node-fetch';
import * as actions from '@actions/core';
import * as os from 'os';
import * as semver from 'semver';

type Platform = 'ubuntu' | 'macos' | 'windows' | 'darwin' | 'linux' | 'win32';

export const denoZipName = {
  ubuntu: 'deno-x86_64-unknown-linux-gnu.zip',
  linux: 'deno-x86_64-unknown-linux-gnu.zip',
  macos: 'deno-x86_64-apple-darwin.zip',
  darwin: 'deno-x86_64-apple-darwin.zip',
  windows: 'deno-x86_64-pc-windows-msvc.zip',
  win32: 'deno-x86_64-pc-windows-msvc.zip',
};

export async function getDenoVersions(): Promise<string[]> {
  const versions = await fetch('https://github.com/denoland/deno_website2/raw/main/versions.json')
    .then((res) => res.json())
    .catch(() => {
      const err = 'Unable to fetch Deno versions';
      actions.error(err);
      throw new Error(err);
    });

  return versions.cli.sort(semver.compare).reverse();
}

export async function getLatestCanary() {
  return await fetch('https://dl.deno.land/canary-latest.txt')
    .then((res) => res.text())
    .then((text) => text.replace('\n', ''));
}

export async function getLatestRelease() {
  return await fetch('https://dl.deno.land/release-latest.txt')
    .then((res) => res.text())
    .then((text) => text.replace('\n', ''));
}

export async function getDownloadLink(os: Platform, version?: string): Promise<string> {
  actions.debug(`[UTILS] os: ${os}`);
  actions.debug(`[UTILS] input version: ${version}`);

  const cleanedVersion = await clearVersion(version ?? '');
  actions.debug(`[UTILS] parsed version: ${cleanedVersion}`);

  const zip: string = denoZipName[os];
  actions.debug(`[UTILS] zip: ${zip}`);

  let dl: string;
  if (version == 'canary') {
    dl = `https://dl.deno.land/canary/${cleanedVersion}/${zip}`;
  } else if (version == 'latest') {
    dl = `https://dl.deno.land/release/${cleanedVersion}/${zip}`;
  } else if (version) {
    dl = `https://github.com/denoland/deno/releases/download/v${cleanedVersion}/${zip}`;
  } else {
    dl = `https://github.com/denoland/deno/releases/latest/download/${zip}`;
  }
  actions.debug(`[UTILS] download: ${dl}`);

  return dl;
}

export function getPlatform(): Platform {
  const ptfm = os.platform();

  if (ptfm == 'darwin') {
    return 'macos';
  } else if (ptfm == 'linux') {
    return 'ubuntu';
  } else if (ptfm == 'win32') {
    return 'windows';
  } else {
    const err = `Unexpected OS ${ptfm}`;
    actions.error(err);
    throw new Error(err);
  }
}

export async function clearVersion(version: string): Promise<string> {
  if (version === 'canary') return await getLatestCanary();

  if (version === 'latest') return await getLatestRelease();

  const c = semver.clean(version) || '';
  if (semver.valid(c)) {
    version = c;
  } else {
    // query deno tags for a matching version
    version = await queryLatestMatch(version).then((tag) => semver.clean(tag) || '');

    if (!version) {
      const err = `Unable to find Deno version '${version}'`;
      actions.error(err);
      throw new Error(err);
    }
  }

  return version;
}

async function queryLatestMatch(version: string): Promise<string> {
  if (version === 'canary') return version;

  const denoVersions = await getDenoVersions();

  if (version === 'latest') return denoVersions[0];

  actions.debug(`[UTILS] found ${denoVersions.length} Deno versions`);

  for (let i = 0; i < denoVersions.length; ++i) {
    if (semver.satisfies(denoVersions[i], version)) {
      version = denoVersions[i];
      break;
    }
  }

  if (version) {
    actions.debug(`[UTILS] matched: ${version}`);
  } else {
    actions.debug(`[UTILS] '${version}' did not match any version`);
  }

  return version;
}
