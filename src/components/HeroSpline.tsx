import Spline from "@splinetool/react-spline/next";

export default function HeroSpline() {
  return (
    <div className="relative h-64 w-64 shrink-0 md:h-80 md:w-60">
      <Spline scene="https://prod.spline.design/Ebp8e0-OVUul2hRd/scene.splinecode" />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-20 w-40 rounded-tl-md bg-background"
      />
    </div>
  );
}
