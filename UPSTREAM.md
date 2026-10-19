# Upstream provenance

This standalone fork starts from the published MIT-licensed npm package
`pi-agent-session-recap@0.1.0`. No upstream source repository was declared in
its npm metadata or found in the GitHub search at import time. This is not a
GitHub fork-network relationship.

- Tarball: https://registry.npmjs.org/pi-agent-session-recap/-/pi-agent-session-recap-0.1.0.tgz
- npm integrity: `sha512-awNK+mL/jX928CizsYGZX5EWhpjRVVP8Fx3YrtUy5AUypqEfM9AMX1Jps1tfDNaq4F3OH52K8q3yyjD+0gcujA==`
- Imported: 2026-10-19
- Initial import: `c9dacf9`
- The initial commit preserves all four published files byte-for-byte.
- The original MIT license and copyright notice remain in `LICENSE`.

## Fork changes

Version `0.1.0-patlux.1` replaces hard-coded Chinese interface labels,
progress messages, error messages and the command description with German
text. Model-generated summaries still follow the user's conversation language.

Standalone test and type-check commands replace scripts that referred to the
unpublished parent monorepo. Host-provided Pi modules remain peer dependencies;
Pi 1.3.0 is pinned only for development and verification.

Model selection, prompts, session entry formats, idle timing and the
80,000-character recap context limit are unchanged.
