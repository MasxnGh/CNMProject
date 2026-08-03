import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoadingLantern from "./components/ui/LoadingLantern.jsx";
import StartScreen from "./pages/StartScreen.jsx";
import ChapterSelect from "./pages/ChapterSelect.jsx";
import ChapterPath from "./pages/ChapterPath.jsx";
import Result from "./pages/Result.jsx";
import Profile from "./pages/Profile.jsx";

// The exercise-playing pages pull in every question-type component,
// FeedbackBar, ComboBadge, Framer Motion, hanzi-writer, etc. - split that
// weight into its own chunk so picking a chapter never has to download it.
const Lesson = lazy(() => import("./pages/Lesson.jsx"));
const UnlockTest = lazy(() => import("./pages/UnlockTest.jsx"));
const Review = lazy(() => import("./pages/Review.jsx"));
const FreeWrite = lazy(() => import("./pages/FreeWrite.jsx"));
const Styleguide = lazy(() => import("./pages/Styleguide.jsx"));

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<LoadingLantern />}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartScreen />} />
        <Route path="/chapters" element={<ChapterSelect />} />
        <Route path="/chapter/:chapterId" element={<ChapterPath />} />
        <Route path="/lesson/:lessonId" element={<LazyPage Component={Lesson} />} />
        <Route path="/unlock/:lessonId" element={<LazyPage Component={UnlockTest} />} />
        <Route path="/review" element={<LazyPage Component={Review} />} />
        <Route path="/write" element={<LazyPage Component={FreeWrite} />} />
        <Route path="/result/:lessonId" element={<Result />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/styleguide" element={<LazyPage Component={Styleguide} />} />
      </Route>
    </Routes>
  );
}
