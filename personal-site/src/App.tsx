import { useEffect } from "react";
import Hero from "./components/Hero";
import Pillars from "./components/Pillars";
import Timeline from "./components/Timeline";
import Games from "./components/Games";
import Chat from "./components/Chat";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingChat from "./components/FloatingChat";
import { outboundSlug, track, trackSections } from "./lib/track";

export default function App() {
  useEffect(() => {
    track("page");
    const stopSections = trackSections(["pillars", "timeline", "games", "chat", "contact"]);
    // Clicks on links that leave the site (LinkedIn, GitHub, Foundation…).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !/^https?:$/.test(a.protocol) || a.host === window.location.host) return;
      const slug = outboundSlug(a.href, a.dataset.track);
      if (slug) track("outbound", slug);
    };
    document.addEventListener("click", onClick);
    return () => {
      stopSections();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Hero />
      <Pillars />
      <Timeline />
      <Games />
      <Chat />
      <Contact />
      <Footer />
      <FloatingChat />
    </div>
  );
}
