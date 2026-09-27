import Scramble from "@/components/motion/Scramble";
import Link from "next/link";

interface Props {
  title: string;
  /** Mono index label above the title, e.g. "03 / EXPERIENCE". */
  label?: string;
  href?: string;
  linkText?: string;
  external?: boolean;
}

export default function SectionHeading({ title, label, href, linkText, external }: Props) {
  return (
    <div className="mb-5">
      {label && <Scramble text={label} className="mb-2 block" />}
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display-md text-[1.75rem] sm:text-[2.1rem]">{title}</h2>
        {href && linkText && (
          <Link
            href={href}
            className="link text-sm"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {linkText}
          </Link>
        )}
      </div>
    </div>
  );
}
