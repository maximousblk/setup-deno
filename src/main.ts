import * as actions from '@actions/core';
import install from './install';

async function main() {
  try {
    let version = actions.getInput('version');
    if (version) {
      actions.debug(`input deno version: ${version}`);
      install(version);
    } else {
      const err = `No version specified ('${version}')`;
      actions.error(err);
      throw new Error(err);
    }
  } catch (e) {
    const err = e as Error;
    actions.setFailed(err.message);
  }
}

main();
