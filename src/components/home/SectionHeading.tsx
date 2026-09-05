import Link from "next/link";

interface Props {
  title: string;
  href?: string;
  linkText?: string;
}

export default function SectionHeading({ title, href, linkText }: Props) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b pb-3">
      <h2 className="display-md text-2xl sm:text-[1.75rem]">{title}</h2>
      {href && linkText && (
        <Link href={href} className="link text-sm">
          {linkText}
        </Link>
      )}
    </div>
  );
}
