"use client";

import { useChat, type Message } from "ai/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ProviderChoice = "auto" | "groq" | "gemini" | "openai";

export interface ProviderOption {
  id: "groq" | "gemini" | "openai";
  label: string;
  model: string;
  configured: boolean;
  retryAfterMs: number;
}

export interface AnswerMeta {
  provider?: string;
  model?: string;
  cached?: boolean;
  fallback?: string;
}

interface ChatState {
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | undefined;
  meta: Record<string, AnswerMeta>;
  provider: ProviderChoice;
  providers: ProviderOption[];
  isOpen: boolean;
  setInput: (value: string) => void;
  setProvider: (value: ProviderChoice) => void;
  submit: () => void;
  ask: (question: string) => void;
  clear: () => void;
  stop: () => void;
  open: () => void;
  close: () => void;
}

const ChatContext = createContext<ChatState | null>(null);

export function useChatbot(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatbot must be used inside ChatProvider");
  return ctx;
}

const PROVIDER_KEY = "dev-senpai:provider";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<ProviderChoice>("auto");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [meta, setMeta] = useState<Record<string, AnswerMeta>>({});
  const [isOpen, setIsOpen] = useState(false);
  const pendingMeta = useRef<AnswerMeta | null>(null);

  // Restore the visitor's provider choice.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROVIDER_KEY);
      if (saved === "groq" || saved === "gemini" || saved === "openai" || saved === "auto") {
        setProviderState(saved);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Which providers have keys on the server.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { providers?: ProviderOption[] } | null) => {
        if (!cancelled && data?.providers) setProviders(data.providers);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setProvider = useCallback((value: ProviderChoice) => {
    setProviderState(value);
    try {
      localStorage.setItem(PROVIDER_KEY, value);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const chat = useChat({
    streamProtocol: "text",
    body: { provider },
    onResponse(response) {
      pendingMeta.current = {
        provider: response.headers.get("X-Chat-Provider") ?? undefined,
        model: response.headers.get("X-Chat-Model") ?? undefined,
        cached: response.headers.get("X-Chat-Cache") === "hit",
        fallback: response.headers.get("X-Chat-Fallback") ?? undefined,
      };
    },
    onFinish(message) {
      const m = pendingMeta.current;
      pendingMeta.current = null;
      if (m) setMeta((prev) => ({ ...prev, [message.id]: m }));
    },
  });

  const { append, setMessages, setInput, handleSubmit, stop } = chat;

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q) return;
      setIsOpen(true);
      void append({ role: "user", content: q }, { body: { provider } });
    },
    [append, provider],
  );

  const submit = useCallback(() => {
    handleSubmit(undefined, { body: { provider } });
  }, [handleSubmit, provider]);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
    setMeta({});
  }, [setMessages, stop]);

  const value = useMemo<ChatState>(
    () => ({
      messages: chat.messages,
      input: chat.input,
      isLoading: chat.isLoading,
      error: chat.error,
      meta,
      provider,
      providers,
      isOpen,
      setInput,
      setProvider,
      submit,
      ask,
      clear,
      stop,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [
      chat.messages,
      chat.input,
      chat.isLoading,
      chat.error,
      meta,
      provider,
      providers,
      isOpen,
      setInput,
      setProvider,
      submit,
      ask,
      clear,
      stop,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
