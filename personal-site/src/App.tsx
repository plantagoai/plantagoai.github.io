import { useEffect } from "react";
import Hero from "./components/Hero";
import Pillars from "./components/Pillars";
import Timeline from "./components/Timeline";
import Games from "./components/Games";
import Chat from "./components/Chat";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingChat from "./components/FloatingChat";
import { logGuestVisit } from "./lib/analytics";

export default function App() {
  useEffect(() => {
    void logGuestVisit(window.location.pathname);
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
