# pi-agent-session-recap — German UI fork

A standalone fork of `pi-agent-session-recap@0.1.0` with German interface text.
See [UPSTREAM.md](UPSTREAM.md) for the source and verified npm integrity.

The extension displays the current task above Pi's editor and creates detailed
session recaps. Summaries retain the conversation's language. Only the fixed
interface labels are German.

## Install

```sh
pi install git:github.com/patlux/pi-agent-session-recap
```

For reproducible installations, append `@<commit-sha>` to the source. Replace
the upstream package declaration rather than loading both extensions: both
register `/recap` and use the same session-entry format.

## Use

- The **Aufgabe** widget refreshes after top-level user input.
- `/recap` creates an **Ausführlicher Rückblick**.
- **Ctrl+O** expands or collapses the recap with Pi's transcript details.
- After 30 idle minutes, the extension creates a **Rückblick nach der Pause**.
- `PI_RECAP_IDLE_MINUTES` overrides the idle delay.

The extension uses the session's selected model and authentication. It has no
separate provider selection. Recap requests incur normal model usage and can
include conversation text and tool-result text. Recaps are stored as custom
entries in the session.

## Limits

The upstream recap input is limited to the last 80,000 serialized characters.
Older test results or decisions can be missing. A recap is a navigation aid,
not proof that tests passed or that the repository still has the reported state.
This fork does not change that behavior.

## Development

Requires Node.js 22.19 or newer. Verification targets Pi 1.3.0.

```sh
npm ci --ignore-scripts
npm run verify
```

Tests load the real extension through Pi's loader, render its widget and recap
cards, and check command, progress and error messages. All conversation fixtures
are synthetic. Network requests are forbidden in the tests.

To test against another installed Pi runtime, set `PI_TEST_HOST_MODULES` to its
absolute `node_modules` directory before running `npm test`.

The package is installed from Git. npm publication is intentionally disabled.

## License

MIT. The upstream copyright and license are retained unchanged.
