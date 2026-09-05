"use client";

import type { AnswerMeta } from "@/contexts/ChatContext";
import type { Message } from "ai";
import Link from "next/link";
import Markdown from "react-markdown";
import Waveform from "./Waveform";

interface Props {
  message: Message;
  meta?: AnswerMeta;
}

const LABELS: Record<string, string> = {
  groq: "Groq",
  gemini: "Gemini",
  openai: "ChatGPT",
};

export default function ChatMessage({ message, meta }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end pl-10">
        <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm leading-relaxed">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 pr-6">
      <Waveform className="mt-1 h-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="chat-md text-sm leading-relaxed">
          <Markdown
            components={{
              a: ({ href, children }) => {
                const url = href ?? "";
                const external = /^https?:\/\//.test(url);
                return external ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ) : (
                  <Link href={url}>{children}</Link>
                );
              },
            }}
          >
            {message.content}
          </Markdown>
        </div>
        {meta?.provider && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {meta.cached ? "Answered earlier via " : "via "}
            {LABELS[meta.provider] ?? meta.provider}
            {meta.fallback ? ", your first choice was busy" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
