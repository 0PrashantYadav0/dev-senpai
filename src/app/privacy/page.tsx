import profile from "@/data/profile.json";
import type { Metadata } from "next";
import Link from "next/link";

const lastUpdated = "September 2026";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site collects, which is very little, and how the chat works.",
};

export default function PrivacyPage() {
  return (
    <article className="prose-page max-w-[68ch] pb-8 pt-10 sm:pt-16">
      <h1 className="display text-4xl sm:text-5xl">Privacy</h1>
      <p>Last updated {lastUpdated}.</p>
      <p>
        This is a personal portfolio. It exists to show work and make it easy
        to get in touch. It does not need much from you, and it does not keep
        much.
      </p>

      <h2>What the site collects</h2>
      <p>
        There are no accounts, no advertising, and no tracking cookies. The
        hosting platform keeps standard server logs (IP address, browser, page
        requested) for a short time to keep the site running.
      </p>

      <h3>Chat messages</h3>
      <p>
        Dev Senpai answers questions about Prashant using retrieval-augmented
        generation over the content of this site. Each message you send, along
        with a few earlier messages from the same conversation, is passed to a
        third-party language model provider to generate the reply. Depending on
        the model you pick, that provider is Groq, Google (Gemini), or OpenAI
        (ChatGPT), and their own privacy terms apply to that request.
      </p>
      <ul>
        <li>Conversations are not stored in a database.</li>
        <li>
          First-turn answers may be cached in server memory for up to 12 hours
          so repeated questions do not use provider quota again. Cached entries
          contain the question and the answer, nothing that identifies you.
        </li>
        <li>
          Your IP address is used only for rate limiting, and only in server
          memory.
        </li>
      </ul>
      <p>Do not put confidential or sensitive information in the chat.</p>

      <h3>Contact form</h3>
      <p>
        When you send a message through the contact form, your name, email
        address, and message are emailed to Prashant through Resend. They are
        used only to reply to you.
      </p>

      <h2>Sharing</h2>
      <p>
        Nothing you send is sold, traded, or shared beyond the providers named
        above, which are needed to deliver the reply or the email.
      </p>

      <h2>Security</h2>
      <p>
        Reasonable measures are in place, and everything is served over HTTPS,
        but no system is perfect. If you shared something by mistake and want
        it removed from an inbox, send an email and it will be deleted.
      </p>

      <h2>Changes</h2>
      <p>
        Any change to this policy is published here with a new date at the top.
      </p>

      <h2>Questions</h2>
      <p>
        Email{" "}
        <a href={`mailto:${profile.email}`}>{profile.email}</a> or use the{" "}
        <Link href="/contact">contact form</Link>.
      </p>
    </article>
  );
}
