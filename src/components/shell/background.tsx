"use client";

import { safeUrl } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";

export function Background() {
  const bg = useConfigStore((s) => s.config.appearance.background);
  const overlay = <div className="absolute inset-0" style={{ background: "var(--bg-overlay)" }} />;
  const blur = bg.blur ? { filter: `blur(${bg.blur}px)`, transform: "scale(1.06)" } : undefined;

  switch (bg.type) {
    case "gradient":
      return (
        <div className="bg-layer" aria-hidden>
          <div className="absolute inset-0" style={{ background: `linear-gradient(var(--g-angle), var(--g-from), var(--g-via), var(--g-to))` }} />
          {overlay}
        </div>
      );
    case "image": {
      const url = safeUrl(bg.image);
      return (
        <div className="bg-layer" aria-hidden>
          {url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${url.replace(/"/g, "%22")}")`, ...blur }} />}
          {overlay}
        </div>
      );
    }
    case "video": {
      const url = safeUrl(bg.video);
      return (
        <div className="bg-layer" aria-hidden>
          {url && <video key={url} src={url} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 size-full object-cover" style={blur} />}
          {overlay}
        </div>
      );
    }
    case "animated":
      return (
        <div className={`bg-layer anim-${bg.animated}`} aria-hidden>
          {(bg.animated === "aurora" || bg.animated === "orbs") && (
            <>
              <div className="blob" />
              <div className="blob" />
              <div className="blob" />
            </>
          )}
          {overlay}
        </div>
      );
    default:
      return null;
  }
}
