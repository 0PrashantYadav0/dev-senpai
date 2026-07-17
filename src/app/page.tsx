import LinkWithIcon from "@/components/LinkWithIcon";
import HeroSpline from "@/components/HeroSpline";
import Projects from "@/components/Projects";
import Socials from "@/components/Socials";
import WorkPreview from "@/components/WorkPreview";
import { Button } from "@/components/ui/Button";
import { ArrowDownRight, ArrowRightIcon, FileDown } from "lucide-react";
import Link from "next/link";

const DOB = 2003;
const LIMIT = 2; // max show 2

export default function Home() {
  return (
    <article className="mt-8 flex flex-col gap-16 pb-16">
      <section className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-3 duration-700 md:flex-row-reverse md:items-center md:justify-between md:gap-8">
        <HeroSpline />
        <div className="flex flex-col">
          <h1 className="title text-5xl">hi, prashant here</h1>
          <p className="mt-4 max-w-xl font-light text-muted-foreground">
            {new Date().getFullYear() - DOB - 1}-year-old software developer from
            India. I build complex, high-performance systems — from voice AI
            and Go microservices to full-stack products and cloud-native infra.
          </p>
          <p className="mt-2 max-w-xl font-light text-muted-foreground">
            I like shipping ambitious things, drinking instant coffee, and
            watching{" "}
            <Link
              href="https://www.crunchyroll.com/"
              target="_blank"
              className="link font-semibold text-foreground"
            >
              Anime.
            </Link>
          </p>
          <div className="mt-4 flex items-end gap-1">
            <p className="font-semibold">Ask the chatbot anything about me</p>
            <ArrowDownRight className="size-5 animate-bounce" />
          </div>
          <section className="mt-8 flex items-center gap-8">
            <Link href="/resume.pdf" target="_blank">
              <Button variant="outline">
                <span className="font-semibold">Resume</span>
                <FileDown className="ml-2 size-5" />
              </Button>
            </Link>
            <Socials />
          </section>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex justify-between">
          <h2 className="title text-2xl sm:text-3xl">Experience</h2>
          <LinkWithIcon
            href="/experience"
            position="right"
            icon={<ArrowRightIcon className="size-5" />}
            text="view more"
          />
        </div>
        <WorkPreview />
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex justify-between">
          <h2 className="title text-2xl sm:text-3xl">Featured projects</h2>
          <LinkWithIcon
            href="/projects"
            position="right"
            icon={<ArrowRightIcon className="size-5" />}
            text="view more"
          />
        </div>
        <Projects limit={LIMIT} />
      </section>
    </article>
  );
}
