import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Sparkles, Square } from "lucide-react";
import closeIcon from "@/assets/figma/x-close.svg";
import { answerFor } from "@/pages/ChatV29";
import { cn } from "@/lib/utils";

export type AskChatMessage = { role: "user" | "assistant"; text: string };

const ACTION =
  "grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border";

/** Reply delay so the thinking state is visible. */
const THINK_MS = 900;

export function AskChatSheet({
  unitLine,
  starters,
  messages,
  onMessages,
  seed,
  onClose,
}: {
  unitLine: string;
  starters: string[];
  messages: AskChatMessage[];
  onMessages: (next: AskChatMessage[]) => void;
  /** Question to send as soon as the chat opens. */
  seed?: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const latest = useRef(messages);
  latest.current = messages;
  const last = messages[messages.length - 1];
  const thinking = last?.role === "user";

  useEffect(() => {
    if (last?.role !== "user") return;
    const timer = window.setTimeout(() => {
      onMessages([...messages, { role: "assistant", text: answerFor(last.text) }]);
    }, THINK_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const stop = () => {
    onMessages([...latest.current, { role: "assistant", text: "Stopped. Ask again when you are ready." }]);
  };

  const send = (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;
    onMessages([...latest.current, { role: "user", text: question }]);
    setDraft("");
  };

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (seed?.trim()) send(seed);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, thinking]);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const empty = messages.length === 0 && !thinking;

  return createPortal(
    <div className="fixed inset-0 z-50 flex tablet:justify-end">
      <button
        type="button"
        aria-label="Close chat"
        className="absolute inset-0 hidden bg-[rgba(18,18,18,0.4)] tablet:block"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-dvh w-full flex-col bg-white shadow-[var(--shadow-light-bg)] tablet:max-w-md"
      >
        <header className="flex items-center justify-between gap-3 border-b border-grey-75 px-4 py-3 tablet:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-base leading-5 font-bold text-black">
                Ask about this unit
              </h2>
              <p className="truncate text-xs leading-4 text-grey-500">{unitLine}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onMessages([]);
                  inputRef.current?.focus();
                }}
                className="h-8 rounded-[var(--radius-sm)] px-2 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
              >
                New chat
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 grid size-10 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              <img src={closeIcon} alt="" width={20} height={20} />
            </button>
          </div>
        </header>

        <div
          className="scroll-visible min-h-0 flex-1 overflow-y-auto px-4 py-5 tablet:px-5"
          aria-live="polite"
        >
          {empty ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-lg leading-[22px] font-bold text-black">How can I help?</p>
                <p className="mt-1 text-sm leading-[18px] text-grey-600">
                  Ask about the tenancy, the process, or a step for this unit.
                </p>
              </div>
              <div role="group" aria-label="Suggested questions" className="flex flex-col items-start gap-2">
                {starters.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => send(question)}
                    className="inline-flex min-h-8 w-fit items-center rounded-full border border-grey-100 bg-grey-25 px-3 py-1.5 text-left text-sm leading-[18px] text-purple-600 hover:border-purple-300 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <li
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "items-start gap-2",
                  )}
                >
                  {message.role === "assistant" ? <AssistantMark /> : null}
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-sm leading-5",
                      message.role === "user"
                        ? "rounded-[var(--radius-xl)] rounded-br-[var(--radius-sm)] bg-purple-600 text-white"
                        : "rounded-[var(--radius-xl)] rounded-tl-[var(--radius-sm)] bg-grey-50 text-black",
                    )}
                  >
                    {message.text}
                  </p>
                </li>
              ))}
              {thinking ? (
                <li className="flex items-start gap-2">
                  <AssistantMark />
                  <p className="inline-flex items-center gap-1 rounded-[var(--radius-xl)] rounded-tl-[var(--radius-sm)] bg-grey-50 px-3.5 py-3">
                    <span className="sr-only">Thinking</span>
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        aria-hidden
                        className="size-1.5 animate-pulse rounded-full bg-grey-400"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </p>
                </li>
              ) : null}
            </ol>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-grey-75 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] tablet:px-5"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <div className="flex h-12 items-center gap-2 rounded-[var(--radius-lg)] border border-grey-100 bg-white pr-3 pl-4 focus-within:border-purple-600">
            <label htmlFor={`${titleId}-input`} className="sr-only">
              Ask about this unit
            </label>
            <input
              ref={inputRef}
              id={`${titleId}-input`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={empty ? "Ask about this unit" : "Ask a follow-up"}
              autoComplete="off"
              className="h-5 min-w-0 flex-1 bg-transparent text-base leading-5 text-black outline-none placeholder:text-grey-400"
            />
            {thinking ? (
              <button
                type="button"
                aria-label="Stop"
                onClick={stop}
                className={`${ACTION} border-grey-300 bg-white text-grey-700`}
              >
                <Square className="size-4 fill-current" aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send"
                disabled={!draft.trim()}
                className={cn(
                  ACTION,
                  draft.trim()
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-grey-200 bg-grey-100 text-grey-400",
                )}
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs leading-4 text-grey-600">
            This is an AI-powered platform and can make mistakes. Please double-check responses.
          </p>
        </form>
      </aside>
    </div>,
    document.body,
  );
}

function AssistantMark() {
  return (
    <span
      aria-hidden
      className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600"
    >
      <Sparkles className="size-3.5" />
    </span>
  );
}
