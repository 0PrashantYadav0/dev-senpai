import AchievementsList from "@/components/motion/AchievementsList";
import profile from "@/data/profile.json";

export default function Achievements() {
  return <AchievementsList items={profile.achievements} />;
}
