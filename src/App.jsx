import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing.jsx";
import NamePage from "./pages/Name/Name.jsx";
import SetupPage from "./pages/Setup/Setup.jsx";
import PlayPage from "./pages/Play/Play.jsx";
import ModifierPage from "./pages/Modifier/Modifier.jsx";
import ResultPage from "./pages/Result/Result.jsx";
import BoardPage from "./pages/Board/Board.jsx";
import MazePage from "./pages/Maze/Maze.jsx";
import StyleGuide from "./pages/StyleGuide.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/name" element={<NamePage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/modifier" element={<ModifierPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/maze" element={<MazePage />} />
      <Route path="/styleguide" element={<StyleGuide />} />
    </Routes>
  );
}
