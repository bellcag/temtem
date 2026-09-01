import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, X } from "lucide-react";
import { DOCUMENTS, type DocItem } from "@/lib/tenancy-data";
import { useApp } from "@/lib/app-state";

function pdfSrcFor(doc: DocItem) {
  // Prototype PDFs live in /public/docs/{id}.pdf
  return `/docs/${doc.id}.pdf`;
}

export function DocumentPreviewDrawer({
  docId,
  onClose,
}: {
  docId: string | null;
  onClose: () => void;
}) {
  const { trackDoc } = useApp();
  const doc = docId ? DOCUMENTS.find((d) => d.id === docId) : undefined;

  useEffect(() => {
    if (!docId) return;
    trackDoc(docId);
  }, [docId, trackDoc]);

  useEffect(() => {
    if (!docId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [docId, onClose]);

  if (!docId) return null;

  const pdfSrc = doc ? pdfSrcFor(doc) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close document preview"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-grey-100 bg-white shadow-[var(--shadow-light-bg)] desktop:max-w-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                PDF preview
              </p>
              <h2
                id="doc-preview-title"
                className="mt-1 text-base font-bold text-black"
              >
                {doc?.name ?? "Document not found"}
              </h2>
              {doc && (
                <p className="mt-1 text-xs text-grey-500">
                  {doc.type} · v{doc.version} · {doc.owner}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-grey-500 hover:bg-grey-50 hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-grey-75">
          {doc && pdfSrc ? (
            <iframe
              key={doc.id}
              title={`PDF preview — ${doc.name}`}
              src={`${pdfSrc}#view=FitH`}
              className="h-full w-full flex-1 border-0 bg-grey-100"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-grey-500">
              This document is not in the library.
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-grey-75 bg-white p-4">
          {doc && (
            <>
              <p className="line-clamp-2 text-xs leading-relaxed text-grey-500">
                {doc.changelog}
              </p>
              <div className="flex flex-col gap-2 tablet:flex-row">
                <Link
                  to={`/documents/${doc.id}`}
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
                >
                  View in full page
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={pdfSrcFor(doc)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-4 py-2.5 text-sm font-bold text-grey-700 hover:border-purple-300 hover:text-purple-700"
                >
                  Open PDF
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-[var(--radius-sm)] border border-grey-200 bg-white px-4 py-2.5 text-sm font-bold text-grey-700 hover:border-purple-300 hover:text-purple-700 tablet:hidden"
          >
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
}
