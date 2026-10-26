import { describe, expect, it } from "vitest";
import {
  mergePersonalHome,
  PERSONAL_DEFAULTS,
  PERSONAL_FIELDS,
  PERSONAL_SECTION_IDS,
} from "../../../personal-site/src/data/homeContent";

describe("mergePersonalHome", () => {
  it("puts the Dreamless banner on top and hides the older sections by default", () => {
    const home = mergePersonalHome(undefined);
    expect(home.sections[0]).toEqual({ id: "dreamlessBanner", visible: true });
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
