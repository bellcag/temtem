import { Link, useParams } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { DOCUMENTS } from "@/lib/tenancy-data";
import { useApp } from "@/lib/app-state";
import { useEffect, useMemo, useState } from "react";

export function DocumentsPage() {
  const { unit, role, trackDoc } = useApp();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    let docs = DOCUMENTS.filter(
      (d) =>
        d.zone.includes("Airside") &&
        d.tenancyType.some((t) => t === "F&B" || t === "Retail"),
    );
    if (role !== "officer") {
      docs = docs.filter(
        (d) =>
          d.terminal.includes(unit.terminal) &&
          d.tenancyType.includes(unit.tenancyType),
      );
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      docs = docs.filter((d) => d.name.toLowerCase().includes(s));
    }
    return docs;
  }, [unit, role, q]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1>Document Library</h1>
      <p className="mt-1 text-grey-500">
        Airside · F&B and Retail — policies, guides and templates.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search documents…"
        className="mt-6 w-full max-w-md rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-sm"
      />
      <ul className="mt-6 divide-y divide-grey-75 overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
        {list.map((d) => (
          <li key={d.id}>
            <Link
              to={`/documents/${d.id}`}
              onClick={() => trackDoc(d.id)}
              className="flex items-start gap-3 px-5 py-4 hover:bg-grey-50"
            >
              <FileText className="mt-0.5 h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm font-bold text-black">{d.name}</div>
                <div className="mt-0.5 text-xs text-grey-500">
                  {d.type} · {d.owner} · {d.updatedAt}
                  {d.status ? ` · ${d.status}` : ""}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentDetailPage() {
  const { id } = useParams();
  const { trackDoc } = useApp();
  const doc = DOCUMENTS.find((d) => d.id === id);

  useEffect(() => {
    if (id) trackDoc(id);
  }, [id, trackDoc]);

  if (!doc) {
    return (
      <div className="px-6 py-10">
        <p className="text-grey-500">Document not found.</p>
        <Link to="/documents" className="mt-4 inline-flex text-purple-600">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to="/documents"
        className="inline-flex items-center gap-1 text-sm font-bold text-purple-600"
      >
        <ArrowLeft className="h-4 w-4" /> Document Library
      </Link>
      <h1 className="mt-4">{doc.name}</h1>
      <p className="mt-2 text-sm text-grey-500">
        {doc.type} · v{doc.version} · Effective {doc.effective} · Owner{" "}
        {doc.owner}
      </p>
      {doc.status && (
        <span className="mt-3 inline-flex rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-700">
          {doc.status}
        </span>
      )}

      <div className="mt-6 overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-grey-75">
        <iframe
          title={`PDF — ${doc.name}`}
          src={`/docs/${doc.id}.pdf#view=FitH`}
          className="h-[70vh] w-full border-0 bg-white"
        />
      </div>

      <div className="mt-6 rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-6">
        <p className="text-sm leading-relaxed text-grey-700">{doc.changelog}</p>
        <p className="mt-4 text-sm leading-relaxed text-grey-600">
          Applies to {doc.tenancyType.join(", ")} tenancies across{" "}
          {doc.terminal.join(", ")} ({doc.zone.join(", ")}). Linked from relevant
          Process guide steps.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/docs/${doc.id}.pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-[var(--radius-sm)] border border-grey-200 bg-white px-4 py-2 text-sm font-bold text-grey-700 hover:border-purple-300 hover:text-purple-700"
          >
            Open PDF
          </a>
          <Link
            to="/process-v3"
            className="inline-flex rounded-[var(--radius-sm)] bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
          >
            Back to Process
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AppsPage() {
  const apps = [
    { name: "OneCal 3.0", desc: "Permit applications and works submissions." },
    { name: "LMS", desc: "Lease records and sales declarations." },
    { name: "APIC", desc: "Airport Pass applications and renewals." },
    { name: "ACS", desc: "Loading bay and lift bookings." },
    { name: "TOPAZ", desc: "Recurring servicing and COF submissions." },
    { name: "TDT", desc: "Store information publishing." },
    { name: "WebEpic / SESAMI", desc: "Invoicing and vendor payments." },
    { name: "iShopChangi", desc: "Online store (Retail / F&B)." },
  ];
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1>Apps Directory</h1>
      <p className="mt-1 text-grey-500">
        Systems referenced across Process steps (links are stubs for the
        prototype).
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((a) => (
          <div
            key={a.name}
            className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5"
          >
            <div className="font-black text-black">{a.name}</div>
            <p className="mt-1 text-sm text-grey-500">{a.desc}</p>
            <button
              type="button"
              className="mt-4 rounded-[var(--radius-sm)] border border-grey-200 px-3 py-2 text-xs font-bold text-grey-600"
            >
              Open App
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactsPage() {
  const { role } = useApp();
  const people =
    role === "officer"
      ? [
          { name: "Marcus Tan", role: "Line Manager · COM T3", email: "marcus.tan@changiairport.com" },
          { name: "Priya Nair", role: "Process Lead", email: "priya.nair@changiairport.com" },
        ]
      : [
          { name: "Lim Wei Ming", role: "Project Officer · COM T3", email: "weiming.lim@changiairport.com" },
          { name: "Aisha Rahman", role: "Backup Project Officer", email: "aisha.rahman@changiairport.com" },
        ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1>Contacts</h1>
      <p className="mt-1 text-grey-500">
        Key people for Airside F&B / Retail tenancies.
      </p>
      <ul className="mt-6 divide-y divide-grey-75 overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
        {people.map((p) => (
          <li key={p.email} className="px-5 py-4">
            <div className="font-bold text-black">{p.name}</div>
            <div className="text-sm text-grey-500">{p.role}</div>
            <a
              href={`mailto:${p.email}`}
              className="mt-1 inline-block text-sm font-bold text-purple-600"
            >
              {p.email}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScreenerDraftsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1>Screener · Drafts</h1>
      <p className="mt-1 text-grey-500">
        Lightweight stub — continue Application Screener drafts here in a later
        pass.
      </p>
      <div className="mt-6 rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-6 text-sm text-grey-500">
        No drafts in this MVP build. Use Process → Permit Application for
        guidance on document packs.
      </div>
    </div>
  );
}

export function ScreenerHistoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1>Screener · History</h1>
      <p className="mt-1 text-grey-500">Past screening runs (stub).</p>
      <div className="mt-6 rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-6 text-sm text-grey-500">
        History list deferred — Process P0 is the focus of this pass.
      </div>
    </div>
  );
}
