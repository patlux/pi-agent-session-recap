import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.PI_TEST_HOST_MODULES || join(root, "node_modules");
const { loadExtensions } = await import(pathToFileURL(join(host,
  "@earendil-works/pi-coding-agent/dist/core/extensions/loader.js")));
const { visibleWidth } = await import(pathToFileURL(join(host,
  "@earendil-works/pi-tui/dist/index.js")));
const theme = { fg: (_color, text) => text, bold: (text) => text };
const noHan = (text) => assert.doesNotMatch(text, /\p{Script=Han}/u);
const userEntry = () => ({
  type: "message", id: "synthetic-user", parentId: null,
  timestamp: new Date().toISOString(),
  message: { role: "user", content: [{ type: "text", text: "Prüfe die synthetische Aufgabe." }], timestamp: Date.now() },
});

async function harness(t, entries = []) {
  const home = await mkdtemp(join(tmpdir(), "pi-recap-localization-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Network forbidden in tests"); });
  const loaded = await loadExtensions([join(root, "index.ts")], home);
  assert.deepEqual(loaded.errors, []);
  assert.equal(loaded.extensions.length, 1);
  const extension = loaded.extensions[0];
  const notifications = [];
  const statuses = [];
  const widgets = [];
  const saved = [];
  loaded.runtime.appendEntry = (customType, data) => saved.push({ customType, data });
  const ctx = {
    hasUI: true, mode: "tui", model: undefined,
    waitForIdle: async () => {},
    sessionManager: {
      getSessionId: () => "synthetic-test",
      getEntries: () => entries,
      buildContextEntries: () => entries,
    },
    modelRegistry: { hasConfiguredAuth: () => false },
    ui: {
      notify: (text, level) => notifications.push({ text, level }),
      setStatus: (_key, text) => statuses.push(text),
      setWidget: (_key, factory) => widgets.push(factory?.({}, theme)),
    },
  };
  async function emit(type, event = {}) {
    for (const handler of extension.handlers.get(type) || []) await handler(event, ctx);
  }
  t.after(() => emit("session_shutdown"));
  await emit("session_start");
  return { ctx, extension, emit, notifications, statuses, widgets, saved };
}

test("German widget replaces the hard-coded Chinese label, including narrow widths", async (t) => {
  const h = await harness(t, [userEntry()]);
  const widget = h.widgets.at(-1);
  assert.match(widget.render(100).join("\n"), /Aufgabe\s+Prüfe die synthetische Aufgabe/);
  for (const width of [1, 8, 12, 30, 100]) {
    for (const line of widget.render(width)) {
      noHan(line);
      assert.ok(visibleWidth(line) <= width, `${visibleWidth(line)} > ${width}`);
    }
  }
});

test("manual and automatic recap cards have German titles", async (t) => {
  const h = await harness(t);
  const render = h.extension.entryRenderers.get("session-recap");
  for (const [trigger, expected] of [["manual", "Ausführlicher Rückblick"], ["auto", "Rückblick nach der Pause"]]) {
    const card = render({ data: { kind: "detailed-recap", trigger, text: "Synthetischer Inhalt", sourceEntryId: "test" } }, { expanded: false }, theme);
    const text = card.render(100).join("\n");
    assert.match(text, new RegExp(expected));
    noHan(text);
  }
  assert.equal(render({ data: { kind: "task-summary", text: "Test" } }, { expanded: false }, theme), undefined);
});

test("command description and empty-session notice are German", async (t) => {
  const h = await harness(t);
  const command = h.extension.commands.get("recap");
  assert.equal(command.description, "Ausführlichen Rückblick für die aktuelle Sitzung erstellen");
  await command.handler("", h.ctx);
  assert.deepEqual(h.notifications, [{ text: "Noch keine Aufgabe für einen Rückblick vorhanden", level: "info" }]);
});

test("missing model authentication is explained in German without a request", async (t) => {
  const h = await harness(t, [userEntry()]);
  await h.extension.commands.get("recap").handler("", h.ctx);
  assert.deepEqual(h.notifications, [{ text: "Für das aktuelle Modell fehlt die Anmeldung; kein Rückblick möglich", level: "warning" }]);
});

test("progress, empty responses and provider errors use German UI", async (t) => {
  const h = await harness(t, [userEntry()]);
  h.ctx.model = { id: "synthetic-model", provider: "synthetic-provider" };
  h.ctx.modelRegistry.hasConfiguredAuth = () => true;
  h.ctx.modelRegistry.complete = async () => ({ content: [] });
  await h.extension.commands.get("recap").handler("", h.ctx);
  assert.ok(h.statuses.includes("Rückblick wird erstellt …"));
  assert.equal(h.notifications.at(-1).text, "Rückblick konnte nicht erstellt werden: Das Modell hat keinen Text zurückgegeben");
  h.ctx.modelRegistry.complete = async () => { throw new Error("synthetic provider failure"); };
  await h.extension.commands.get("recap").handler("", h.ctx);
  assert.equal(h.notifications.at(-1).text, "Rückblick konnte nicht erstellt werden: synthetic provider failure");
  assert.equal(h.statuses.at(-1), undefined);
});

test("task progress is German and generated text still follows the user language", async (t) => {
  const h = await harness(t);
  h.ctx.model = { id: "synthetic-model", provider: "synthetic-provider" };
  h.ctx.modelRegistry.hasConfiguredAuth = () => true;
  let finish;
  h.ctx.modelRegistry.complete = async (model, context) => {
    assert.equal(model, h.ctx.model);
    assert.match(context.systemPrompt, /same language as the user's request/);
    return new Promise((resolve) => { finish = resolve; });
  };
  await h.emit("input", { text: "Check the synthetic task", source: "interactive" });
  assert.match(h.widgets.at(-1).render(100).join("\n"), /Zusammenfassung wird erstellt …/);
  finish({ content: [{ type: "text", text: "Check the synthetic task" }] });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.saved.at(-1).data.text, "Check the synthetic task");
  noHan(h.widgets.at(-1).render(100).join("\n"));
});

test("the extension contains no remaining hard-coded Chinese UI strings", async () => {
  noHan(await readFile(join(root, "index.ts"), "utf8"));
});
