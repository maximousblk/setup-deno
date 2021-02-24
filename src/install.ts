import * as path from 'path';
import * as os from 'os';
import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import { clearVersion, getDownloadLink, getPlatform } from './utils';

// https://github.com/denoland/deno/releases/download/v1.7.5/deno-x86_64-unknown-linux-gnu.zip

let tempDirectory: string = process.env['RUNNER_TEMP'] || '';
let cacheRoot: string = process.env['RUNNER_TOOL_CACHE'] || '';
// If directories not found, place them in common temp locations
if (!tempDirectory || !cacheRoot) {
  let baseLocation: string;
  if (process.platform === 'win32') {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env['USERPROFILE'] || 'C:\\';
  } else {
    if (process.platform === 'darwin') {
      baseLocation = process.env['HOME'] || '/Users';
    } else {
      baseLocation = process.env['HOME'] || '/home';
    }
  }
  if (!tempDirectory) {
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
  }
  if (!cacheRoot) {
    cacheRoot = path.join(baseLocation, 'actions', 'cache');
  }
  process.env['RUNNER_TEMP'] = tempDirectory;
  process.env['RUNNER_TOOL_CACHE'] = cacheRoot;
}

export async function downloadDeno(version: string): Promise<string> {
  core.debug(`downloading Deno '${version}'`);

  version = await clearVersion(version);
  core.debug(`resolved Deno '${version}'`);

  const downloadUrl = await getDownloadLink(getPlatform(), version);
  core.debug(`download Deno from '${downloadUrl}'`);

  const downloadPath = await tc.downloadTool(downloadUrl);
  core.debug(`downloaded Deno to '${downloadPath}'`);

  let extPath = await tc.extractZip(downloadPath);
  core.debug(`deno file path '${extPath}'`);

  const toolPath = await tc.cacheDir(extPath, 'deno', version);

  return toolPath;
}

export default async function (version: string): Promise<void> {
  let toolPath = tc.find('deno', version);

  if (toolPath) {
    core.debug(`Found in cache @ ${toolPath}`);
  } else {
    // If not found in cache, download
    core.debug(`Downloading deno at version ${version}`);
    toolPath = await downloadDeno(version);
  }

  // prepend the tools path. instructs the agent to prepend for future tasks
  core.addPath(toolPath);
  // set `deno install` root
  core.addPath(process.env.DENO_INSTALL_ROOT || path.join(os.homedir(), '.deno', 'bin'));
}
