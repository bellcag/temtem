import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/lib/app-state";
import {
  readWorksJobs,
  WORKS_CHANGED_EVENT,
  WORKS_HREF,
} from "@/lib/process-works-jobs";
import reviewsIcon from "@/assets/figma/reviews.svg";

export function UpcomingWorksFab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, unit, effectiveUnit } = useApp();
  const unitId = (effectiveUnit ?? unit).id;
  const [hasOperateWorks, setHasOperateWorks] = useState(() =>
    readWorksJobs(unitId).some((job) => job.kind === "operate"),
  );

  useEffect(() => {
    const refresh = () =>
      setHasOperateWorks(
        readWorksJobs(unitId).some((job) => job.kind === "operate"),
      );
    refresh();
    window.addEventListener(WORKS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WORKS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unitId]);
  const hide =
    location.pathname.startsWith("/works") ||
    (!hasOperateWorks && role !== "officer");

  if (hide) return null;

  return (
    <div className="pointer-events-none fixed z-30 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] tablet:right-8 tablet:bottom-8">
      <button
        type="button"
        onClick={() => navigate(`${WORKS_HREF}?kind=operate`)}
        className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm leading-[18px] font-bold text-white shadow-[var(--shadow-light-bg)] hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        <img
          src={reviewsIcon}
          alt=""
          className="size-5 brightness-0 invert"
          aria-hidden
        />
        See works
      </button>
    </div>
  );
}
