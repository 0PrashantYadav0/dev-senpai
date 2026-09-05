"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowUpRight, Square, X } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";
import ChatMessage from "./ChatMessage";
import ProviderPicker from "./ProviderPicker";
import TypedGreeting from "./TypedGreeting";
import Waveform from "./Waveform";

const SUGGESTIONS = [
  "What did he build at Zomato?",
  "Which projects use Go and Kubernetes?",
  "Tell me about his open source work",
  "Is he open to full-time roles?",
];

interface Props {
  variant: "inline" | "dock";
  className?: string;
}

export default function ChatPanel({ variant, className }: Props) {
  const {
    messages,
    input,
    isLoading,
    error,
    meta,
    setInput,
    submit,
    ask,
    clear,
    stop,
    close,
  } = useChatbot();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    submit();
  };

  const lastIsUser = messages[messages.length - 1]?.role === "user";
  const working = isLoading && lastIsUser;

  return (
    <section
      aria-label="Chat with Dev Senpai"
      className={cn(
        "chat-surface flex flex-col overflow-hidden rounded-xl border text-card-foreground",
        className,
      )}
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Waveform active={working} className="h-5" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">Dev Senpai</p>
          <p className="truncate text-xs text-muted-foreground">
            {working ? "Reading the notes" : "Answers from the resume and project notes"}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Clear
          </button>
        )}
        {variant === "dock" && (
          <button
            type="button"
            onClick={close}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="flex gap-3">
              <Waveform className="mt-1 h-3.5 shrink-0" />
              <TypedGreeting />
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    className="group flex w-full items-start justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] leading-snug transition-colors hover:border-signal hover:bg-signal-soft"
                  >
                    <span>{s}</span>
                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-signal" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="flex flex-col gap-5">
            {messages.map((m) => (
              <li key={m.id}>
                <ChatMessage message={m} meta={meta[m.id]} />
              </li>
            ))}
            {working && (
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Waveform active className="h-3.5" />
                <span>Reading the notes</span>
              </li>
            )}
            {error && (
              <li className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
                <p className="font-medium">That didn&apos;t go through.</p>
                <p className="mt-0.5 text-muted-foreground">
                  {friendlyError(error.message)}
                </p>
              </li>
            )}
          </ol>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t p-2.5">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-1.5 rounded-full border bg-background/60 py-1 pl-4 pr-1 transition-colors focus-within:border-signal"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about his work, stack, or projects"
            aria-label="Your question"
            maxLength={1000}
            autoComplete="off"
            className="h-8 min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generating"
              className="inline-flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground"
            >
              <Square className="size-3 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="inline-flex size-8 items-center justify-center rounded-full bg-signal text-background transition-opacity disabled:opacity-25"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </form>
        <ProviderPicker className="self-end" />
      </div>
    </section>
  );
}

function friendlyError(message: string): string {
  const m = message.trim();
  if (!m || /failed to fetch|network/i.test(m)) {
    return "Check your connection and send it again.";
  }
  return m.length > 240 ? m.slice(0, 240) + "…" : m;
}
