"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    // Add an empty assistant message we will stream tokens into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
          };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">My AI App</h1>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-indigo-600 ml-auto text-white"
                : "bg-zinc-800 text-zinc-100"
            }`}
          >
            {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 outline-none focus:border-indigo-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something..."
          disabled={isStreaming}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-md font-medium"
        >
          Send
        </button>
      </div>
    </main>
  );
}
