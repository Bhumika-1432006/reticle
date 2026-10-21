### Fixed

- **`@reticlehq/server`: `reticle serve --http --http-port <bridge port>` now refuses at parse time with a clear message instead of failing with a bare `EADDRINUSE` after the bind attempt.** When `--http-port` equals the bridge port, the CLI prints that MCP is already served on that port, that `--http` starts the verify endpoint on a separate port, and that a different port must be chosen with `--http-port`. Closes [#1786](https://github.com/reticlehq/reticle/issues/1786).
