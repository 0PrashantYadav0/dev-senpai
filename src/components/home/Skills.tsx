import profile from "@/data/profile.json";

export default function Skills() {
  return (
    <dl className="divide-y">
      {profile.skills.map((s) => (
        <div
          key={s.group}
          className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6"
        >
          <dt className="text-sm font-medium">{s.group}</dt>
          <dd className="text-sm leading-relaxed text-muted-foreground">
            {s.items.join(", ")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
