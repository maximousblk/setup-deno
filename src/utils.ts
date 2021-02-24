import fetch from 'node-fetch';
import { debug, error } from '@actions/core';
import { platform } from 'os';
import { compare, clean, valid, satisfies } from 'semver';

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
  const versions = await fetch('https://github.com/denoland/deno_website2/raw/main/versions.json').then((res) =>
    res.json()
  );
  return versions.cli.sort(compare).reverse();
}

export async function getDownloadLink(os: Platform, version?: string): Promise<string> {
  debug(`os: ${os}`);
  debug(`input version: ${version}`);

  version = await clearVersion(version ?? '');
  debug(`parsed version: ${version}`);

  const zip: string = denoZipName[os];
  debug(`zip: ${zip}`);

  let dl: string;
  if (version == 'canary') {
    const commit = await fetch('https://dl.deno.land/canary-latest.txt').then((res) => res.text());
    dl = `https://dl.deno.land/canary/${commit.replace('\n', '')}/${zip}`;
  } else if (version == 'latest') {
    dl = `https://github.com/denoland/deno/releases/latest/download/${zip}`;
  } else if (version) {
    dl = `https://github.com/denoland/deno/releases/download/v${version}/${zip}`;
  } else {
    dl = `https://github.com/denoland/deno/releases/latest/download/${zip}`;
  }
  debug(`download: ${dl}`);

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
    error(err);
    throw new Error(err);
  }
}

export async function clearVersion(version: string): Promise<string> {
  if (version === 'canary') return version;

  const denoVersions = await getDenoVersions();

  if (version === 'latest') return denoVersions[0];

  const c = clean(version) || '';
  if (valid(c)) {
    version = c;
  } else {
    // query deno tags for a matching version
    version = await queryLatestMatch(version);

    if (!version) {
      const err = `Unable to find Deno version '${version}'`;
      error(err);
      throw new Error(err);
    }
  }

  return version;
}

async function queryLatestMatch(version: string): Promise<string> {
  if (version === 'canary') return version;

  const denoVersions = await getDenoVersions();

  if (version === 'latest') return denoVersions[0];

  debug(`found ${denoVersions.length} Deno versions`);

  for (let i = 0; i < denoVersions.length; ++i) {
    if (satisfies(denoVersions[i], version)) {
      version = denoVersions[i];
      break;
    }
  }

  if (version) {
    debug(`matched: ${version}`);
  } else {
    debug(`'${version}' did not match any version`);
  }

  return version;
}
