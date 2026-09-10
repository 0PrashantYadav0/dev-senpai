"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { MessageSquareText } from "lucide-react";
import { useEffect } from "react";
import ChatPanel from "./ChatPanel";

/** The chat lives in a dock in the corner on every page. */
export default function ChatDock() {
  const { isOpen, open, close, messages } = useChatbot();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[24rem] sm:p-0">
          <ChatPanel className="h-[70vh] max-h-[36rem] shadow-2xl shadow-black/30 sm:h-[34rem]" />
        </div>
      )}
      {!isOpen && (
        <button
          type="button"
          onClick={open}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/20 transition-colors hover:border-signal sm:bottom-6 sm:right-6"
        >
          <MessageSquareText className="size-4 text-signal" />
          {messages.length > 0 ? "Back to chat" : "Ask Dev Senpai"}
        </button>
      )}
    </>
  );
}
