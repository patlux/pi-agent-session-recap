# pi-agent-session-recap

Keep a Pi coding-agent window understandable during long-running work. The extension shows a compact live task summary and can generate a detailed recap after an idle period.

## Install

```bash
pi install npm:pi-agent-session-recap
```

## Usage

- A short task summary is refreshed from top-level user input.
- `/recap` generates a detailed recap of the current session.
- An automatic detailed recap is scheduled after 30 idle minutes.
- Set `PI_RECAP_IDLE_MINUTES` to change the idle delay.

Summary generation uses the model currently selected in Pi and stores recap data in the session transcript.

## License

MIT
