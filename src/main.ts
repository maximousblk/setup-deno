import { getInput, debug, error, setFailed } from '@actions/core';
import install from './install';

async function main() {
  try {
    let version = getInput('version');
    if (version) {
      debug(`input deno version: ${version}`);
      install(version);
    } else {
      const err = 'No version specified.';
      error(err);
      throw new Error(err);
    }
  } catch (e) {
    const err = e as Error;
    setFailed(err.message);
  }
}

main();
