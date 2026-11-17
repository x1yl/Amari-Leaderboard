import { avatarGradient } from "@/lib/avatar";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
};

interface PlayerAvatarProps {
  id: string;
  username: string;
  size?: keyof typeof sizes;
  className?: string;
}

/**
 * Amari's API does not expose avatars. A deterministic, local avatar keeps
 * identity stable and avoids sending user IDs to a third-party avatar service.
 */
export function PlayerAvatar({
  id,
  username,
  size = "md",
  className,
}: PlayerAvatarProps) {
  const gradient = avatarGradient(id);

  return (
    <div
      role="img"
      aria-label={`${username}'s avatar`}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold tracking-wide ring-1 ring-white/10",
        sizes[size],
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        color: gradient.foreground,
      }}
    >
      <span className="relative z-10 drop-shadow-sm">{formatInitials(username)}</span>
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent opacity-60" />
    </div>
  );
}
