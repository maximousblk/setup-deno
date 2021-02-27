import * as path from 'path';
import * as os from 'os';
import * as tc from '@actions/tool-cache';
import * as actions from '@actions/core';
import { clearVersion, getDownloadLink, getPlatform } from './utils';

const homedirectory = os.homedir();
let tempDirectory: string = process.env['RUNNER_TEMP'] || '';
let cacheRoot: string = process.env['RUNNER_TOOL_CACHE'] || '';
// If directories not found, place them in common temp locations
if (!tempDirectory || !cacheRoot) {
  actions.debug(`home directory: ${homedirectory}`);

  if (!tempDirectory) {
    tempDirectory = path.join(homedirectory, 'actions', 'temp');
  }
  if (!cacheRoot) {
    cacheRoot = path.join(homedirectory, 'actions', 'cache');
  }
  process.env['RUNNER_TEMP'] = tempDirectory;
  process.env['RUNNER_TOOL_CACHE'] = cacheRoot;
}

export async function downloadDeno(version: string): Promise<string> {
  actions.debug(`downloading deno '${version}'`);

  const downloadUrl = await getDownloadLink(getPlatform(), version);
  actions.debug(`downloading from '${downloadUrl}'`);

  const downloadPath = await tc.downloadTool(downloadUrl);
  actions.debug(`downloading to '${downloadPath}'`);

  let extPath = await tc.extractZip(downloadPath);
  actions.debug(`deno file path '${extPath}'`);

  const toolPath = await tc.cacheDir(extPath, 'deno', version);

  return toolPath;
}

export async function install(version: string): Promise<void> {
  version = await clearVersion(version);
  actions.debug(`resolved Deno '${version}'`);
  actions.setOutput('version', version);

  let toolPath = tc.find('deno', version);

  if (toolPath) {
    actions.debug(`Found in cache @ ${toolPath}`);
  } else {
    // If not found in cache, download
    actions.debug(`Deno '${version}' not found in cache. downloading...`);
    toolPath = await downloadDeno(version);
  }

  actions.setOutput('deno_path', toolPath + '/deno');

  // prepend the tools path. instructs the agent to prepend for future tasks
  actions.addPath(toolPath);

  // set `deno install` root
  actions.addPath(process.env.DENO_INSTALL_ROOT || path.join(homedirectory, '.deno', 'bin'));
}

export default install;
