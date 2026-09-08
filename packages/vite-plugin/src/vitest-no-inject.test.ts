/**
 * The HUD must not be injected into a Vitest browser-mode test iframe.
 *
 * Vitest browser mode renders each component test into its own iframe served by the SAME Vite dev
 * server, so `transformIndexHtml` injects into every one of them. The HUD lands in the test document
 * where it has no purpose, sits in the hit-test path, and intercepts pointer events — so a user adds
 * Reticle and their unrelated component tests start timing out on clicks.
 *
 * Reticle breaking the test suite it is sitting inside is the worst possible first impression, and
 * it is not even a trade: there is nothing for Reticle to observe in a component-test iframe.
 *
 * `VITEST` is the signal, and it is exact rather than a guess. Vitest sets it in the process that
 * instantiates the plugin, and only while Vitest is running. The obvious alternative — a `test` key
 * in the Vite config — is WRONG: it says the project HAS Vitest configured, which is true of most
 * projects, and would disable Reticle in the dev server too.
 */

import { describe, expect, it } from 'vitest';
import { reticle } from './index.js';

const tagsWith = (env: NodeJS.ProcessEnv): unknown[] => {
  const previous = process.env['VITEST'];
  // The plugin reads the ambient env, so the test has to set it. Restored in `finally` so a throw
  // cannot leak `VITEST` into the rest of this file's run — which is itself under Vitest.
  try {
    if (env['VITEST'] === undefined) delete process.env['VITEST'];
    else process.env['VITEST'] = env['VITEST'];
    return reticle().transformIndexHtml('<html></html>');
  } finally {
    if (previous === undefined) delete process.env['VITEST'];
    else process.env['VITEST'] = previous;
  }
};

describe('the plugin stays out of a Vitest run', () => {
  it('injects nothing while Vitest is running', () => {
    expect(tagsWith({ VITEST: 'true' })).toEqual([]);
  });

  it('still injects in an ordinary dev server', () => {
    const tags = tagsWith({});
    expect(tags.length, 'the normal path must be untouched').toBeGreaterThan(0);
  });

  it('honours an explicit inject: true even under Vitest', () => {
    // The check is a default chosen on the user's behalf. Somebody who wrote the option down means
    // it — and this is also what lets this package's own suite exercise the injection path.
    const previous = process.env['VITEST'];
    try {
      process.env['VITEST'] = 'true';
      expect(reticle({ inject: true }).transformIndexHtml('<html></html>').length).toBeGreaterThan(
        0,
      );
    } finally {
      if (previous === undefined) delete process.env['VITEST'];
      else process.env['VITEST'] = previous;
    }
  });
});
