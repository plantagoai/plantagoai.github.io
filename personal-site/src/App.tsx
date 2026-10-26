import { Fragment, useEffect } from "react";
import Hero from "./components/Hero";
import DreamlessBanner from "./components/DreamlessBanner";
import FoundationCard from "./components/FoundationCard";
import Dreamless from "./components/Dreamless";
import Pillars from "./components/Pillars";
import Timeline from "./components/Timeline";
import Games from "./components/Games";
import Chat from "./components/Chat";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingChat from "./components/FloatingChat";
import { useHome } from "./lib/home";
import { PERSONAL_ANCHORS, type PersonalSectionId } from "./data/homeContent";
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

  const render = (id: PersonalSectionId) => {
    switch (id) {
      case "dreamlessBanner":
        return <DreamlessBanner content={content.dreamlessBanner} />;
      case "hero":
        return <Hero content={content.hero} first={firstId === "hero"} />;
      case "foundationCard":
        return <FoundationCard content={content.foundationCard} />;
      case "dreamless":
        return <Dreamless content={content.dreamless} />;
      case "pillars":
        return <Pillars content={content.pillars} />;
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
      {!loading && visible.map((s) => <Fragment key={s.id}>{render(s.id)}</Fragment>)}
    </div>
  );
}
