import { cn } from "@/lib/utils/utils";

export function Avatar({ name, hue = 250, size = 32, className }: { name: string; hue?: number; size?: number; className?: string }) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-medium text-white shrink-0 select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, oklch(0.55 0.13 ${hue}), oklch(0.38 0.12 ${hue}))`,
      }}
    >
      {initials}
    </span>
  );
}
