import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import RouteSkeleton from "./components/home/RouteSkeleton.jsx";
import RouteHome from "./pages/RouteHome.jsx";

/* RouteHome (the map) stays in the main bundle since it's the first thing
   almost every visit needs; everything that mounts the GamePage engine
   (lesson/unlock/result/practice) - plus the legacy /classic app, which
   pulls in the same engine a second way - loads as a separate chunk on
   first visit, showing a themed skeleton instead of a blank flash while it
   downloads. Wrapping Routes in AnimatePresence, keyed by location, is what
   actually lets each page's own enter/exit motion play on navigation -
   without it React Router unmounts the old page instantly, before its exit
   animation ever gets a chance to run. */
const App = lazy(() => import("./App.jsx"));
const ChapterPath = lazy(() => import("./pages/ChapterPath.jsx"));
const RouteLesson = lazy(() => import("./pages/RouteLesson.jsx"));
const RouteUnlock = lazy(() => import("./pages/RouteUnlock.jsx"));
const RouteResult = lazy(() => import("./pages/RouteResult.jsx"));
const RoutePractice = lazy(() => import("./pages/RoutePractice.jsx"));
const RouteProfile = lazy(() => import("./pages/RouteProfile.jsx"));

export default function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<RouteSkeleton />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RouteHome />} />
          <Route path="/classic" element={<App />} />
          <Route path="/chapter/:chapterId" element={<ChapterPath />} />
          <Route path="/lesson/:lessonId" element={<RouteLesson />} />
          <Route path="/unlock/:lessonId" element={<RouteUnlock />} />
          <Route path="/result/:lessonId" element={<RouteResult />} />
          <Route path="/practice" element={<RoutePractice />} />
          <Route path="/profile" element={<RouteProfile />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
