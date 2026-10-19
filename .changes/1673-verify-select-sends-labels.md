### Fixed

- **`@reticlehq/server` — `reticle verify --select <label>` now passes labels to the daemon correctly.** When a daemon was already running on the port, `--select smoke` was sent to `reticle_verify` under the key `select`, which the `flows` action does not accept. The call was refused with "Unknown parameter select" and no flows ran. The CLI now sends the value under the `labels` key, matching the `flows` action's schema. Closes [#1673](https://github.com/reticlehq/reticle/issues/1673).
