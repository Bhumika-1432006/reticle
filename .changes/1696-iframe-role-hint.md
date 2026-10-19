### Fixed

- **`@reticlehq/engine` — a role query for an HTML tag name now says why it failed and names the correct role.** Querying `{ role: "iframe" }` (or `"div"`, `"input"`, `"nav"`, `"section"`, and other tag names) returned "no element matched" with no hint, which looks identical to an element that never rendered. The failure message now names the correct ARIA role to use instead. For tags whose role depends on the element (`section`, `a`, `select`, `input`), the message states the condition. Closes [#1696](https://github.com/reticlehq/reticle/issues/1696).
