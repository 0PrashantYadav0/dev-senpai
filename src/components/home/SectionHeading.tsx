import Link from "next/link";

interface Props {
  title: string;
  href?: string;
  linkText?: string;
  external?: boolean;
}

export default function SectionHeading({ title, href, linkText, external }: Props) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 className="display-md text-2xl sm:text-[1.6rem]">{title}</h2>
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
  );
}
