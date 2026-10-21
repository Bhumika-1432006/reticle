/**
 * `reticle serve --http --http-port <bridge port>` must refuse before listening,
 * not fail with a raw EADDRINUSE after the bind (#1786).
 *
 * The verify: reverting the port-conflict guard in cli-parse.ts makes the test
 * that checks the error message fail (the result becomes `{ kind: 'ok', ... }`).
 */
import { describe, expect, it } from 'vitest';
import { parseCliArgs } from './cli-parse.js';

const DEFAULT_PORT = 4400;

describe('serve --http with --http-port equal to the bridge port', () => {
  it('returns an error before listening', () => {
    const result = parseCliArgs(
      ['serve', '--http', `--http-port`, String(DEFAULT_PORT)],
      DEFAULT_PORT,
      true,
    );
    expect(result.kind).toBe('error');
  });

  it('names both ports in the error message', () => {
    const result = parseCliArgs(
      ['serve', '--http', `--http-port`, String(DEFAULT_PORT)],
      DEFAULT_PORT,
      true,
    );
    if (result.kind !== 'error') throw new Error('expected error');
    expect(result.message).toContain(String(DEFAULT_PORT));
    expect(result.message).toContain('bridge port');
    expect(result.message).toContain('--http-port');
  });

  it('does not error when --http-port is a different port', () => {
    const result = parseCliArgs(
      ['serve', '--http', '--http-port', '5500'],
      DEFAULT_PORT,
      true,
    );
    expect(result.kind).toBe('ok');
  });

  it('does not error when --http-port is absent', () => {
    const result = parseCliArgs(['serve', '--http'], DEFAULT_PORT, true);
    expect(result.kind).toBe('ok');
  });
});
