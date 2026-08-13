import { useEffect, useRef, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

function replyFor(q: string, isOfficer: boolean, isContractor: boolean): string {
  const lower = q.toLowerCase();
  if (lower.includes("permit") || lower.includes("renovation")) {
    return isContractor
      ? "For airside renovation, prepare PTW and Fire Alarm Isolation packs, complete JSI with IFM, then submit via OneCal 3.0. Check Process → Setup → Permit Application for the ordered sub-steps."
      : isOfficer
        ? "Tenants and contractors submit permits in OneCal 3.0 after JSI. First-level review is COM; IFM, AES and Engineering review in parallel. See Process → Setup → Multi-Party Review."
        : "Start with Process → Setup → Permit Application. Define permit types with your Project Officer, complete JSI, then submit in OneCal 3.0 with QP/PE/LEW endorsements.";
  }
  if (lower.includes("document") || lower.includes("requirement")) {
    return "Open Document Library for Renovation Requirements, Method Statement and Hoarding Plan templates. Filter by your terminal and F&B or Retail context.";
  }
  return isOfficer
    ? "I can help with process steps, requirements and documents across Airside F&B and Retail. Try asking about permits, JSI, or TOPAZ reporting — or check Process and Document Library."
    : isContractor
      ? "I can guide works and permit steps for Airside F&B/Retail. Ask about JSI, OneCal submissions, or handover/renovation checks."
      : "I can answer questions about your unit’s tenancy process and documents. Ask about permits, opening readiness, or servicing reports.";
}

export function AssistantPanel() {
  const { assistantOpen, closeAssistant, assistantSeed, role } = useApp();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!assistantOpen) {
      seeded.current = false;
      return;
    }
    setMessages([
      {
        role: "assistant",
        text: isOfficer
          ? "Hi Daniel — ask about process, requirements or documents for Airside F&B and Retail."
          : isContractor
            ? "Hi Raj — ask about works, permits and renovation steps for this airside unit."
            : "Hi Sarah — ask about your tenancy process, documents or who to contact.",
      },
    ]);
  }, [assistantOpen, isOfficer, isContractor]);

  useEffect(() => {
    if (!assistantOpen || !assistantSeed || seeded.current) return;
    seeded.current = true;
    const q = assistantSeed;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: replyFor(q, isOfficer, isContractor) },
    ]);
  }, [assistantOpen, assistantSeed, isOfficer, isContractor]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!assistantOpen) return null;

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: replyFor(q, isOfficer, isContractor) },
    ]);
  };

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-grey-100 bg-white">
      <header className="flex items-center justify-between border-b border-grey-75 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-black text-black">Assistant</span>
        </div>
        <button
          type="button"
          onClick={closeAssistant}
          className="rounded-[var(--radius-sm)] p-1.5 text-grey-500 hover:bg-grey-50 hover:text-black"
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-[var(--radius-2xl)] px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-grey-75 text-black",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-grey-75 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about process, documents…"
            className="flex-1 rounded-[var(--radius-sm)] border border-grey-200 px-3 py-2 text-sm text-black placeholder:text-grey-300"
          />
          <button
            type="button"
            onClick={send}
            className="rounded-[var(--radius-sm)] bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
