import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText } from "lucide-react";
import { DOCUMENTS, type DocItem } from "@/lib/tenancy-data";
import { useApp } from "@/lib/app-state";
import { Button, Drawer, Text } from "@/dls";

function pdfSrcFor(doc: DocItem) {
  return `/docs/${doc.id}.pdf`;
}

/** Document preview using Storybook Drawer (From Right, size lg). */
export function DocumentPreviewDrawerV4({
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
      size="lg"
      title={doc?.name ?? "Document not found"}
      subtitle={doc ? `${doc.type} · v${doc.version} · ${doc.owner}` : "PDF preview"}
      footer={
        doc ? (
          <div className="flex flex-col gap-3">
            <Text size="x-small" className="text-grey-500">
              {doc.changelog}
            </Text>
            <div className="flex flex-col gap-2 tablet:flex-row">
              <Link to={`/documents/${doc.id}`} onClick={onClose} className="flex-1">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  trailingIcon={<ExternalLink className="h-3.5 w-3.5" />}
                >
                  View in full page
                </Button>
              </Link>
              <a
                href={pdfSrcFor(doc)}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button
                  variant="secondary_mono"
                  size="lg"
                  className="w-full"
                  trailingIcon={<ExternalLink className="h-3.5 w-3.5" />}
                >
                  Open PDF
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <Button variant="secondary_mono" size="lg" className="w-full" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="flex min-h-0 flex-1 flex-col bg-grey-75">
        {doc && pdfSrc ? (
          <iframe
            key={doc.id}
            title={`PDF preview — ${doc.name}`}
            src={`${pdfSrc}#view=FitH`}
            className="h-full min-h-[50vh] w-full flex-1 border-0 bg-grey-100"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 p-6">
            <FileText className="h-4 w-4 text-grey-400" />
            <Text size="body-sm" className="text-grey-500">
              This document is not in the library.
            </Text>
          </div>
        )}
      </div>
    </Drawer>
  );
}
