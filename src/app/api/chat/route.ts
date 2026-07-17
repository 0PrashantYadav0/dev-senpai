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

        // 1. Retrieve relevant documents (hybrid dense + sparse, MMR-reranked)
        const results = await similaritySearch(latestMessage, 6);
        const context = results
            .map((doc, i) => {
                const src = (doc.metadata?.source as string) ?? "";
                const title = (doc.metadata?.title as string) ?? "";
                const header = [title, src && `page: ${src}`]
                    .filter(Boolean)
                    .join(" | ");
                return `[Source ${i + 1}${header ? ` - ${header}` : ""}]\n${doc.pageContent}`;
            })
            .join("\n\n------\n\n");

        // 2. Build the system message with context
        const age = new Date().getFullYear() - 2003 - 1;
        const systemMessage =
            "You are Dev Senpai, a warm, sharp assistant on Prashant's personal developer portfolio. " +
            "Your job is to help visitors (often recruiters or engineers) understand Prashant's work and gently make the case that he's a strong hire. " +
            "Answer ONLY from the provided context and the key facts below. If the context does not contain the answer, say so honestly and suggest where they might look (for example the projects or experience page) rather than inventing details. " +
            "Write like a helpful human: natural, concise, and conversational - a few sentences or a short bullet list, never a wall of text. " +
            "When something maps to a page in the context, link to it in markdown (for example [projects](/projects), [experience](/experience), [resume](/resume.pdf), [contact](/contact)). " +
            "Never dump the raw context, never output code, JSX, or template expressions - just clear human-readable prose in markdown.\n\n" +
            `Key facts about Prashant:\n` +
            `- Age: ${age} years old, based in India\n` +
            `- Focus: complex, high-performance systems - voice AI, Go microservices, full-stack apps, cloud-native infra\n` +
            `- Enjoys: building ambitious things, instant coffee, Anime\n` +
            `- Frontend: React, Next.js, Redux, TailwindCSS, Shadcn/UI, Framer Motion\n` +
            `- Backend: Go (Gin, Chi), Node.js, Express, Spring Boot, Bun, Deno, Hono\n` +
            `- Database: MongoDB, MySQL, PostgreSQL, SQLite, Drizzle, Prisma, Supabase, Firebase, Redis\n` +
            `- DevOps: Docker, Kubernetes, ArgoCD, GitHub Actions, AWS, Azure, Vercel, Render, Cloudflare, Fly.io, Railway\n` +
            `- AI/GenAI: LLM integration, RAG, voice bots (NLU/TTS/STT/VAD), Groq, OpenAI, Gemini, Deepgram, Elevenlabs, Cerebras\n` +
            `- Languages: TypeScript, JavaScript, Go, Java, C++, C, Python, Bash\n\n` +
            (context ? `Context (retrieved from the site):\n${context}` : "No context was retrieved for this question.");

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