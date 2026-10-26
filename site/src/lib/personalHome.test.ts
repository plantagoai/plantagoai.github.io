import { describe, expect, it } from "vitest";
import {
  groupRows,
  mergePersonalHome,
  PERSONAL_DEFAULTS,
  PERSONAL_FIELDS,
  PERSONAL_SECTION_IDS,
  rotationSeconds,
} from "../../../personal-site/src/data/homeContent";

describe("mergePersonalHome", () => {
  it("puts the Dreamless banner on top and hides the older sections by default", () => {
    const home = mergePersonalHome(undefined);
    expect(home.sections[0]).toEqual({ id: "dreamlessBanner", visible: true, sideBySide: false });
    expect(home.sections.find((s) => s.id === "dreamless")?.visible).toBe(false);
    expect(home.sections.find((s) => s.id === "foundationCard")?.visible).toBe(false);
    expect(home.content).toEqual(PERSONAL_DEFAULTS);
  });

  it("keeps stored order and visibility and merges copy field by field", () => {
    const home = mergePersonalHome({
      sections: [
        { id: "timeline", visible: true },
        { id: "hero", visible: false },
      ],
      content: { hero: { eyebrow: "DG" } },
    });
    const ids = home.sections.map((s) => s.id);
    expect(ids).toHaveLength(PERSONAL_SECTION_IDS.length);
    expect(ids.indexOf("timeline")).toBeLessThan(ids.indexOf("hero"));
    expect(home.sections.find((s) => s.id === "hero")?.visible).toBe(false);
    expect(home.content.hero.eyebrow).toBe("DG");
    expect(home.content.hero.titleWords).toEqual(PERSONAL_DEFAULTS.hero.titleWords);
  });

  it("has an Admin form for every section, covering every field", () => {
    for (const id of PERSONAL_SECTION_IDS) {
      const keys = PERSONAL_FIELDS[id].map((f) => f.key).sort();
      expect(keys).toEqual(Object.keys(PERSONAL_DEFAULTS[id]).sort());
    }
  });
});

describe("side by side", () => {
  it("starts the photo next to the hero and keeps a stored choice", () => {
    expect(mergePersonalHome(undefined).sections.find((s) => s.id === "photo")?.sideBySide).toBe(true);
    const stored = mergePersonalHome({ sections: [{ id: "hero", visible: true }, { id: "photo", visible: true, sideBySide: false }] });
    expect(stored.sections.find((s) => s.id === "photo")?.sideBySide).toBe(false);
    // Saved before the option existed: the default applies.
    const old = mergePersonalHome({ sections: [{ id: "hero", visible: true }, { id: "photo", visible: true }] });
    expect(old.sections.find((s) => s.id === "photo")?.sideBySide).toBe(true);
  });

  it("groups up to three sections into a row", () => {
    const e = (id: string, sideBySide = false) => ({ id, sideBySide });
    const rows = groupRows([e("a"), e("b", true), e("c", true), e("d", true), e("e"), e("f", true)]);
    expect(rows.map((r) => r.map((s) => s.id))).toEqual([["a", "b", "c"], ["d"], ["e", "f"]]);
    expect(groupRows([e("a", true)]).map((r) => r.length)).toEqual([1]);
  });
});

describe("What I'm building", () => {
  it("shows plantagoai.com products, 7 seconds each, unless saved otherwise", () => {
    const home = mergePersonalHome({ content: { pillars: { titleLead: "Saved title" } } });
    expect(home.content.pillars.source).toBe("products");
    expect(rotationSeconds(home.content.pillars.rotateSeconds)).toBe(7);
    expect(mergePersonalHome({ content: { pillars: { source: "cards" } } }).content.pillars.source).toBe("cards");
  });

  it("splits the Three pillars heading into its own section, right above the products", () => {
    const ids = (h: ReturnType<typeof mergePersonalHome>) => h.sections.map((s) => s.id);
    const fresh = ids(mergePersonalHome(undefined));
    expect(fresh.indexOf("pillarsHeading")).toBe(fresh.indexOf("pillars") - 1);
    // Saved before the split, with the products moved up: the heading follows them.
    const moved = ids(
      mergePersonalHome({
        sections: [
          { id: "pillars", visible: true },
          { id: "hero", visible: true },
          { id: "dreamless", visible: false },
        ],
      }),
    );
    expect(moved.indexOf("pillarsHeading")).toBe(moved.indexOf("pillars") - 1);
  });

  it("keeps a heading edited before the split", () => {
    const home = mergePersonalHome({ content: { pillars: { eyebrow: "Now building", source: "cards" } } });
    expect(home.content.pillarsHeading.eyebrow).toBe("Now building");
    expect(home.content.pillarsHeading.titleLead).toBe(PERSONAL_DEFAULTS.pillarsHeading.titleLead);
    expect(home.content.pillars.source).toBe("cards");
    const saved = mergePersonalHome({
      content: { pillars: { eyebrow: "Old" }, pillarsHeading: { eyebrow: "New" } },
    });
    expect(saved.content.pillarsHeading.eyebrow).toBe("New");
  });

  it("reads the seconds field leniently", () => {
    expect(rotationSeconds("10")).toBe(10);
    expect(rotationSeconds("")).toBe(7);
    expect(rotationSeconds("abc")).toBe(7);
    expect(rotationSeconds("1")).toBe(7);
    expect(rotationSeconds("9999")).toBe(120);
  });
});
