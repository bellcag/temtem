import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { TENANCY_FAQ } from "@/lib/home-v29-faq";
import { markV28Preview } from "@/lib/process-v28-preview";
import { markHomeCut } from "@/lib/home-cut";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; text: string };
type ChatThread = {
  id: string;
  unit: string;
  when: string;
  messages: ChatMessage[];
};

const STARTER: ChatThread[] = [];

export function answerFor(query: string) {
  const q = query.toLowerCase();
  let best: { text: string; score: number } | null = null;
  for (const section of TENANCY_FAQ) {
    for (const item of section.items) {
      const words = `${item.q} ${section.title}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3);
      const score = words.filter((word) => q.includes(word)).length;
      if (score > (best?.score ?? 0)) best = { text: item.a, score };
    }
  }
  if (best && best.score > 0) return best.text;
  return "I answer from the Tenancy FAQ for this unit. Ask about the kick-off, the till, or airport passes.";
}

export function ChatV29Page() {
  const { unit, role } = useApp();
  const unitLine =
    role === "tenant" ? `${unit.company} · ${unit.unitNo}` : unit.unitNo;
  const [threads, setThreads] = useState<ChatThread[]>(STARTER);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const active = threads.find((thread) => thread.id === activeId) ?? null;

  useEffect(() => {
    markV28Preview();
    markHomeCut("v29");
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply = answerFor(trimmed);
    if (!active) {
      const id = `t-${Date.now()}`;
      setThreads((prev) => [
        {
          id,
          unit: unitLine,
          when: "Just now",
          messages: [
            { role: "user", text: trimmed },
            { role: "assistant", text: reply },
          ],
        },
        ...prev,
      ]);
      setActiveId(id);
    } else {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === active.id
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  { role: "user", text: trimmed },
                  { role: "assistant", text: reply },
                ],
              }
            : thread,
        ),
      );
    }
    setDraft("");
  };

  return (
    <div className="-mx-4 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col bg-white tablet:-mx-8 desktop:-mx-10 desktop:h-dvh">
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "w-full flex-col border-grey-100 tablet:flex tablet:w-72 tablet:shrink-0 tablet:border-r",
            threads.length === 0 || active ? "hidden tablet:flex" : "flex",
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-grey-100 px-4 py-4">
            <p className="text-base font-bold leading-5 text-black">Chats</p>
            <button
              type="button"
              onClick={() => {
                setActiveId(null);
                setDraft("");
              }}
              className="text-sm font-bold text-purple-600 hover:text-purple-700"
            >
              New
            </button>
          </header>
          {threads.length === 0 ? (
            <p className="px-4 py-6 text-sm leading-5 text-grey-500">No chats yet.</p>
          ) : (
          <ul className="min-h-0 flex-1 divide-y divide-grey-75 overflow-y-auto">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(thread.id)}
                  className={cn(
                    "block w-full px-4 py-3.5 text-left hover:bg-grey-50",
                    thread.id === activeId && "bg-purple-100",
                  )}
                >
                  <span className="block truncate text-sm font-bold text-black">
                    {thread.messages[0]?.text}
                  </span>
                  <span className="mt-1 block truncate text-xs text-grey-500">
                    {thread.unit} · {thread.when}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          )}
        </aside>

        <section
          className={cn(
            "min-w-0 flex-1 flex-col",
            active || threads.length === 0 ? "flex" : "hidden tablet:flex",
          )}
        >
          <header className="flex items-center gap-2 border-b border-grey-100 px-3 py-3">
            {threads.length > 0 ? (
              <button
                type="button"
                aria-label="Back to chats"
                onClick={() => setActiveId(null)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-grey-600 hover:bg-grey-50 tablet:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-black">
                {active?.messages[0]?.text ?? "New chat"}
              </p>
              <p className="truncate text-xs text-grey-500">{unitLine}</p>
            </div>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {active ? (
              active.messages.map((message, index) => (
                <div
                  key={`${active.id}-${index}`}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <p
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-[var(--radius-2xl)] bg-purple-600 px-3.5 py-2.5 text-sm leading-5 text-white"
                        : "max-w-[85%] rounded-[var(--radius-2xl)] bg-grey-75 px-3.5 py-2.5 text-sm leading-5 text-black"
                    }
                  >
                    {message.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-5 text-grey-600">
                No chats yet. Ask about this tenancy.
              </p>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-grey-100 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about this tenancy"
              className="h-10 min-w-0 flex-1 rounded-full border border-grey-200 px-4 text-sm outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              className="rounded-full bg-purple-600 px-4 text-sm font-bold text-white hover:bg-purple-700"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
