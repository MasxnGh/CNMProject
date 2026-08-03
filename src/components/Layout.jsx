import { Outlet, useLocation } from "react-router-dom";
import Sky from "./ui/Sky.jsx";
import Nav from "./ui/Nav.jsx";
import "../styles/layout.css";

export default function Layout() {
  const location = useLocation();

  return (
    <div id="app">
      <Sky />
      <main>
        <div className="screen" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Nav />
    </div>
  );
}
