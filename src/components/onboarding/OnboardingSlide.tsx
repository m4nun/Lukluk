import Image from "next/image";

interface OnboardingSlideProps {
  imageSrc: string;
  imageAlt: string;
  badge: string;
  badgePosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  badgeColor: string;
  title: string;
  description: string;
  colorScheme: "orange" | "purple" | "cyan" | "green";
}

const colorMap = {
  orange: {
    ring: "border-primary/30",
    bg: "bg-gradient-to-br from-orange-50 to-orange-100",
    badgeBg: "bg-primary text-white",
  },
  purple: {
    ring: "border-purple-400/30",
    bg: "bg-gradient-to-br from-purple-50 to-purple-100",
    badgeBg: "bg-purple-500 text-white",
  },
  cyan: {
    ring: "border-cyan-400/30",
    bg: "bg-gradient-to-br from-cyan-50 to-cyan-100",
    badgeBg: "bg-cyan-500 text-white",
  },
  green: {
    ring: "border-emerald-400/30",
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    badgeBg: "bg-emerald-500 text-white",
  },
} as const;

const badgePositionMap = {
  "top-right": "-top-1 -right-4",
  "top-left": "-top-1 -left-4",
  "bottom-right": "bottom-2 -right-3",
  "bottom-left": "bottom-2 -left-3",
} as const;

export function OnboardingSlide({
  imageSrc,
  imageAlt,
  badge,
  badgePosition,
  badgeColor,
  title,
  description,
  colorScheme,
}: OnboardingSlideProps) {
  const colors = colorMap[colorScheme];

  return (
    <div className="flex flex-col items-center text-center">
      {/* Visual wrapper */}
      <div className="relative mb-6">
        {/* Mockup circle */}
        <div
          className={`slide-mockup relative h-[140px] w-[140px] overflow-hidden rounded-full shadow-lg ${colors.bg}`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="140px"
          />
          {/* Animated ring */}
          <div
            className={`absolute inset-[-6px] rounded-full border-2 border-dashed opacity-25 animate-ring-spin ${colors.ring}`}
          />
        </div>

        {/* Floating badge */}
        <span
          className={`absolute whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold shadow-md animate-badge-float ${badgePositionMap[badgePosition]} ${badgeColor || colors.badgeBg}`}
        >
          {badge}
        </span>
      </div>

      {/* Text */}
      <h2 className="mb-2 text-[20px] font-bold tracking-tight">
        {title}
      </h2>
      <p className="max-w-[260px] text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
