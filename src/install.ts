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
  actions.debug(`[INSTALL] home directory: ${homedirectory}`);

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
  actions.debug(`[INSTALL] downloading deno '${version}'`);

  const downloadUrl = await getDownloadLink(getPlatform(), version);
  actions.debug(`[INSTALL] downloading from '${downloadUrl}'`);

  const downloadPath = await tc.downloadTool(downloadUrl);
  actions.debug(`[INSTALL] downloaded to '${downloadPath}'`);

  let extPath = await tc.extractZip(downloadPath);
  actions.debug(`[INSTALL] deno file path '${extPath}'`);

  const clearedVersion = await clearVersion(version);
  const toolPath = await tc.cacheDir(extPath, 'deno', clearedVersion);
  actions.debug(`[INSTALL] deno cache path '${toolPath}'`);

  return toolPath;
}

export async function install(version: string): Promise<void> {
  actions.debug(`[INSTALL] input deno version: '${version}'`);
  const clearedVersion = await clearVersion(version);
  actions.debug(`[INSTALL] resolved deno version: '${clearedVersion}'`);
  actions.setOutput('version', clearedVersion);

  let toolPath = tc.find('deno', clearedVersion);

  if (toolPath) {
    actions.debug(`[INSTALL] '${version}' found in cache @ ${toolPath}`);
  } else {
    // If not found in cache, download
    actions.debug(`[INSTALL] '${version}' not found in cache. downloading...`);
    toolPath = await downloadDeno(version);
  }

  actions.setOutput('deno_path', toolPath + '/deno');

  // prepend the tools path. instructs the agent to prepend for future tasks
  actions.addPath(toolPath);

  // set `deno install` root
  actions.addPath(process.env.DENO_INSTALL_ROOT || path.join(homedirectory, '.deno', 'bin'));
}

export default install;
