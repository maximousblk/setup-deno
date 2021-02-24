import * as core from '@actions/core';
import install from './install';

async function main() {
  try {
    let version = core.getInput('version');
    if (version) {
      install(version);
    } else {
      const err = 'No version specified.';
      core.error(err);
      // throw new Error(err);
    }
  } catch (e) {
    const err = e as Error;
    core.setFailed(err.message);
  }
}

main();
