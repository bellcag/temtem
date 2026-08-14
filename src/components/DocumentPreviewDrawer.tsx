import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText } from "lucide-react";
import { DOCUMENTS, type DocItem } from "@/lib/tenancy-data";
import { useApp } from "@/lib/app-state";
import { Drawer, Button } from "@/components/runway";

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

  const pdfSrc = doc ? pdfSrcFor(doc) : null;

  return (
    <Drawer
      open={Boolean(docId)}
      onClose={onClose}
      labelledBy="doc-preview-title"
      eyebrow={
        <span className="inline-flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-purple-600" />
          PDF preview
        </span>
      }
      title={doc?.name ?? "Document not found"}
      meta={
        doc ? (
          <>
            {doc.type} · v{doc.version} · {doc.owner}
          </>
        ) : undefined
      }
      footer={
        doc ? (
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
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full text-grey-700 tablet:hidden"
            >
              Close
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        )
      }
    >
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
    </Drawer>
  );
}
