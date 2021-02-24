import { join } from 'path';
import { homedir } from 'os';
import { downloadTool, extractZip, cacheDir, find } from '@actions/tool-cache';
import { debug, setOutput, addPath } from '@actions/core';
import { clearVersion, getDownloadLink, getPlatform } from './utils';

const homedirectory = homedir();
let tempDirectory: string = process.env['RUNNER_TEMP'] || '';
let cacheRoot: string = process.env['RUNNER_TOOL_CACHE'] || '';
// If directories not found, place them in common temp locations
if (!tempDirectory || !cacheRoot) {
  debug(`home directory: ${homedirectory}`);

  if (!tempDirectory) {
    tempDirectory = join(homedirectory, 'actions', 'temp');
  }
  if (!cacheRoot) {
    cacheRoot = join(homedirectory, 'actions', 'cache');
  }
  process.env['RUNNER_TEMP'] = tempDirectory;
  process.env['RUNNER_TOOL_CACHE'] = cacheRoot;
}

export async function downloadDeno(version: string): Promise<string> {
  debug(`downloading deno '${version}'`);

  const downloadUrl = await getDownloadLink(getPlatform(), version);
  debug(`downloading from '${downloadUrl}'`);

  const downloadPath = await downloadTool(downloadUrl);
  debug(`downloading to '${downloadPath}'`);

  let extPath = await extractZip(downloadPath);
  debug(`deno file path '${extPath}'`);

  const toolPath = await cacheDir(extPath, 'deno', version);

  return toolPath;
}

export async function install(version: string): Promise<void> {
  version = await clearVersion(version);
  debug(`resolved Deno '${version}'`);
  setOutput('version', version);

  let toolPath = find('deno', version);

  if (toolPath) {
    debug(`Found in cache @ ${toolPath}`);
  } else {
    // If not found in cache, download
    debug(`Deno '${version}' not found in cache. downloading...`);
    toolPath = await downloadDeno(version);
  }

  setOutput('deno_path', toolPath + '/deno');

  // prepend the tools path. instructs the agent to prepend for future tasks
  addPath(toolPath);

  // set `deno install` root
  addPath(process.env.DENO_INSTALL_ROOT || join(homedirectory, '.deno', 'bin'));
}

export default install;
