import { describe, expect, it, vi } from "vitest";

vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: () => null,
}));

const { mergeHomepage, DEFAULT_CONTENT, SECTION_IDS } = await import("./homeSections");

const legacy = { releasesEnabled: false, dreamlessBannerEnabled: true };

describe("mergeHomepage", () => {
  it("renders the shipped page when nothing is stored", () => {
    const page = mergeHomepage(undefined, legacy);
    expect(page.sections.map((s) => s.id)).toEqual([...SECTION_IDS]);
    expect(page.sections.find((s) => s.id === "releases")?.visible).toBe(false);
    expect(page.sections.find((s) => s.id === "dreamless")?.visible).toBe(true);
    expect(page.content).toEqual(DEFAULT_CONTENT);
  });

  it("keeps each section's own alignment unless one is stored", () => {
    const page = mergeHomepage(undefined, legacy);
    expect(page.sections.find((s) => s.id === "products")?.align).toBe("center");
    expect(page.sections.find((s) => s.id === "about")?.align).toBe("left");
    const stored = mergeHomepage({ sections: [{ id: "products", visible: true, align: "left" }] }, legacy);
    expect(stored.sections.find((s) => s.id === "products")?.align).toBe("left");
  });

  it("takes visibility for Releases and Dreamless from the old site settings", () => {
    const page = mergeHomepage(undefined, { releasesEnabled: true, dreamlessBannerEnabled: false });
    expect(page.sections.find((s) => s.id === "releases")?.visible).toBe(true);
    expect(page.sections.find((s) => s.id === "dreamless")?.visible).toBe(false);
  });

  it("keeps stored order and visibility, and slots in sections it doesn't mention", () => {
    const page = mergeHomepage(
      {
        sections: [
          { id: "founder", visible: false },
          { id: "hero", visible: true },
          { id: "about", visible: true },
          { id: "bogus", visible: true },
          { id: "hero", visible: false },
        ],
      },
      legacy,
    );
    const ids = page.sections.map((s) => s.id);
    expect(ids.filter((id) => ["founder", "hero", "about"].includes(id))).toEqual(["founder", "hero", "about"]);
    expect(ids).toHaveLength(SECTION_IDS.length);
    expect(new Set(ids).size).toBe(SECTION_IDS.length);
    // dreamless follows hero, as it does by default
    expect(ids[ids.indexOf("hero") + 1]).toBe("dreamless");
    expect(page.sections.find((s) => s.id === "founder")?.visible).toBe(false);
    expect(page.sections.find((s) => s.id === "hero")?.visible).toBe(true);
  });

  it("merges stored copy over the defaults field by field", () => {
    const page = mergeHomepage({ content: { hero: { badge: "New badge", words: [] } } }, legacy);
    expect(page.content.hero.badge).toBe("New badge");
    expect(page.content.hero.words).toEqual([]);
    expect(page.content.hero.description).toBe(DEFAULT_CONTENT.hero.description);
    expect(page.content.about).toEqual(DEFAULT_CONTENT.about);
  });
});
