import { Fragment, useEffect } from "react";
import Hero from "./components/Hero";
import DreamlessBanner from "./components/DreamlessBanner";
import Photo from "./components/Photo";
import Statement from "./components/Statement";
import FoundationCard from "./components/FoundationCard";
import Dreamless from "./components/Dreamless";
import Pillars, { PillarsHeading } from "./components/Pillars";
import Timeline from "./components/Timeline";
import Games from "./components/Games";
import Chat from "./components/Chat";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingChat from "./components/FloatingChat";
import { useHome } from "./lib/home";
import {
  groupRows,
  rowColumns,
  personalDefaultAlign,
  PERSONAL_ANCHORS,
  type PersonalSectionEntry,
  type PersonalSectionId,
} from "./data/homeContent";
import { outboundSlug, track, trackSections } from "./lib/track";

export default function App() {
  // Order, visibility and copy come from plantagoai.com/admin →
  // dagangilat.com Sections (Firestore siteSettings/personalHome).
  const { home, loading } = useHome();
  const { content } = home;
  const visible = home.sections.filter((s) => s.visible);
  const sectionKey = visible.map((s) => s.id).join(",");
  // The first visible section that renders in the page flow (the floating
  // button doesn't), so the hero keeps its tall top padding only when first.
  const firstId = visible.find((s) => s.id !== "floatingChat")?.id;
  // Sections marked "side by side" in Admin share a row with the one above
  // (up to three). The floating button sits outside the page flow.
  const rows = groupRows(visible.filter((s) => s.id !== "floatingChat"));
  const floating = visible.some((s) => s.id === "floatingChat");
  // The "Three pillars" heading joins the products when it sits right above
  // them on rows of their own, so the default page reads as one section.
  const headingRow = rows.findIndex((r) => r.length === 1 && r[0].id === "pillarsHeading");
  const headingJoins =
    headingRow >= 0 && rows[headingRow + 1]?.length === 1 && rows[headingRow + 1][0].id === "pillars";

  useEffect(() => {
    track("page");
    // Clicks on links that leave the site (LinkedIn, GitHub, Foundation…).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !/^https?:$/.test(a.protocol) || a.host === window.location.host) return;
      const slug = outboundSlug(a.href, a.dataset.track);
      if (slug) track("outbound", slug);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Sections reached, once per session each; re-run once the saved layout loads.
  useEffect(() => {
    if (loading) return;
    return trackSections(
      visible.map((s) => PERSONAL_ANCHORS[s.id]).filter((a): a is string => a !== null),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey, loading]);

  // Alignment set in Admin; a section left at its own default keeps its
  // markup untouched.
  const alignOf = (s: PersonalSectionEntry) => (s.align === personalDefaultAlign(s.id) ? undefined : s.align);

  const render = (id: PersonalSectionId, inRow = false) => {
    switch (id) {
      case "dreamlessBanner":
        return <DreamlessBanner content={content.dreamlessBanner} />;
      case "hero":
        return <Hero content={content.hero} first={firstId === "hero"} />;
      case "photo":
        return <Photo content={content.photo} inline={inRow} />;
      case "statement":
        return <Statement content={content.statement} />;
      case "foundationCard":
        return <FoundationCard content={content.foundationCard} />;
      case "dreamless":
        return <Dreamless content={content.dreamless} />;
      case "pillarsHeading":
        return headingJoins ? null : <PillarsHeading content={content.pillarsHeading} />;
      case "pillars":
        return <Pillars content={content.pillars} heading={headingJoins ? content.pillarsHeading : null} />;
      case "timeline":
        return <Timeline content={content.timeline} />;
      case "games":
        return <Games content={content.games} />;
      case "chat":
        return <Chat content={content.chat} />;
      case "contact":
        return <Contact content={content.contact} />;
      case "footer":
        return <Footer content={content.footer} />;
      case "floatingChat":
        return <FloatingChat content={content.floatingChat} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Wait for the saved layout, so a hidden or edited section never
          flashes its default copy first. */}
      {!loading &&
        rows.map((row) =>
          row.length === 1 ? (
            alignOf(row[0]) ? (
              <div key={row[0].id} data-align={alignOf(row[0])}>
                {render(row[0].id)}
              </div>
            ) : (
              <Fragment key={row[0].id}>{render(row[0].id)}</Fragment>
            )
          ) : (
            <div
              key={row.map((s) => s.id).join("+")}
              className="section-row"
              style={{ "--row-cols": rowColumns(row.map((s) => s.id)) } as React.CSSProperties}
            >
              {row.map((s) => (
                <div
                  key={s.id}
                  data-align={alignOf(s)}
                  className={`min-w-0 ${s.id === "photo" ? "self-center" : ""}`}
                >
                  {render(s.id, true)}
                </div>
              ))}
            </div>
          ),
        )}
      {!loading && floating && render("floatingChat")}
    </div>
  );
}
