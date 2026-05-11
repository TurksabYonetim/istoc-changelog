import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseChangelog } from "./parser";

const fixturesDir = join(__dirname, "__fixtures__");

describe("parseChangelog", () => {
  it("parses frontend sample with 3 versions", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const { entries, errors } = parseChangelog(md, "frontend");

    expect(errors).toEqual([]);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      source: "frontend",
      sourceLabel: "Müşteri Sitesi",
      version: "v1.1.8-beta.1",
      date: "2026-05-11",
      environment: "BETA",
    });
    expect(entries[0].items).toHaveLength(2);
    expect(entries[0].items[0]).toMatchObject({
      type: "added",
      text: "Header duyuru bandı eklendi.",
    });
  });

  it("maps Turkish section names to ChangeType", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const { entries } = parseChangelog(md, "frontend");
    const prodEntry = entries.find((e) => e.version === "v1.1.8");
    expect(prodEntry).toBeDefined();
    const types = prodEntry!.items.map((i) => i.type);
    expect(types).toContain("added");
    expect(types).toContain("fixed");
    expect(types).toContain("changed");
  });

  it("skips empty sections without error", () => {
    const md = readFileSync(join(fixturesDir, "sample-edge.md"), "utf-8");
    const { entries, errors } = parseChangelog(md, "backend");
    const empty = entries.find((e) => e.version === "v0.1.0");
    expect(empty).toBeDefined();
    expect(empty!.items).toHaveLength(0);
    expect(errors).toEqual([]);
  });

  it("ignores unknown section headings", () => {
    const md = readFileSync(join(fixturesDir, "sample-edge.md"), "utf-8");
    const { entries } = parseChangelog(md, "backend");
    const beta = entries.find((e) => e.version === "v0.0.9");
    expect(beta!.items).toHaveLength(1);
    expect(beta!.items[0].type).toBe("fixed");
  });

  it("generates stable item ids", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const a = parseChangelog(md, "frontend");
    const b = parseChangelog(md, "frontend");
    expect(a.entries[0].items[0].id).toBe(b.entries[0].items[0].id);
  });

  it("sorts entries by date descending", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const { entries } = parseChangelog(md, "frontend");
    const dates = entries.map((e) => e.date);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });
});
