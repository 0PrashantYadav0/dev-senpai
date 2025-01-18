import { getVectorStore } from "@/lib/vectordb";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
    PromptTemplate,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { LangChainStream, Message, StreamingTextResponse } from "ai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body.messages;

        const latestMessage = messages[messages.length - 1].content;

        const { stream, handlers } = LangChainStream();

        const chatModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-pro",
            streaming: true,
            callbacks: [handlers],
            verbose: true,
            temperature: 0,
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
            ],
        });

        const rephraseModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-pro",
            verbose: true,
        });

        const retriever = (await getVectorStore()).asRetriever();

        const chatHistory = messages
            .slice(0, -1)
            .map((msg: Message) =>
                msg.role === "user"
                    ? new HumanMessage(msg.content)
                    : new AIMessage(msg.content),
            );

        const rephrasePrompt = ChatPromptTemplate.fromMessages([
            new MessagesPlaceholder("chat_history"),
            ["user", "{input}"],
            [
                "user",
                "Given the above conversation history, generate a search query to look up information relevant to the current question. " +
                "Do not leave out any relevant keywords. " +
                "Only return the query and no other text. ",
            ],
        ]);

        const historyAwareRetrievalChain = await createHistoryAwareRetriever({
            llm: rephraseModel,
            retriever,
            rephrasePrompt,
        });

        const prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                "You are Dev Senpai, a friendly chatbot for Prashant's personal developer portfolio website. " +
                "You are trying to convince potential employers to hire Prashant as a software developer. " +
                "Be concise and only answer the user's questions based on the provided context below. " +
                "Provide links to pages that contains relevant information about the topic from the given context. " +
                "Format your messages in markdown.\n\n" +
                "Context:\n{context}",
            ],
            new MessagesPlaceholder("chat_history"),
            ["user", "{input}"],
        ]);

        const combineDocsChain = await createStuffDocumentsChain({
            llm: chatModel,
            prompt,
            documentPrompt: PromptTemplate.fromTemplate(
                "Page content:\n{page_content}",
            ),
            documentSeparator: "\n------\n",
        });

        const retrievalChain = await createRetrievalChain({
            combineDocsChain,
            retriever: historyAwareRetrievalChain,
        });

        // Start the chain and return the streaming response
        retrievalChain.invoke({
            input: latestMessage,
            chat_history: chatHistory,
        });

        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}