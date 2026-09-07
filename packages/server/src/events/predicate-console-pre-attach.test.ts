/**
 * `console absent` must not claim a clean read over time it was not watching.
 *
 * The most-advertised assertion we have, returning a confident pass on pages visibly full of
 * errors. The console channel does not exist until the SDK patches `console`, and the documented
 * Next.js install connects through a dynamic import inside a `useEffect` — so a `console.error`
 * fired during FIRST RENDER is never captured. Not evicted: permanently invisible. A reporter
 * proved it with a control (add `console.error`, confirm the route rendered, hard reload,
 * `reticle_console` returns `logs: []`), and the same error fired from a click seconds later IS
 * captured.
 *
 * The grade is deliberately NOT downgraded, on the same argument `PRE_ATTACH_CAVEAT` records for
 * `net`: a clean console IS the finding this oracle exists to make, and turning every startup
 * window into `unknown` would retire the check rather than fix it. What changes is what the pass
 * CLAIMS — it stops reading as proof the page logged nothing, and names the window it could not see.
 *
 * A window an action opened carries `since > 0` and is untouched, because the SDK was already
 * attached when the action ran.
 */

import { describe, expect, it } from 'vitest';
import { EventType } from '@reticlehq/core';
import type { ReticleEvent } from '@reticlehq/core';
import { evalConsole } from './predicate-eval.js';

const ev = (type: EventType, message: string, t: number): ReticleEvent =>
  ({ type, t, data: { message } }) as unknown as ReticleEvent;

describe('a console absence over the startup window says what it could not see', () => {
  it('caveats a pass whose window starts at attach', () => {
    const result = evalConsole([], { kind: 'console', level: 'error', absent: true });
    expect(result.pass, 'a clean console is still the finding').toBe(true);
    // The caveat rides on the result as a FIELD, not only in prose an agent may not read.
    expect(JSON.stringify(result)).toMatch(/attach/i);
  });

  it('leaves a window an action opened alone', () => {
    // `since > 0` means the SDK was already attached when the action ran, so there is no blind
    // stretch to warn about and the pass is unqualified.
    const result = evalConsole([], { kind: 'console', level: 'error', absent: true, since: 120 });
    expect(result.pass).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/before the SDK|before it attached/i);
  });

  it('leaves a pass alone once the channel has demonstrably reported something', () => {
    // Any console entry in the window proves the channel is live for this document. The startup
    // blind spot is about a stretch of time, and an entry at t=5 does not close it — but an entry
    // means the caller is looking at a page that DOES reach us, which is the case the caveat's
    // "nothing came through at all" wording would misdescribe.
    const result = evalConsole([ev(EventType.CONSOLE_WARN, 'hydrating', 5)], {
      kind: 'console',
      level: 'error',
      absent: true,
    });
    expect(result.pass).toBe(true);
  });

  it('does not caveat a FAILING absence — errors that were seen were seen', () => {
    const result = evalConsole([ev(EventType.CONSOLE_ERROR, 'boom', 3)], {
      kind: 'console',
      level: 'error',
      absent: true,
    });
    expect(result.pass).toBe(false);
    expect(result.failureReason).not.toMatch(/before the SDK/i);
  });
});
