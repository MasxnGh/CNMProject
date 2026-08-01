import "../../styles/route-skeleton.css";

/** Shown while a lazy-loaded route chunk downloads, instead of a blank white flash. */
export default function RouteSkeleton() {
  return (
    <div className="rm-page rm-skeleton" aria-hidden="true">
      <div className="rm-skeleton-bar rm-skeleton-topbar" />
      <div className="rm-skeleton-body">
        <div className="rm-skeleton-bar rm-skeleton-title" />
        <div className="rm-skeleton-bar rm-skeleton-line" />
        <div className="rm-skeleton-grid">
          <div className="rm-skeleton-tile" />
          <div className="rm-skeleton-tile" />
          <div className="rm-skeleton-tile" />
          <div className="rm-skeleton-tile" />
        </div>
      </div>
    </div>
  );
}
