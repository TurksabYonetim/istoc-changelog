import { describe, expect, it } from "vitest";
import {
  applyFilters,
  defaultFilters,
  filtersFromQuery,
  filtersToQuery,
  type FilterState,
} from "./filters";
import type { ChangelogEntry } from "../types/changelog";

const sample: ChangelogEntry[] = [
  {
    source: "frontend",
    sourceLabel: "Müşteri Sitesi",
    version: "v1.1.8",
    date: "2026-05-08",
    environment: "PROD",
    items: [{ id: "a", type: "added", text: "KYB sistemi" }],
  },
  {
    source: "backend",
    sourceLabel: "Backend",
    version: "v1.0.8-beta.1",
    date: "2026-05-11",
    environment: "BETA",
    items: [{ id: "b", type: "fixed", text: "Auth hatası" }],
  },
];

describe("filters", () => {
  it("defaultFilters allows everything", () => {
    expect(applyFilters(sample, defaultFilters())).toHaveLength(2);
  });

  it("filters by source", () => {
    const f: FilterState = { ...defaultFilters(), sources: new Set(["frontend"]) };
    const out = applyFilters(sample, f);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("frontend");
  });

  it("filters by environment", () => {
    const f: FilterState = { ...defaultFilters(), environments: new Set(["PROD"]) };
    expect(applyFilters(sample, f)).toHaveLength(1);
  });

  it("filters by change type — drops entries with no matching items", () => {
    const f: FilterState = { ...defaultFilters(), types: new Set(["added"]) };
    const out = applyFilters(sample, f);
    expect(out).toHaveLength(1);
    expect(out[0].items.every((i) => i.type === "added")).toBe(true);
  });

  it("filters by free text search", () => {
    const f: FilterState = { ...defaultFilters(), query: "KYB" };
    expect(applyFilters(sample, f)).toHaveLength(1);
  });

  it("filters by date range", () => {
    const f: FilterState = {
      ...defaultFilters(),
      dateFrom: "2026-05-09",
      dateTo: "2026-05-12",
    };
    expect(applyFilters(sample, f)).toHaveLength(1);
  });

  it("serializes/deserializes via query string", () => {
    const f: FilterState = {
      sources: new Set(["frontend"]),
      types: new Set(["fixed"]),
      environments: new Set(["BETA", "RC"]),
      authors: new Set(["ahmet", "bora"]),
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      query: "kyb",
    };
    const qs = filtersToQuery(f);
    const back = filtersFromQuery(qs);
    expect(back).toEqual(f);
  });

  it("returns default when query string is empty", () => {
    expect(filtersFromQuery("")).toEqual(defaultFilters());
  });

  it("filters by author handle — drops items missing or attributed to others", () => {
    const entries: ChangelogEntry[] = [
      {
        source: "frontend",
        sourceLabel: "Müşteri Sitesi",
        version: "v1.2.0",
        date: "2026-05-12",
        environment: "BETA",
        items: [
          { id: "1", type: "added", text: "Sepet düzeltmesi (@ahmeetseker)" },
          { id: "2", type: "added", text: "Q&A bottom-sheet (@boraydeger32)" },
          { id: "3", type: "fixed", text: "Anonim girdi" },
          { id: "4", type: "fixed", text: "Bot commit (@TurksabYonetim)" },
        ],
      },
    ];
    const f: FilterState = { ...defaultFilters(), authors: new Set(["ahmet"]) };
    const out = applyFilters(entries, f);
    expect(out).toHaveLength(1);
    expect(out[0].items).toHaveLength(1);
    expect(out[0].items[0].text).toContain("ahmeetseker");
  });

  it("drops entries with zero items by default (no toggle)", () => {
    const entries: ChangelogEntry[] = [
      {
        source: "frontend",
        sourceLabel: "Müşteri Sitesi",
        version: "v1.2.0",
        date: "2026-05-12",
        environment: "BETA",
        items: [],
      },
      ...sample,
    ];
    expect(applyFilters(entries, defaultFilters())).toHaveLength(2);
  });
});
