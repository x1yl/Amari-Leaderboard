import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-12 w-12 rounded-2xl text-base",
  lg: "h-16 w-16 rounded-2xl text-xl",
};

interface GuildIconProps {
  name: string | null;
  iconUrl: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function GuildIcon({
  name,
  iconUrl,
  size = "md",
  className,
}: GuildIconProps) {
  if (iconUrl) {
    return (
      // Discord's CDN is the source of truth here; using an <img> keeps the
      // component dependency-free and avoids remote loader configuration.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt={name ? `${name} icon` : "Discord server icon"}
        className={cn(
          "shrink-0 border border-white/10 object-cover",
          sizes[size],
          className
        )}
        loading="eager"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border border-white/10 bg-gradient-to-br from-[#262b45] to-[#11141d] font-bold text-[#b9c0ff]",
        sizes[size],
        className
      )}
    >
      {(name?.trim()?.[0] ?? "D").toUpperCase()}
    </div>
  );
}
