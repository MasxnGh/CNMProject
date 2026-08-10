import SkyCanvas from "./SkyCanvas.jsx";
import Nav from "./Nav.jsx";
import Hero from "./Hero.jsx";
import HowToPlay from "./HowToPlay.jsx";
import LevelSection from "./LevelSection.jsx";
import Gallery from "./Gallery.jsx";
import Modes from "./Modes.jsx";
import Systems from "./Systems.jsx";
import FinalCta from "./FinalCta.jsx";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="v-land">
      <SkyCanvas />
      <Nav />
      <Hero />
      <HowToPlay />
      <LevelSection />
      <Gallery />
      <Modes />
      <Systems />
      <FinalCta />
    </div>
  );
}
