import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Mic,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { answerFor } from "@/pages/ChatV29";
import { DOCUMENTS } from "@/lib/tenancy-data";
import { v35FreshDocIds } from "@/lib/process-v35-updates";
import { v37OutletLabel, v37UnitsForTenant } from "@/lib/process-v37";
import { cn } from "@/lib/utils";

/** Library Chat set `2121:2804`. Sample sheep copy stays in Figma. */

const DISCLAIMER =
  "This is an AI-powered platform and can make mistakes. Please double-check responses.";
const THINK_MS = 1200;
const MODEL_LABEL = "Model";

let stagedFile: Attachment | null = null;

function stageFile(file: Attachment | null) {
  stagedFile = file;
}

function takeStagedFile() {
  const file = stagedFile;
  stagedFile = null;
  return file;
}

export const V37_STARTERS = [
  "When is the kick-off?",
  "Where are the renovation rules?",
  "How do I book the joint site inspection?",
];

type Attachment = {
  id: string;
  name: string;
  kind: string;
  url: string;
  image: boolean;
};

type AssistantStatus = "loading" | "ready" | "interrupted" | "error" | "clarify";

type Branch = {
  id: string;
  text: string;
  at: number;
  failed: boolean;
  attachments: Attachment[];
  assistant: {
    status: AssistantStatus;
    text: string;
    at: number;
    page: number;
  } | null;
};

type Turn = {
  id: string;
  branches: Branch[];
  active: number;
};

type ClarifyPage = {
  title: string;
  kind: "option" | "multiple";
  options: string[];
};

function clock(at: number) {
  return new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

function needsChoice(text: string) {
  const known = clarifyPages().some((page) => page.options.includes(text));
  if (known) return false;
  return /\b(which|permit|unit|choose)\b/i.test(text);
}

function clarifyStart(text: string) {
  if (/\bunit\b/i.test(text)) return 1;
  if (/\b(step|kick-off|inspection)\b/i.test(text)) return 2;
  return 0;
}

function partialReply(text: string) {
  const sentence = text.split(/(?<=\.)\s/)[0] ?? text;
  return sentence.length < text.length ? sentence : text.slice(0, 80);
}

function clarifyPages(): ClarifyPage[] {
  const units = v37UnitsForTenant().map((unit) => v37OutletLabel(unit.id));
  return [
    {
      title: "Which permit is this about?",
      kind: "option",
      options: ["Renovation permit", "Fire safety permit", "Certificate of fitness"],
    },
    {
      title: "Which unit should I use?",
      kind: "multiple",
      options: units.length > 0 ? units : ["This unit"],
    },
    {
      title: "Which step is this for?",
      kind: "option",
      options: ["Kick-off", "Design pack for approval", "Joint site inspection"],
    },
  ];
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1279px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return narrow;
}

function fileKind(file: File) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "PDF";
  if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) return "PNG";
  if (file.type.startsWith("image/")) return "JPEG";
  const ext = file.name.split(".").pop();
  return (ext || "FILE").slice(0, 4).toUpperCase();
}

export function V37HomeComposer({
  value,
  onChange,
  onPick,
  starters,
}: {
  value: string;
  onChange: (next: string) => void;
  onPick: (question: string) => void;
  starters: string[];
}) {
  const narrow = useNarrow();
  const [attached, setAttached] = useState<string | null>(null);
  return (
    <div>
      {value.trim() ? null : (
        <SuggestedChips starters={starters} onPick={onPick} className="mb-3" />
      )}
      {attached ? <p className="mb-2 text-xs leading-4 text-grey-600">Attached: {attached}</p> : null}
      <PromptComposer
        size={narrow ? "mobile" : "M"}
        value={value}
        onChange={onChange}
        generating={false}
        onStop={() => undefined}
        onAttach={(file) => {
          stageFile({
            id: `file-${Date.now()}`,
            name: file.name,
            kind: fileKind(file),
            url: URL.createObjectURL(file),
            image: file.type.startsWith("image/"),
          });
          setAttached(file.name);
        }}
      />
    </div>
  );
}

function SuggestedChips({
  starters,
  onPick,
  className,
}: {
  starters: string[];
  onPick: (question: string) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Suggested questions"
      className={cn("flex flex-nowrap items-center gap-2 overflow-x-auto", className)}
    >
      {starters.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onPick(question)}
          className="inline-flex h-[42px] w-max shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-grey-100 bg-white px-3 text-sm leading-[18px] text-grey-700 shadow-[var(--shadow-light-bg)] hover:bg-grey-50"
        >
          <Sparkles className="size-4 shrink-0 text-grey-500" aria-hidden />
          <span className="whitespace-nowrap">{question}</span>
        </button>
      ))}
    </div>
  );
}

function PromptComposer({
  size,
  value,
  onChange,
  generating,
  onStop,
  onAttach,
  fieldRef,
}: {
  size: "M" | "L" | "mobile";
  value: string;
  onChange: (next: string) => void;
  generating: boolean;
  onStop: () => void;
  onAttach?: (file: File) => void;
  fieldRef?: Ref<HTMLInputElement | HTMLTextAreaElement>;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pressed, setPressed] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const filled = value.trim().length > 0;
  const tall = size === "L";
  const field = tall ? (
    <textarea
      id={inputId}
      ref={fieldRef as Ref<HTMLTextAreaElement>}
      rows={2}
      value={value}
      placeholder="How can I help you today?"
      onChange={(event) => onChange(event.target.value)}
      className="min-h-10 w-full resize-none bg-transparent text-base leading-5 text-black outline-none placeholder:text-grey-300"
    />
  ) : (
    <input
      id={inputId}
      ref={fieldRef as Ref<HTMLInputElement>}
      value={value}
      placeholder="How can I help you today?"
      onChange={(event) => onChange(event.target.value)}
      className="h-6 min-w-0 flex-1 bg-transparent text-base leading-5 text-black outline-none placeholder:text-grey-300"
    />
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className={cn(
          "rounded-[var(--radius-sm)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]",
          tall ? "px-6 py-4" : "flex items-center gap-4 px-6 py-4",
          size === "mobile" && pressed && "border-grey-300 shadow-none",
        )}
        onPointerDown={size === "mobile" ? () => setPressed(true) : undefined}
        onPointerUp={size === "mobile" ? () => setPressed(false) : undefined}
        onPointerLeave={size === "mobile" ? () => setPressed(false) : undefined}
      >
        <label className="sr-only" htmlFor={inputId}>
          How can I help you today?
        </label>
        {tall ? (
          <div className="flex items-start gap-2">
            {filled ? null : <Sparkles className="mt-0.5 size-5 shrink-0 text-grey-300" aria-hidden />}
            {field}
          </div>
        ) : (
          <>
            <IconButton label="Attach a file" onClick={() => fileRef.current?.click()} bordered={false}>
              <Plus className="size-5" />
            </IconButton>
            {filled ? null : <Sparkles className="size-5 shrink-0 text-grey-300" aria-hidden />}
            {field}
          </>
        )}
        <div className={cn("flex items-center justify-end gap-3", tall ? "mt-4 w-full" : "ml-auto")}>
          {tall ? (
            <IconButton label="Attach a file" onClick={() => fileRef.current?.click()} bordered={false}>
              <Plus className="size-5" />
            </IconButton>
          ) : null}
          <div className="relative ml-auto">
            {tall ? (
              <button
                type="button"
                aria-expanded={modelOpen}
                aria-haspopup="listbox"
                onClick={() => setModelOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black"
              >
                {MODEL_LABEL}
                <ChevronDown className="size-4" aria-hidden />
              </button>
            ) : (
              <IconButton label={MODEL_LABEL} onClick={() => setModelOpen((open) => !open)}>
                <ChevronDown className="size-4" />
              </IconButton>
            )}
            {modelOpen ? (
              <ul
                role="listbox"
                aria-label={MODEL_LABEL}
                className="absolute right-0 bottom-full z-10 mb-2 min-w-32 overflow-hidden rounded-[var(--radius-sm)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]"
              >
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected
                    onClick={() => setModelOpen(false)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-black hover:bg-grey-50"
                  >
                    {MODEL_LABEL}
                    <Check className="size-4 text-purple-600" aria-hidden />
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
          <IconButton label="Voice">
            <Mic className="size-4" />
          </IconButton>
          {generating ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={onStop}
              className="grid size-9 place-items-center rounded-full bg-black text-white"
            >
              <Square className="size-3 fill-current" aria-hidden />
            </button>
          ) : filled ? (
            <button
              type="submit"
              aria-label="Send"
              className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-purple-600 text-white hover:bg-purple-700"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-center text-xs leading-4 font-bold text-grey-500">{DISCLAIMER}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onAttach?.(file);
        }}
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  bordered = true,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  bordered?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black",
        bordered && "border border-grey-200 bg-white",
      )}
    >
      {children}
    </button>
  );
}

function Thumb({
  attachment,
  className,
}: {
  attachment: Attachment;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block overflow-hidden rounded-[var(--radius-sm)]", className)}>
      {attachment.image ? (
        <img src={attachment.url} alt="" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center bg-grey-75 text-grey-500">
          <FileText className="size-6" aria-hidden />
        </span>
      )}
      <span className="absolute bottom-2 left-2 rounded-[var(--radius-sm)] bg-white px-1.5 py-0.5 text-[11px] leading-[14px] font-bold text-grey-700">
        {attachment.kind}
      </span>
    </span>
  );
}

function UserBubble({
  branch,
  align,
  branchCount,
  branchIndex,
  onBranch,
  onCopy,
  onEdit,
  onDelete,
  onRetry,
  editing,
  draft,
  onDraft,
  onCancelEdit,
  onSaveEdit,
}: {
  branch: Branch;
  align: "left" | "right";
  branchCount: number;
  branchIndex: number;
  onBranch: (index: number) => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRetry: () => void;
  editing: boolean;
  draft: string;
  onDraft: (next: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const right = align === "right";
  const edited = branchCount > 1;
  return (
    <div
      className={cn("flex w-full", right ? "justify-end" : "justify-start")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex w-full max-w-[calc(100%-2rem)] flex-col gap-1 desktop:max-w-[min(100%,720px)]">
        <div
          className={cn(
            "rounded-[var(--radius-sm)] px-4 py-4",
            right ? "ml-auto bg-purple-100" : "mr-auto border border-grey-100 bg-white",
            branch.failed && "border border-[#cc1000]",
            !editing && "max-w-full",
          )}
          onClick={() => setPinned((open) => !open)}
        >
          {editing ? (
            <div className="flex flex-col gap-3">
              <input
                value={draft}
                onChange={(event) => onDraft(event.target.value)}
                aria-label="Edit message"
                className="h-10 w-full rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-base leading-5 text-black outline-none focus:border-purple-600"
              />
              <div className="flex flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 text-xs leading-4 text-grey-500">
                  Editing this message will create a new conversation branch. You can switch between branches using the arrow navigation buttons.
                </p>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="h-8 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="h-8 rounded-[var(--radius-sm)] bg-purple-600 px-3 text-sm leading-[18px] font-bold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {branch.attachments.map((file) => (
                <Thumb key={file.id} attachment={file} className="size-[120px]" />
              ))}
              <p className="text-base leading-5 text-black">{branch.text}</p>
              <p className="text-right text-xs leading-4 text-grey-500">{clock(branch.at)}</p>
            </div>
          )}
        </div>
        {branch.failed ? (
          <p className={cn("flex items-center gap-1 text-xs leading-4 text-[#cc1000]", right && "justify-end")}>
            <AlertCircle className="size-3.5" aria-hidden />
            Error sending message. Try again
            <button type="button" aria-label="Try again" onClick={onRetry} className="grid size-5 place-items-center">
              <RefreshCw className="size-3.5" />
            </button>
          </p>
        ) : null}
        {(hover || pinned) && !editing && !branch.failed ? (
          <div className={cn("flex items-center gap-3", right ? "justify-end" : "justify-start")}>
            {right ? null : edited ? (
              <BranchPager count={branchCount} index={branchIndex} onBranch={onBranch} />
            ) : null}
            <div className="flex items-center gap-3 text-grey-700">
              <TinyIcon label="Copy message" onClick={onCopy}>
                <Copy className="size-4" />
              </TinyIcon>
              <TinyIcon label="Edit message" onClick={onEdit}>
                <Pencil className="size-4" />
              </TinyIcon>
              <TinyIcon label="Delete message" onClick={onDelete}>
                <Trash2 className="size-4" />
              </TinyIcon>
            </div>
            {right && edited ? (
              <BranchPager count={branchCount} index={branchIndex} onBranch={onBranch} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BranchPager({
  count,
  index,
  onBranch,
}: {
  count: number;
  index: number;
  onBranch: (index: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs leading-4 text-grey-600">
      <button
        type="button"
        aria-label="Previous branch"
        disabled={index === 0}
        onClick={() => onBranch(index - 1)}
        className="grid size-5 place-items-center disabled:text-grey-300"
      >
        <ChevronLeft className="size-4" />
      </button>
      {index + 1} / {count}
      <button
        type="button"
        aria-label="Next branch"
        disabled={index >= count - 1}
        onClick={() => onBranch(index + 1)}
        className="grid size-5 place-items-center disabled:text-grey-300"
      >
        <ChevronRight className="size-4" />
      </button>
    </span>
  );
}

function TinyIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-5 place-items-center">
      {children}
    </button>
  );
}

function Droplets() {
  return (
    <span className="mt-1 flex items-end gap-1" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <span
          key={index}
          className="inline-block w-2 animate-pulse rounded-t-[40%] rounded-b-full bg-[#c4a574]"
          style={{
            height: 8 + (index % 3) * 4,
            animationDelay: `${index * 90}ms`,
          }}
        />
      ))}
    </span>
  );
}

function AssistantBlock({
  branch,
  onCopy,
  onRegenerate,
  onRetry,
  onClarify,
  onPage,
  onSkip,
  onSomethingElse,
}: {
  branch: Branch;
  onCopy: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onClarify: (choice: string) => void;
  onPage: (page: number) => void;
  onSkip: () => void;
  onSomethingElse: () => void;
}) {
  const assistant = branch.assistant;
  if (!assistant) return null;
  const pages = clarifyPages();
  const page = pages[Math.min(assistant.page, pages.length - 1)];
  const guide = DOCUMENTS.find((doc) => doc.id === "doc-design");
  const showFile = assistant.status === "ready" && /\b(rule|guideline|document)\b/i.test(branch.text);

  if (assistant.status === "loading") {
    return (
      <div>
        <p className="text-base leading-5 text-grey-500">Dreams are taking shape</p>
        <Droplets />
        <span className="sr-only">Thinking</span>
      </div>
    );
  }

  if (assistant.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-[#cc1000] px-3 py-2">
        <AlertCircle className="size-4 shrink-0 text-[#cc1000]" aria-hidden />
        <p className="min-w-0 flex-1 text-sm leading-[18px] text-black">
          Something went wrong. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="h-8 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black"
        >
          Try again
        </button>
      </div>
    );
  }

  if (assistant.status === "clarify" && page) {
    return (
      <section className="rounded-[var(--radius-md)] border border-grey-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base leading-5 font-bold text-black">Clarification questions</h2>
          <span className="inline-flex items-center gap-1 text-xs leading-4 text-grey-600">
            <button
              type="button"
              aria-label="Previous question"
              onClick={() => onPage(assistant.page - 1)}
              className="grid size-5 place-items-center"
            >
              <ChevronLeft className="size-4" />
            </button>
            {assistant.page + 1} of {pages.length}
            <button
              type="button"
              aria-label="Next question"
              onClick={() => onPage(assistant.page + 1)}
              className="grid size-5 place-items-center"
            >
              <ChevronRight className="size-4" />
            </button>
          </span>
        </div>
        <p className="mt-3 text-sm leading-[18px] text-grey-700">{page.title}</p>
        <ul className="mt-2 divide-y divide-grey-75 border-t border-grey-75">
          {page.options.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => onClarify(option)}
                className="flex w-full items-center gap-3 py-3 text-left text-base leading-5 text-black hover:bg-grey-50"
              >
                {page.kind === "multiple" ? (
                  <span className="grid size-6 place-items-center rounded-[4px] border border-grey-300 text-xs" />
                ) : (
                  <span className="grid size-6 place-items-center rounded-full bg-grey-75 text-xs font-bold text-grey-700">
                    {index + 1}
                  </span>
                )}
                {option}
              </button>
            </li>
          ))}
          <li className="flex items-center gap-3 py-3">
            <button
              type="button"
              onClick={onSomethingElse}
              className="flex min-w-0 flex-1 items-center gap-3 text-left text-base leading-5 text-black"
            >
              <span className="grid size-6 place-items-center rounded-[4px] border border-grey-300">
                <Pencil className="size-3.5" aria-hidden />
              </span>
              Something else
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="h-8 rounded-[var(--radius-sm)] border border-grey-200 px-3 text-sm leading-[18px] text-black"
            >
              Skip
            </button>
          </li>
        </ul>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showFile && guide ? (
        <Link
          to={`/documents/${guide.id}`}
          className="relative block size-[180px] overflow-hidden rounded-[var(--radius-sm)] bg-grey-75"
        >
          <span className="grid size-full place-items-center text-grey-500">
            <FileText className="size-8" aria-hidden />
          </span>
          <span className="absolute bottom-2 left-2 rounded-[var(--radius-sm)] bg-white px-1.5 py-0.5 text-[11px] leading-[14px] font-bold text-grey-700">
            PDF
          </span>
        </Link>
      ) : null}
      {assistant.status === "interrupted" ? (
        <div>
          {assistant.text ? <p className="text-base leading-5 text-black">{assistant.text}</p> : null}
          <div className="mt-2 border-t border-[#cc1000] pt-2">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm leading-[18px] text-[#cc1000]">
                <AlertCircle className="size-4" aria-hidden />
                Response was cut off
              </p>
              <button
                type="button"
                onClick={onRegenerate}
                className="h-8 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-base leading-5 text-black whitespace-pre-line">{assistant.text}</p>
          <div className="flex items-center gap-3 text-grey-700">
            <TinyIcon label="Copy reply" onClick={onCopy}>
              <Copy className="size-4" />
            </TinyIcon>
            <TinyIcon label="Read aloud" onClick={() => undefined}>
              <Volume2 className="size-4" />
            </TinyIcon>
            <TinyIcon label="Regenerate" onClick={onRegenerate}>
              <RefreshCw className="size-4" />
            </TinyIcon>
            <span className="text-xs leading-4 text-grey-500">{clock(assistant.at)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function ContextPanel({ attachments }: { attachments: Attachment[] }) {
  const docs = v35FreshDocIds().flatMap((id) => DOCUMENTS.filter((doc) => doc.id === id));
  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 border-grey-100 bg-white p-4 desktop:w-[300px] desktop:border-l desktop:p-5">
      <section>
        <h2 className="text-sm leading-[18px] font-bold text-black">Artifacts</h2>
        {attachments.length === 0 ? (
          <p className="mt-3 text-sm leading-[18px] text-grey-500">No files in this chat yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {attachments.map((file) => (
              <li key={file.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-grey-100 p-2">
                <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-grey-100 text-grey-600">
                  <FileText className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm leading-[18px] font-bold text-black">{file.name}</span>
                  <span className="block text-xs leading-4 text-grey-500">{file.kind}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Copy ${file.name}`}
                  onClick={() => navigator.clipboard?.writeText(file.name)}
                  className="grid size-8 place-items-center text-grey-700"
                >
                  <Copy className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-sm leading-[18px] font-bold text-black">Project Content</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link
                to={`/documents/${doc.id}`}
                className="relative flex h-28 flex-col justify-end rounded-[var(--radius-sm)] bg-grey-75 p-2"
              >
                <FileText className="absolute top-3 left-3 size-5 text-grey-500" aria-hidden />
                <span className="w-fit rounded-[var(--radius-sm)] bg-white px-1.5 py-0.5 text-[11px] leading-[14px] font-bold text-grey-700">
                  PDF
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-4 text-black">{doc.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export function V37Conversation({
  seed,
  name,
}: {
  seed: string;
  name: string;
}) {
  const narrow = useNarrow();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<Attachment | null>(null);
  const [editing, setEditing] = useState<{ turn: string; text: string } | null>(null);
  const [panel, setPanel] = useState(false);
  const [menu, setMenu] = useState(false);
  const [failSend, setFailSend] = useState(false);
  const [failReply, setFailReply] = useState(false);
  const failSendRef = useRef(false);
  const failReplyRef = useRef(false);
  failSendRef.current = failSend;
  failReplyRef.current = failReply;
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const started = useRef(false);

  const busy = turns.some((turn) => turn.branches[turn.active]?.assistant?.status === "loading");

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);

  const finish = (turnId: string, branchId: string, question: string) => {
    const replyFails = failReplyRef.current;
    if (replyFails) {
      failReplyRef.current = false;
      setFailReply(false);
    }
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((turn) => {
          if (turn.id !== turnId) return turn;
          return {
            ...turn,
            branches: turn.branches.map((branch) => {
              if (branch.id !== branchId || branch.assistant?.status !== "loading") return branch;
              if (replyFails) {
                return {
                  ...branch,
                  assistant: { status: "error", text: "", at: Date.now(), page: 0 },
                };
              }
              if (needsChoice(question)) {
                return {
                  ...branch,
                  assistant: { status: "clarify", text: "", at: Date.now(), page: clarifyStart(question) },
                };
              }
              return {
                ...branch,
                assistant: { status: "ready", text: answerFor(question), at: Date.now(), page: 0 },
              };
            }),
          };
        }),
      );
    }, THINK_MS);
  };

  const pushTurn = (text: string, files: Attachment[], failed = false) => {
    const at = Date.now();
    const turnId = `turn-${at}`;
    const branchId = `branch-${at}`;
    const branch: Branch = {
      id: branchId,
      text,
      at,
      failed,
      attachments: files,
      assistant: failed
        ? null
        : { status: "loading", text: "", at, page: 0 },
    };
    setTurns((current) => [...current, { id: turnId, branches: [branch], active: 0 }]);
    if (!failed) finish(turnId, branchId, text);
  };

  const send = (text: string, files: Attachment[] = []) => {
    const question = text.trim();
    if (!question || busy) return;
    const failed = failSendRef.current;
    if (failed) {
      failSendRef.current = false;
      setFailSend(false);
    }
    pushTurn(question, files, failed);
    setDraft("");
    setPendingFile(null);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const file = takeStagedFile();
    if (seed.trim()) send(seed, file ? [file] : []);
    // The opening question is sent once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    setTurns((current) =>
      current.map((turn) => ({
        ...turn,
        branches: turn.branches.map((branch) => {
          if (branch.assistant?.status !== "loading") return branch;
          const full = answerFor(branch.text);
          return {
            ...branch,
            assistant: {
              status: "interrupted",
              text: partialReply(full),
              at: Date.now(),
              page: 0,
            },
          };
        }),
      })),
    );
  };

  const updateBranch = (turnId: string, recipe: (branch: Branch) => Branch) => {
    setTurns((current) =>
      current.map((turn) => {
        if (turn.id !== turnId) return turn;
        return {
          ...turn,
          branches: turn.branches.map((branch, index) =>
            index === turn.active ? recipe(branch) : branch,
          ),
        };
      }),
    );
  };

  const regenerate = (turn: Turn) => {
    const branch = turn.branches[turn.active];
    if (!branch) return;
    updateBranch(turn.id, (row) => ({
      ...row,
      assistant: { status: "loading", text: "", at: Date.now(), page: 0 },
    }));
    finish(turn.id, branch.id, branch.text);
  };

  const title = turns[0]?.branches[0]?.text ?? "New chat";
  const attachments = turns.flatMap((turn) => turn.branches.flatMap((branch) => branch.attachments));
  const empty = turns.length === 0;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* The control stays available when the browser blocks the clipboard. */
    }
  };

  return (
    <div className="relative -mx-4 flex h-[calc(100dvh-3.5rem)] flex-col bg-white tablet:-mx-8 desktop:-mx-8 desktop:h-dvh">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-grey-75 bg-white px-4 desktop:px-6">
        <p className="min-w-0 truncate text-base leading-5 text-black">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Copy conversation"
            onClick={() =>
              copyText(
                turns
                  .map((turn) => {
                    const branch = turn.branches[turn.active];
                    if (!branch) return "";
                    return `${branch.text}\n${branch.assistant?.text ?? ""}`.trim();
                  })
                  .filter(Boolean)
                  .join("\n\n"),
              )
            }
            className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50"
          >
            <Copy className="size-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              aria-label="More"
              aria-expanded={menu}
              onClick={() => setMenu((open) => !open)}
              className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50"
            >
              <MoreVertical className="size-5" />
            </button>
            {menu ? (
              <ul className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[var(--radius-sm)] border border-grey-100 bg-white py-1 shadow-[var(--shadow-light-bg)]">
                <li>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-black hover:bg-grey-50"
                    onClick={() => {
                      setPanel(true);
                      setMenu(false);
                    }}
                  >
                    Documents
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-black hover:bg-grey-50"
                    onClick={() => {
                      setTurns([]);
                      setDraft("");
                      setPanel(false);
                      setMenu(false);
                    }}
                  >
                    New chat
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-black hover:bg-grey-50"
                    onClick={() => {
                      setFailSend(true);
                      setMenu(false);
                    }}
                  >
                    Fail the next message
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-black hover:bg-grey-50"
                    onClick={() => {
                      setFailReply(true);
                      setMenu(false);
                    }}
                  >
                    Show a failed reply
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 desktop:px-10">
            {empty ? (
              <div className="mx-auto flex min-h-full max-w-[1184px] flex-col items-center justify-center gap-6">
                <h1 className="text-center text-[28px] leading-9 font-bold text-black">{greeting(name)}</h1>
                <SuggestedChips
                  starters={V37_STARTERS}
                  onPick={(question) => send(question)}
                  className="justify-center"
                />
                <form
                  className="w-full"
                  onSubmit={(event) => {
                    event.preventDefault();
                    send(draft, pendingFile ? [pendingFile] : []);
                  }}
                >
                  <PromptComposer
                    size="L"
                    value={draft}
                    onChange={setDraft}
                    generating={false}
                    onStop={stop}
                    onAttach={(file) =>
                      setPendingFile({
                        id: `file-${Date.now()}`,
                        name: file.name,
                        kind: fileKind(file),
                        url: URL.createObjectURL(file),
                        image: file.type.startsWith("image/"),
                      })
                    }
                  />
                </form>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[1184px] flex-col gap-6">
                <div className="flex items-center gap-4 text-xs leading-4 text-grey-500">
                  <span className="h-px flex-1 bg-grey-100" />
                  Today
                  <span className="h-px flex-1 bg-grey-100" />
                </div>
                {turns.map((turn) => {
                  const branch = turn.branches[turn.active];
                  if (!branch) return null;
                  return (
                    <div key={turn.id} className="flex flex-col gap-4">
                      <UserBubble
                        branch={branch}
                        align="right"
                        branchCount={turn.branches.length}
                        branchIndex={turn.active}
                        onBranch={(index) =>
                          setTurns((current) =>
                            current.map((row) => (row.id === turn.id ? { ...row, active: index } : row)),
                          )
                        }
                        onCopy={() => copyText(branch.text)}
                        onEdit={() => setEditing({ turn: turn.id, text: branch.text })}
                        onDelete={() => setTurns((current) => current.filter((row) => row.id !== turn.id))}
                        onRetry={() => {
                          updateBranch(turn.id, (row) => ({
                            ...row,
                            failed: false,
                            assistant: { status: "loading", text: "", at: Date.now(), page: 0 },
                          }));
                          finish(turn.id, branch.id, branch.text);
                        }}
                        editing={editing?.turn === turn.id}
                        draft={editing?.turn === turn.id ? editing.text : branch.text}
                        onDraft={(text) => setEditing({ turn: turn.id, text })}
                        onCancelEdit={() => setEditing(null)}
                        onSaveEdit={() => {
                          const nextText = editing?.text.trim() ?? "";
                          setEditing(null);
                          if (!nextText || nextText === branch.text) return;
                          const at = Date.now();
                          const branchId = `branch-${at}`;
                          setTurns((current) =>
                            current.map((row) => {
                              if (row.id !== turn.id) return row;
                              const next: Branch = {
                                id: branchId,
                                text: nextText,
                                at,
                                failed: false,
                                attachments: branch.attachments,
                                assistant: { status: "loading", text: "", at, page: 0 },
                              };
                              return {
                                ...row,
                                branches: [...row.branches, next],
                                active: row.branches.length,
                              };
                            }),
                          );
                          finish(turn.id, branchId, nextText);
                        }}
                      />
                      <AssistantBlock
                        branch={branch}
                        onCopy={() => copyText(branch.assistant?.text ?? "")}
                        onRegenerate={() => regenerate(turn)}
                        onRetry={() => regenerate(turn)}
                        onClarify={(choice) => send(choice)}
                        onPage={(page) => {
                          const last = clarifyPages().length - 1;
                          const next = Math.min(last, Math.max(0, page));
                          updateBranch(turn.id, (row) => ({
                            ...row,
                            assistant: row.assistant ? { ...row.assistant, page: next } : row.assistant,
                          }));
                        }}
                        onSkip={() => {
                          const last = clarifyPages().length - 1;
                          if ((branch.assistant?.page ?? 0) >= last) {
                            updateBranch(turn.id, (row) => ({
                              ...row,
                              assistant: {
                                status: "ready",
                                text: answerFor(row.text),
                                at: Date.now(),
                                page: 0,
                              },
                            }));
                            return;
                          }
                          updateBranch(turn.id, (row) => ({
                            ...row,
                            assistant: row.assistant
                              ? { ...row.assistant, page: row.assistant.page + 1 }
                              : row.assistant,
                          }));
                        }}
                        onSomethingElse={() => inputRef.current?.focus()}
                      />
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>
          {empty ? null : (
            <form
              className="shrink-0 px-4 pt-2 pb-4 desktop:px-10"
              onSubmit={(event) => {
                event.preventDefault();
                send(draft, pendingFile ? [pendingFile] : []);
              }}
            >
              {pendingFile ? (
                <p className="mb-2 text-xs leading-4 text-grey-600">Attached: {pendingFile.name}</p>
              ) : null}
              <PromptComposer
                size={narrow ? "mobile" : "L"}
                value={draft}
                onChange={setDraft}
                generating={busy}
                onStop={stop}
                fieldRef={inputRef}
                onAttach={(file) =>
                  setPendingFile({
                    id: `file-${Date.now()}`,
                    name: file.name,
                    kind: fileKind(file),
                    url: URL.createObjectURL(file),
                    image: file.type.startsWith("image/"),
                  })
                }
              />
            </form>
          )}
        </div>
        {panel ? (
          narrow ? (
            <div className="absolute inset-0 z-10 bg-white">
              <button type="button" className="px-4 py-3 text-sm font-bold text-purple-600" onClick={() => setPanel(false)}>
                Close
              </button>
              <ContextPanel attachments={attachments} />
            </div>
          ) : (
            <ContextPanel attachments={attachments} />
          )
        ) : null}
      </div>
    </div>
  );
}
