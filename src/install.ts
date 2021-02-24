import * as path from 'path';
import * as os from 'os';
import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import { clearVersion, getDownloadLink, getPlatform } from './utils';

let tempDirectory: string = process.env['RUNNER_TEMP'] || '';
let cacheRoot: string = process.env['RUNNER_TOOL_CACHE'] || '';
// If directories not found, place them in common temp locations
if (!tempDirectory || !cacheRoot) {
  const homedir = os.homedir();
  core.debug(`home directory: ${homedir}`);

  if (!tempDirectory) {
    tempDirectory = path.join(homedir, 'actions', 'temp');
  }
  if (!cacheRoot) {
    cacheRoot = path.join(homedir, 'actions', 'cache');
  }
  process.env['RUNNER_TEMP'] = tempDirectory;
  process.env['RUNNER_TOOL_CACHE'] = cacheRoot;
}

export async function downloadDeno(version: string): Promise<string> {
  core.debug(`downloading deno '${version}'`);

  version = await clearVersion(version);
  core.debug(`resolved Deno '${version}'`);

  const downloadUrl = await getDownloadLink(getPlatform(), version);
  core.debug(`downloading from '${downloadUrl}'`);

  const downloadPath = await tc.downloadTool(downloadUrl);
  core.debug(`downloading to '${downloadPath}'`);

  let extPath = await tc.extractZip(downloadPath);
  core.debug(`deno file path '${extPath}'`);

  const toolPath = await tc.cacheDir(extPath, 'deno', version);

  return toolPath;
}

export async function install(version: string): Promise<void> {
  let toolPath = tc.find('deno', version);

  if (toolPath) {
    core.debug(`Found in cache @ ${toolPath}`);
  } else {
    // If not found in cache, download
    core.debug(`Deno '${version}' not found in cache. downloading...`);
    toolPath = await downloadDeno(version);
  }

  // prepend the tools path. instructs the agent to prepend for future tasks
  core.addPath(toolPath);
  // set `deno install` root
  core.addPath(process.env.DENO_INSTALL_ROOT || path.join(os.homedir(), '.deno', 'bin'));
}

export default install;
