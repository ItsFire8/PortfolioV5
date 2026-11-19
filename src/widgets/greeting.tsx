"use client";

import { useNow } from "@/hooks/use-now";
import { useT } from "@/hooks/use-i18n";
import { formatDate, hourIn } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "./shared";
import type { WidgetProps } from "./types";

type S = { message: string; showAvatar: boolean; showDate: boolean; style: "large" | "compact" };

export default function Greeting({ widget, config, locale }: WidgetProps<S>) {
  const t = useT();
  const now = useNow(60_000);
  const s = widget.settings;
  const g = config.general;
  const h = now ? hourIn(now, g.timezone) : -1;
  const word = h < 0 ? t.greeting.welcome : h < 5 ? t.greeting.night : h < 11 ? t.greeting.morning : h < 18 ? t.greeting.day : h < 22 ? t.greeting.evening : t.greeting.night;
  const first = g.name.split(" ")[0];
  const large = s.style !== "compact";
  return (
    <div className={cn("flex h-full items-center gap-5", large ? "py-1" : "")}>
      {s.showAvatar && g.avatar && <Avatar src={g.avatar} name={g.name} className={large ? "size-16 sm:size-20" : "size-12"} />}
      <div className="min-w-0">
        {s.showDate && (
          <p className="tabular mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted" suppressHydrationWarning>
            {now ? formatDate(now, { ...g, dateFormat: g.dateFormat === "short" ? "medium" : g.dateFormat }) : " "}
          </p>
        )}
        <h1 className={cn("font-heading font-semibold leading-[1.05] text-fg", large ? "text-3xl sm:text-[2.6rem]" : "text-2xl")}>
          <span className={cn("transition-opacity duration-500", now ? "opacity-100" : "opacity-0")}>{word}</span>
          {first && (
            <>
              {locale === "de" ? ", " : ", "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{first}</span>
            </>
          )}
        </h1>
        {(s.message || g.description) && <p className="mt-2 max-w-prose text-[0.95rem] text-muted">{s.message || g.description}</p>}
      </div>
    </div>
  );
}
