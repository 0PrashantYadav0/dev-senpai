import { similaritySearch } from "@/lib/vectordb";
import Groq from "groq-sdk";

interface ChatMessage {
    role: string;
    content: string;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages: ChatMessage[] = body.messages;
        const latestMessage = messages[messages.length - 1].content;

        // 1. Retrieve relevant documents
        const results = await similaritySearch(latestMessage, 4);
        const context = results
            .map((doc: { pageContent: string }) => `Page content:\n${doc.pageContent}`)
            .join("\n------\n");

        // 2. Build the system message with context
        const age = new Date().getFullYear() - 2003 - 1;
        const systemMessage =
            "You are Dev Senpai, a friendly chatbot for Prashant's personal developer portfolio website. " +
            "You are trying to convince potential employers to hire Prashant as a software developer. " +
            "Be concise and only answer the user's questions based on the provided context below. " +
            "Provide links to pages that contains relevant information about the topic from the given context. " +
            "Format your messages in markdown. " +
            "IMPORTANT: Never output raw code, JSX syntax, or template expressions. Always use plain human-readable text.\n\n" +
            `Key facts about Prashant:\n` +
            `- Age: ${age} years old\n` +
            `- From: India 🇮🇳\n` +
            `- Enjoys: developing complex applications, instant coffee, Anime\n` +
            `- Frontend: React, Redux, TailwindCSS, Shadcn/UI, Framer Motion\n` +
            `- Backend: Express, NodeJS, Spring Boot, Bun, Deno, Hono, Gin, Chi\n` +
            `- Database: MongoDB, MySQL, PostgreSQL, SQLite, Drizzle, Prisma, Supabase, Firebase, Redis\n` +
            `- Deployment: Vercel, Render, Docker, Kubernetes, ArgoCD, Github Actions, Cloudflare, Railways, Fly.io, AWS, Azure, Cloudinary\n` +
            `- Languages: TypeScript, JavaScript, Java, C++, C, Bash\n\n` +
            (context ? `Context:\n${context}` : "No context available.");

        // 3. Build conversation for Groq
        const groqMessages = [
            { role: "system" as const, content: systemMessage },
            ...messages.map((msg) => ({
                role: (msg.role === "user" ? "user" : "assistant") as
                    | "user"
                    | "assistant",
                content: msg.content,
            })),
        ];

        // 4. Stream response from Groq
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            temperature: 0.3,
            stream: true,
        });

        // 5. Stream the response as plain text
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const text =
                            chunk.choices[0]?.delta?.content || "";
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                    controller.close();
                } catch (err) {
                    console.error("Stream error:", err);
                    controller.error(err);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}