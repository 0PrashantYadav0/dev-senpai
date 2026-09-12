import { Github, Globe, Linkedin, Mail, Server, type LucideProps } from "lucide-react";
import { siX } from "simple-icons";

/**
 * The handful of link icons the data files use, bundled statically so they
 * render on first paint (the old per-name lazy import flashed a grey box).
 * Lucide covers all but X, whose mark comes from simple-icons.
 */
const LUCIDE: Record<string, typeof Github> = {
  github: Github,
  globe: Globe,
  server: Server,
  linkedin: Linkedin,
  mail: Mail,
};

interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

export default function Icon({ name, ...props }: IconProps) {
  if (name === "x") {
    const { className, style, size = 24, "aria-hidden": hidden } = props;
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        style={style}
        aria-hidden={hidden}
      >
        <path d={siX.path} />
      </svg>
    );
  }
  const Lucide = LUCIDE[name];
  return Lucide ? <Lucide {...props} /> : null;
}
