import profile from "@/data/profile.json";

export default function Achievements() {
  return (
    <ul className="flex flex-col divide-y">
      {profile.achievements.map((a) => (
        <li key={a.title} className="py-2.5 first:pt-0">
          <p className="text-sm font-medium leading-snug">{a.title}</p>
          {a.detail && (
            <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
