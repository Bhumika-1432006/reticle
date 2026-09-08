/**
 * `@reticlehq/browser` ships straight `tsc` output with no bundler downlevel step, so this
 * package's own `target` IS what a consuming app's bundler receives. `react-scripts` 4 / webpack 4
 * excludes `node_modules` from Babel, so any ES2020+ syntax this package emits (optional chaining,
 * nullish coalescing, nullish-coalescing assignment) fails to PARSE before a dev session can ever
 * connect — with no diagnostic (#680).
 *
 * Compiles a snippet using each operator through this package's real tsconfig (read once, not
 * duplicated here) so a future bump of `target` back up is caught by this test rather than by a
 * user's silent build failure.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// vitest runs with cwd at this package's root (`packages/browser`), same as every other test file
// here that reads a fixture off disk — no import.meta.url needed.
const basePath = process.cwd();
const tsconfigPath = join(basePath, 'tsconfig.json');

function compilerOptions(): ts.CompilerOptions {
  const configFile = ts.readConfigFile(tsconfigPath, (path) => readFileSync(path, 'utf8'));
  if (configFile.error !== undefined) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  }
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, dirname(tsconfigPath));
  return parsed.options;
}

describe('packages/browser build target (#680)', () => {
  it('downlevels optional chaining, nullish coalescing, and nullish-coalescing assignment', () => {
    const source = [
      'export function readIt(a: { b?: { c: number } } | undefined, store: Record<string, number>): number {',
      '  const viaOptionalChain = a?.b?.c;',
      '  const viaNullishCoalescing = viaOptionalChain ?? 0;',
      '  store.count ??= 0;',
      '  return viaNullishCoalescing + store.count;',
      '}',
    ].join('\n');

    const output = ts.transpileModule(source, { compilerOptions: compilerOptions() }).outputText;

    // A syntax check, not a substring-of-comment check: webpack 4's parser (acorn) fails on these
    // tokens appearing anywhere in the emitted source, regardless of context.
    expect(output).not.toContain('?.');
    expect(output).not.toContain('??=');
    expect(output).not.toMatch(/[^?]\?\?[^=]/); // bare `??`, excluding the `??=` case already checked
  });
});
