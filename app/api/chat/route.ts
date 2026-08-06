import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // use "edge" once you drop Prisma or switch to an edge-compatible client

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(8000),
    })
  ),
  chatId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response("Invalid request", { status: 400 });
  }

  const { messages } = parsed.data;

  // Basic guard rails — swap for real auth + per-user rate limiting in production
  if (!process.env.GEMINI_API_KEY) {
    return new Response("Server missing GEMINI_API_KEY", { status: 500 });
  }

  // Gemini expects role "model" instead of "assistant", and each message
  // as { role, parts: [{ text }] } instead of { role, content }.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction:
        "You are a helpful, concise assistant inside a web app. Answer directly.",
      maxOutputTokens: 1024,
    },
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullText = "";
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();

      // Optional: persist the exchange once streaming is done
      try {
        await prisma.message.createMany({
          data: [
            {
              chatId: parsed.data.chatId ?? null,
              role: "user",
              content: messages[messages.length - 1].content,
            },
            {
              chatId: parsed.data.chatId ?? null,
              role: "assistant",
              content: fullText,
            },
          ],
        });
      } catch {
        // Don't fail the response if logging fails — just skip persistence
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
