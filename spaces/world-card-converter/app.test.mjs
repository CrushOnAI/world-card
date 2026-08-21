import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./app.js", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { convertLorebook, formatConversionReport, parseJsonWithLocation } = await import(moduleUrl);

{
  const parsed = parseJsonWithLocation('{\n  "entries": []\n}');
  assert.deepEqual(parsed, { entries: [] });
}

{
  assert.throws(
    () => parseJsonWithLocation('{\n  "entries": [}\n}'),
    /Invalid JSON at line 2, column 15/,
  );
}

{
  const converted = convertLorebook(
    {
      entries: [
        {
          comment: "Old Lighthouse",
          content: "The beam reveals hidden markings.",
          key: ["lighthouse", "harbor", "lighthouse"],
          category: "location",
          order: 70,
          probability: 100,
        },
        { comment: "Disabled", content: "Do not export", disable: true },
        { comment: "Empty", content: "" },
        null,
        {
          comment: "Unknown category",
          content: "A custom piece of lore.",
          key: 42,
          category: "custom",
          order: "high",
        },
      ],
    },
    { noteType: "Items", tags: "mystery, mystery, magic" },
  );

  assert.equal(converted.count, 2);
  assert.deepEqual(converted.report.skipped, { disabled: 1, empty: 1, invalid: 1 });
  assert.equal(converted.report.duplicateKeywordsRemoved, 1);
  assert.deepEqual(converted.report.fallbackCategories, { custom: 1 });
  assert.deepEqual(converted.report.unsupportedFields, ["probability"]);
  assert.equal(converted.report.warnings.length, 3);
  assert.deepEqual(converted.result.tags.content_tags, ["mystery", "magic"]);

  const location = converted.result.notes.find(
    (note) => note.note_type === "WORLD_CARD_NOTE_TYPE_LOCATIONS",
  ).items[0];
  assert.deepEqual(location.key_words, ["lighthouse", "harbor"]);
  assert.equal(location.priority_level, 3);

  const fallback = converted.result.notes.find(
    (note) => note.note_type === "WORLD_CARD_NOTE_TYPE_ITEMS",
  ).items[0];
  assert.equal(fallback.trigger_mode, "WORLD_CARD_TRIGGER_MODE_ALWAYS_ON");

  const report = formatConversionReport(converted.report);
  assert.match(report, /Converted: 2/);
  assert.match(report, /Skipped: 3 \(disabled 1, empty 1, invalid 1\)/);
  assert.match(report, /Unsupported source fields: probability/);
  assert.match(report, /custom \(1\)/);
}

{
  assert.throws(
    () => convertLorebook({ entries: [{ content: "", disable: false }] }),
    /No enabled entries with content were found/,
  );
  assert.throws(
    () => convertLorebook([]),
    /JSON root must be an object/,
  );
  assert.throws(
    () => convertLorebook({}),
    /must contain an entries object or array/,
  );
}

console.log("Converter tests passed.");
