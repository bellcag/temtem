import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  PanelLeft,
  Plus,
  Search,
} from "lucide-react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { cn } from "@/lib/utils";

GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const TOOL =
  "grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-grey-200 bg-white text-grey-700 hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] disabled:cursor-default disabled:text-grey-300";

export function SamplePdfViewer({ src, title }: { src: string; title: string }) {
  const listId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [sidebar, setSidebar] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const textRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setThumbs([]);
    setPage(1);
    setQuery("");
    setSearchNote(null);
    const loading = getDocument({ url: src });
    loading.promise
      .then(async (pdf) => {
        if (cancelled) {
          await pdf.cleanup();
          return;
        }
        await pdfRef.current?.cleanup();
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        const previews: string[] = [];
        const text: string[] = [];
        for (let index = 1; index <= pdf.numPages; index += 1) {
          const sheet = await pdf.getPage(index);
          const viewport = sheet.getViewport({ scale: 0.22 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (context) {
            await sheet.render({ canvas, canvasContext: context, viewport }).promise;
            previews.push(canvas.toDataURL());
          }
          const content = await sheet.getTextContent();
          text.push(
            content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" "),
          );
        }
        if (cancelled) return;
        setThumbs(previews);
        textRef.current = text;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      loading.destroy();
    };
  }, [src]);

  useEffect(() => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!pdf || !canvas || !stage || pageCount === 0) return;
    let cancelled = false;
    const draw = () => {
      pdf.getPage(page).then((sheet) => {
        if (cancelled) return;
        const base = sheet.getViewport({ scale: 1 });
        const fit = Math.max(0.4, (stage.clientWidth - 32) / base.width);
        const viewport = sheet.getViewport({ scale: fit * zoom });
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        sheet.render({ canvas, canvasContext: context, viewport });
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(stage);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [page, zoom, pageCount, thumbs]);

  useEffect(() => {
    return () => {
      void pdfRef.current?.cleanup();
      pdfRef.current = null;
    };
  }, []);

  const go = (next: number) => {
    setPage(Math.min(pageCount, Math.max(1, next)));
  };

  const find = (value: string) => {
    setQuery(value);
    const needle = value.trim().toLowerCase();
    if (!needle) {
      setSearchNote(null);
      return;
    }
    const hit = textRef.current.findIndex((row) => row.toLowerCase().includes(needle));
    if (hit === -1) {
      setSearchNote("No matches");
      return;
    }
    setSearchNote(null);
    setPage(hit + 1);
  };

  const stepZoom = (dir: 1 | -1) => {
    const index = ZOOMS.findIndex((row) => row >= zoom - 0.01);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, index + dir))];
    if (next) setZoom(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-grey-100 px-3 py-2">
        <button
          type="button"
          aria-pressed={sidebar}
          aria-label={sidebar ? "Hide page thumbnails" : "Show page thumbnails"}
          onClick={() => setSidebar((open) => !open)}
          className={cn(TOOL, sidebar && "bg-grey-50")}
        >
          <PanelLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className={TOOL}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <label className="flex items-center gap-1.5 text-sm leading-[18px] text-grey-700">
          Page
          <input
            aria-label="Page number"
            inputMode="numeric"
            value={pageCount === 0 ? "" : page}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) go(next);
            }}
            className="h-8 w-10 rounded-[var(--radius-sm)] border border-grey-200 text-center text-sm text-black"
          />
          of {pageCount || "–"}
        </label>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          className={TOOL}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= ZOOMS[0]}
            onClick={() => stepZoom(-1)}
            className={TOOL}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <div className="relative">
            <button
              type="button"
              aria-expanded={zoomOpen}
              aria-controls={listId}
              onClick={() => setZoomOpen((open) => !open)}
              className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-2 text-sm leading-[18px] text-grey-700 hover:bg-grey-50"
            >
              {Math.round(zoom * 100)}%
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
            {zoomOpen ? (
              <ul
                id={listId}
                className="absolute right-0 z-10 mt-1 w-24 overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white py-1 shadow-[var(--shadow-light-bg)]"
              >
                {ZOOMS.map((value) => (
                  <li key={value}>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(value);
                        setZoomOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-1.5 text-left text-sm leading-[18px] hover:bg-grey-50",
                        value === zoom && "font-bold text-purple-600",
                      )}
                    >
                      {Math.round(value * 100)}%
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= ZOOMS[ZOOMS.length - 1]}
            onClick={() => stepZoom(1)}
            className={TOOL}
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-pressed={searchOpen}
            aria-label="Search in sample"
            onClick={() => setSearchOpen((open) => !open)}
            className={cn(TOOL, searchOpen && "bg-grey-50")}
          >
            <Search className="size-4" aria-hidden />
          </button>
          <a href={src} download className={TOOL} aria-label={`Download ${title}`}>
            <Download className="size-4" aria-hidden />
          </a>
        </div>
      </div>
      {searchOpen ? (
        <div className="flex items-center gap-3 border-b border-grey-100 px-3 py-2">
          <input
            autoFocus
            value={query}
            onChange={(event) => find(event.target.value)}
            placeholder="Search this sample"
            className="h-8 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-grey-200 px-2 text-sm leading-[18px] text-black"
          />
          {searchNote ? <p className="text-sm leading-[18px] text-grey-500">{searchNote}</p> : null}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {sidebar ? (
          <div className="flex w-[4.5rem] shrink-0 flex-col gap-2 overflow-y-auto border-r border-grey-100 bg-grey-25 px-1.5 py-3">
            {thumbs.map((thumb, index) => {
              const number = index + 1;
              const on = number === page;
              return (
                <button
                  key={thumb}
                  type="button"
                  aria-current={on ? "page" : undefined}
                  aria-label={`Page ${number}`}
                  onClick={() => go(number)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[var(--radius-md)] px-1 py-1",
                    on ? "bg-grey-100" : "hover:bg-grey-50",
                  )}
                >
                  <img
                    src={thumb}
                    alt=""
                    className="w-full border border-grey-200 bg-white"
                  />
                  <span className="text-xs leading-4 text-grey-600">{number}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        <div ref={stageRef} className="min-w-0 flex-1 overflow-auto bg-grey-50 p-4">
          {failed ? (
            <p className="text-sm leading-[18px] text-grey-600">This sample could not be opened.</p>
          ) : (
            <canvas ref={canvasRef} className="mx-auto bg-white shadow-[var(--shadow-light-bg)]" />
          )}
        </div>
      </div>
    </div>
  );
}
