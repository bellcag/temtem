import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FilterChip } from "@/components/dls/Chip";
import { useApp } from "@/lib/app-state";
import {
  V26_DOC_TYPES,
  v26LibraryById,
  v26LibraryForRole,
  type V26DocType,
} from "@/lib/process-v26-documents";
import { markV26Preview } from "@/lib/process-v26-preview";
import { readV28Preview } from "@/lib/process-v28-preview";
import { CUT_STANDALONE } from "@/lib/process-v31-preview";
import { TENANCY_FAQ, TENANCY_FAQ_ID, TENANCY_FAQ_SOURCE } from "@/lib/home-v29-faq";

export function DocumentsV26Page() {
  const { role } = useApp();
  const [type, setType] = useState<V26DocType | "">("");

  useEffect(() => {
    if (CUT_STANDALONE || readV28Preview()) return;
    markV26Preview();
  }, []);

  const rows = useMemo(() => {
    const list = v26LibraryForRole(role);
    if (!type) return list;
    return list.filter((row) => row.type === type);
  }, [role, type]);

  return (
    <div className="dls-page flex flex-col gap-6 !pt-5 tablet:!pt-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
          Library
        </p>
        <h1 className="text-[28px] leading-9 font-bold text-black">
          Documents
        </h1>
        <p className="text-sm leading-[18px] text-grey-500">
          Types come from the Document Library list. Email templates stay with
          the Project Officer.
        </p>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Document type"
        >
          <FilterChip selected={!type} onClick={() => setType("")}>
            All types
          </FilterChip>
          {V26_DOC_TYPES.filter((name) =>
            role === "officer" ? true : name !== "Email Templates",
          ).map((name) => (
            <FilterChip
              key={name}
              selected={type === name}
              onClick={() => setType(type === name ? "" : name)}
            >
              {name}
            </FilterChip>
          ))}
        </div>
      </header>

      <ul className="flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
        {rows.map((row) => (
          <li key={row.id} className="border-b border-grey-50 last:border-b-0">
            {row.url ? (
              <a
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1 px-4 py-4 hover:bg-grey-25 tablet:px-6"
              >
                <p className="text-sm leading-[18px] font-bold text-purple-600">
                  {row.name}
                </p>
                <p className="text-xs leading-4 text-grey-500">
                  {row.type} · {row.owner}
                  {row.phases.length > 0 ? ` · ${row.phases.join(", ")}` : ""}
                  {row.officerOnly ? " · Officer only" : ""}
                </p>
              </a>
            ) : (
              <Link
                to={`/documents/${row.id}`}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-grey-25 tablet:px-6"
              >
                <p className="text-sm leading-[18px] font-bold text-purple-600">
                  {row.name}
                </p>
                <p className="text-xs leading-4 text-grey-500">
                  {row.type} · {row.owner}
                  {row.phases.length > 0 ? ` · ${row.phases.join(", ")}` : ""}
                  {row.officerOnly ? " · Officer only" : ""}
                </p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentsV26DetailPage() {
  const { id } = useParams();
  const { role } = useApp();
  const row = v26LibraryById(id);

  useEffect(() => {
    if (CUT_STANDALONE || readV28Preview()) return;
    markV26Preview();
  }, []);

  if (!row || (row.officerOnly && role !== "officer")) {
    return (
      <div className="dls-page flex flex-col gap-4 !pt-5 tablet:!pt-8">
        <p className="text-sm leading-[18px] text-grey-600">
          This file is not in the library for this login.
        </p>
        <Link to="/documents" className="text-sm font-bold text-purple-600">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="dls-page flex flex-col gap-6 !pt-5 tablet:!pt-8">
      <Link to="/documents" className="text-sm font-bold text-purple-600">
        Documents
      </Link>
      <header className="flex flex-col gap-2">
        <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
          {row.type}
        </p>
        <h1 className="text-[28px] leading-9 font-bold text-black">
          {row.name}
        </h1>
        <p className="text-sm leading-[18px] text-grey-500">
          {row.owner}
          {row.phases.length > 0 ? ` · ${row.phases.join(", ")}` : ""}
          {row.officerOnly ? " · Officer only" : ""}
        </p>
      </header>
      {row.id === TENANCY_FAQ_ID ? (
        <article className="flex flex-col gap-8 rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-6">
          <p className="text-sm leading-[18px] text-grey-500">{TENANCY_FAQ_SOURCE}</p>
          {TENANCY_FAQ.map((section) => (
            <section key={section.id} id={`faq-${section.id}`}>
              <h2>{section.title}</h2>
              <p className="mt-1 text-sm leading-[18px] text-grey-500">{section.detail}</p>
              <dl className="mt-4 space-y-4">
                {section.items.map((item) => (
                  <div key={item.q}>
                    <dt className="text-sm font-bold leading-[18px] text-black">{item.q}</dt>
                    <dd className="mt-1 text-sm leading-5 text-grey-600">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </article>
      ) : row.url ? (
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 w-fit items-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
        >
          Open file
        </a>
      ) : (
        <p className="text-sm leading-[18px] text-grey-600">
          The library has this file, but no link yet.
        </p>
      )}
    </div>
  );
}
