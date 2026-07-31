import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Dumbbell, GraduationCap, KeyRound, Lock } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import Stamp from "../Stamp";

const KIND_ICON = { learn: GraduationCap, practice: Dumbbell };

/** Builds an "M x y L x y ..." path through a slice of points, or "" if too short to draw. */
const pathThrough = (points) =>
  points.length < 2 ? "" : points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

function UnitSection({ unit, nodeStatus, onSelectNode, isEligibleLocked, onSelectLockedNode, nodeRefs, laneOffset, onBack }) {
  const reduceMotion = useReducedMotion();
  const routeRef = useRef(null);
  const [path, setPath] = useState({ width: 1, height: 1, solid: "", sketch: "" });
  const nodeEntries = unit.lessons.flatMap((lesson) => lesson.nodeIds.map((nodeId) => ({ nodeId, lesson })));
  const clearedCount = nodeEntries.filter(({ nodeId }) => nodeStatus(nodeId) === "cleared").length;
  // The brush has already inked everything up to and including the current
  // node; anything past that is only sketched in pencil, waiting to unlock.
  const frontier = nodeEntries.reduce(
    (last, { nodeId }, index) => (nodeStatus(nodeId) !== "locked" ? index : last),
    -1,
  );

  useLayoutEffect(() => {
    const route = routeRef.current;
    if (!route) return undefined;

    const measure = () => {
      const bounds = route.getBoundingClientRect();
      const points = nodeEntries
        .map(({ nodeId }) => nodeRefs.current[nodeId])
        .filter(Boolean)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
        });
      const solidPoints = points.slice(0, Math.max(frontier, 0) + 1);
      const sketchPoints = points.slice(Math.max(frontier, 0));
      setPath({
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
        solid: pathThrough(solidPoints),
        sketch: pathThrough(sketchPoints),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(route);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id, frontier]);

  return (
    <section className="rm-unit" aria-label={unit.title}>
      <div className="rm-unit-header">
        {onBack ? (
          <button type="button" className="rm-back-button" onClick={onBack} aria-label="กลับหน้าเลือกบท">
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <strong>{unit.title}</strong>
        <span className="rm-unit-progress">{clearedCount}/{nodeEntries.length}</span>
      </div>
      <div className="rm-route" ref={routeRef}>
        <svg className="rm-route-svg" viewBox={`0 0 ${path.width} ${path.height}`} aria-hidden="true">
          <path className="rm-route-sketch" d={path.sketch} />
          <motion.path
            className="rm-route-ink"
            d={path.solid}
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        {nodeEntries.map(({ nodeId, lesson }, index) => {
          const status = nodeStatus(nodeId);
          const eligibleLocked = status === "locked" && isEligibleLocked?.(nodeId);
          const Icon = status === "locked" ? Lock : KIND_ICON[lesson.type] ?? GraduationCap;
          const interactive = status !== "locked" || eligibleLocked;
          const handleClick = () => {
            if (!interactive) return;
            if (status === "locked") onSelectLockedNode(nodeId, lesson);
            else onSelectNode(nodeId, lesson);
          };
          return (
            <div key={nodeId} className={`rm-node-row lane-${(index + laneOffset) % 3}`}>
              <motion.button
                type="button"
                ref={(node) => {
                  if (node) nodeRefs.current[nodeId] = node;
                }}
                className={`rm-node ${status} ${eligibleLocked ? "testable" : ""}`}
                disabled={!interactive}
                onClick={handleClick}
                aria-label={`โหนด ${nodeId} - ${status === "cleared" ? "ผ่านแล้ว" : status === "current" ? "ด่านปัจจุบัน" : eligibleLocked ? "ล็อค - ทำแบบทดสอบข้ามด่านได้" : "ล็อค"}`}
                animate={status === "current" && !reduceMotion ? { y: [0, -8, 0] } : undefined}
                transition={status === "current" && !reduceMotion ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
                whileTap={interactive ? { scale: 0.92 } : undefined}
              >
                {status === "cleared" ? <Stamp size={34} animate={false} label="" /> : <Icon size={26} aria-hidden="true" />}
                {status !== "locked" ? (
                  <span className="rm-node-kind" aria-hidden="true">
                    {(() => {
                      const KindIcon = KIND_ICON[lesson.type] ?? GraduationCap;
                      return <KindIcon size={12} />;
                    })()}
                  </span>
                ) : null}
                {eligibleLocked ? (
                  <span className="rm-node-kind testable" aria-hidden="true">
                    <KeyRound size={12} />
                  </span>
                ) : null}
              </motion.button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Vertical zigzag node route, grouped into unit sections with sticky headers.
    `onBack`, when given, puts a back arrow in the (now single) section header
    - used by ChapterPath, which always renders exactly one chapter. */
export default function NodeRoute({ units, nodeStatus, onSelectNode, isEligibleLocked, onSelectLockedNode, onBack }) {
  const nodeRefs = useRef({});
  let laneOffset = 0;

  return (
    <>
      {units.map((unit) => {
        const section = (
          <UnitSection
            key={unit.id}
            unit={unit}
            nodeStatus={nodeStatus}
            onSelectNode={onSelectNode}
            isEligibleLocked={isEligibleLocked}
            onSelectLockedNode={onSelectLockedNode}
            nodeRefs={nodeRefs}
            laneOffset={laneOffset}
            onBack={onBack}
          />
        );
        laneOffset += unit.lessons.reduce((sum, lesson) => sum + lesson.nodeIds.length, 0);
        return section;
      })}
    </>
  );
}
