"use client";

import { Copy, EyeOff, GripVertical, Lock, Minus, MoveDiagonal2, Plus, Settings2, Trash2, Eye } from "lucide-react";
import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { useT, useLocale } from "@/hooks/use-i18n";
import { tl } from "@/lib/i18n";
import type { SiteConfig, WidgetInstance } from "@/lib/config/schema";
import { cn, safeUrl } from "@/lib/utils";
import { useConfigStore, useConfigStoreApi } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { confirmDialog } from "@/components/ui/confirm";
import { getWidgetDefinition } from "@/widgets/definitions";
import { WIDGET_COMPONENTS } from "@/widgets/components";
import { Icon } from "@/components/icon";
import { PinnedStory, Reveal, SlideTitle, useMotionOK } from "@/components/editorial/scroll-fx";

export const widgetTitle = (w: WidgetInstance, locale: "de" | "en") => w.title || tl(getWidgetDefinition(w.type)?.name, locale);

interface Props {
  widget: WidgetInstance;
  config: SiteConfig;
  editMode: boolean;
  isOwner: boolean;
  bento?: boolean;
  style?: CSSProperties;
  dragHandle?: HTMLAttributes<HTMLButtonElement>;
  dragging?: boolean;
  mobileOrder?: number;
  index?: number;
  total?: number;
}

function ToolbarButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn("grid size-7 place-items-center rounded-[7px] text-muted transition hover:bg-surface-3 hover:text-fg [&_svg]:size-3.5", danger && "hover:bg-red-500/10 hover:text-red-500")}
    >
      {children}
    </button>
  );
}

export const WidgetFrame = forwardRef<HTMLDivElement, Props>(function WidgetFrame({ widget, config, editMode, isOwner, bento, style, dragHandle, dragging, mobileOrder, index, total }, ref) {
  const t = useT();
  const locale = useLocale();
  const store = useConfigStore();
  const storeApi = useConfigStoreApi();
  const setEditing = useUIStore((s) => s.setEditingWidget);
  const cellRef = useRef<HTMLDivElement | null>(null);
  const def = getWidgetDefinition(widget.type);
  const Comp = WIDGET_COMPONENTS[widget.type];
  const motionOK = useMotionOK();
  if (!def || !Comp) return null;
  const cardStyle = widget.style === "inherit" ? config.appearance.cardStyle : widget.style;
  const title = widgetTitle(widget, locale);
  const portfolio = config.layout.template === "portfolio";

  const resizeBy = (dw: number, dh: number) =>
    store.updateWidget(widget.id, {
      size: { w: Math.min(6, Math.max(1, widget.size.w + dw)), h: Math.min(6, Math.max(1, widget.size.h + dh)) },
    });

  // Pointer-based resize: snaps to grid columns / rows.
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cell = cellRef.current;
    const grid = cell?.parentElement;
    if (!cell || !grid) return;
    const gs = getComputedStyle(grid);
    const cols = gs.gridTemplateColumns.split(" ").length;
    const gap = parseFloat(gs.columnGap) || 0;
    const colW = (grid.clientWidth - gap * (cols - 1)) / cols;
    const rowH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-h")) || 140;
    const start = { x: e.clientX, y: e.clientY, w: widget.size.w, h: widget.size.h };
    const move = (ev: PointerEvent) => {
      const w = Math.min(cols, Math.max(1, start.w + Math.round((ev.clientX - start.x) / (colW + gap))));
      const h = Math.min(6, Math.max(1, start.h + Math.round((ev.clientY - start.y) / (rowH + gap))));
      const cur = storeApi.getState().config.widgets.find((x) => x.id === widget.id)?.size;
      if (cur && (cur.w !== w || cur.h !== h)) store.updateWidget(widget.id, { size: { w, h } });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "nwse-resize";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const toolbar = editMode ? (
              <div className="no-print -my-1 -mr-2 flex items-center gap-0.5 rounded-[9px] border border-border bg-surface-solid/80 p-0.5 shadow-sm">
                {widget.visibility === "private" && <Lock className="mx-1 size-3.5 text-amber-500" aria-label={t.common.private} />}
                <button
                  type="button"
                  {...dragHandle}
                  title={t.widgets.dragHint}
                  aria-label={t.widgets.dragHint}
                  className="grid size-7 cursor-grab touch-none place-items-center rounded-[7px] text-muted hover:bg-surface-3 hover:text-fg active:cursor-grabbing [&_svg]:size-3.5"
                >
                  <GripVertical />
                </button>
                <span className="hidden items-center sm:flex">
                  <ToolbarButton label={`${t.widgets.width} −`} onClick={() => resizeBy(-1, 0)}>
                    <Minus />
                  </ToolbarButton>
                  <span className="tabular w-8 text-center text-[0.65rem] text-muted">
                    {widget.size.w}×{widget.size.h}
                  </span>
                  <ToolbarButton label={`${t.widgets.width} +`} onClick={() => resizeBy(1, 0)}>
                    <Plus />
                  </ToolbarButton>
                </span>
                <ToolbarButton label={widget.enabled ? t.widgets.hide : t.widgets.show} onClick={() => store.updateWidget(widget.id, { enabled: !widget.enabled })}>
                  {widget.enabled ? <EyeOff /> : <Eye />}
                </ToolbarButton>
                <ToolbarButton label={t.common.duplicate} onClick={() => store.duplicateWidget(widget.id)}>
                  <Copy />
                </ToolbarButton>
                <ToolbarButton label={t.widgets.configure} onClick={() => setEditing(widget.id)}>
                  <Settings2 />
                </ToolbarButton>
                <ToolbarButton
                  danger
                  label={t.common.remove}
                  onClick={async () => {
                    if (await confirmDialog({ title: t.widgets.removeConfirm, message: title, danger: true, confirmLabel: t.common.remove, cancelLabel: t.common.cancel }))
                      store.removeWidget(widget.id);
                  }}
                >
                  <Trash2 />
                </ToolbarButton>
              </div>
  ) : null;

  const content = <Comp widget={widget} config={config} locale={locale} isOwner={isOwner} editMode={editMode} />;
  const setRef = (el: HTMLDivElement | null) => {
    cellRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  // Editorial template: numbered full-width sections – index | large title | content.
  if (config.layout.template === "editorial") {
    const wide = widget.size.w >= 3 || !widget.showTitle;
    const ed = config.layout.editorial;
    const fx = ed.scrollEffects && motionOK && !editMode && !dragging;
    const story = ((widget.settings.images as { src?: string; caption?: string; alt?: string }[] | undefined) ?? []).filter((i) => safeUrl(i.src));
    // Gallery becomes a pinned, full-bleed image story while scrolling.
    if (fx && widget.type === "gallery" && story.length) {
      return (
        <div ref={setRef} id={`w-${widget.id}`} className="widget-cell relative" data-mobile-hidden={widget.mobile.hidden} style={style}>
          <PinnedStory images={story} label={title} />
        </div>
      );
    }
    return (
      <div ref={setRef} id={`w-${widget.id}`} className={cn("widget-cell relative scroll-mt-16", dragging && "z-50")} data-mobile-hidden={widget.mobile.hidden} style={style}>
        <section
          aria-labelledby={widget.showTitle ? `t-${widget.id}` : undefined}
          aria-label={widget.showTitle ? undefined : title}
          data-style={cardStyle}
          className={cn("card ed-grid gap-y-8 py-14 sm:py-20", editMode && "edit-outline", editMode && !widget.enabled && "opacity-45", dragging && "dragging-overlay bg-bg")}
        >
          <div className="col-span-8 flex items-start justify-between gap-3 lg:col-span-1">
            {ed.sectionNumbers && index !== undefined && total ? (
              <span className="tabular text-sm">
                {String(index + 1).padStart(2, "0")} <span className="text-muted">| {String(total).padStart(2, "0")}</span>
              </span>
            ) : (
              <span />
            )}
            {isOwner && !editMode && widget.visibility === "private" && <Lock className="size-3.5 text-subtle" aria-label={t.common.private} />}
          </div>
          {(widget.showTitle || editMode) && (
            <header className={cn("col-span-8 flex items-start justify-between gap-4", wide ? "lg:col-span-7" : "lg:col-span-3")}>
              {widget.showTitle ? (
                fx ? (
                  <SlideTitle id={`t-${widget.id}`} className="ed-section-title min-w-0 font-heading text-5xl sm:text-6xl xl:text-7xl">
                    {title}
                  </SlideTitle>
                ) : (
                  <h2 id={`t-${widget.id}`} className="ed-section-title min-w-0 font-heading text-5xl sm:text-6xl xl:text-7xl">
                    {title}
                  </h2>
                )
              ) : (
                <span className="text-xs text-subtle">{title}</span>
              )}
              {toolbar}
            </header>
          )}
          <div className={cn("col-span-8 min-w-0", wide ? "lg:col-span-7 lg:col-start-2" : "lg:col-span-4 lg:col-start-5")}>{fx ? <Reveal>{content}</Reveal> : content}</div>
        </section>
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        cellRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      id={`w-${widget.id}`}
      className={cn("widget-cell group/cell relative scroll-mt-24", dragging && "z-50")}
      data-mobile-hidden={widget.mobile.hidden}
      style={
        {
          ...style,
          "--w": widget.size.w,
          "--h": widget.size.h,
          "--mw": widget.mobile.w,
          "--mo": mobileOrder ?? 0,
        } as CSSProperties
      }
    >
      <section
        aria-labelledby={widget.showTitle ? `t-${widget.id}` : undefined}
        aria-label={widget.showTitle ? undefined : title}
        data-style={cardStyle}
        className={cn(
          "card flex h-full flex-col",
          portfolio ? "p-6 sm:p-8" : "p-5",
          editMode && "edit-outline",
          editMode && !widget.enabled && "opacity-45",
          dragging && "dragging-overlay",
        )}
      >
        {(widget.showTitle || editMode) && (
          <header className={cn("mb-4 flex min-h-7 items-center gap-2", !widget.showTitle && "mb-2")}>
            {widget.showTitle && (
              <h2 id={`t-${widget.id}`} className={cn("min-w-0 flex-1 truncate font-heading font-semibold", portfolio ? "text-xl" : "text-[0.95rem]")}>
                {title}
              </h2>
            )}
            {!widget.showTitle && <span className="flex-1 truncate text-xs font-medium text-subtle">{title}</span>}
            {isOwner && !editMode && widget.visibility === "private" && <Lock className="size-3.5 text-subtle" aria-label={t.common.private} />}
            {toolbar}
          </header>
        )}
        <div className={cn("relative min-h-0 flex-1", bento && "overflow-y-auto")}>
          {content}
        </div>
        {editMode && (
          <button
            type="button"
            onPointerDown={startResize}
            className="no-print absolute bottom-1 right-1 hidden size-6 cursor-nwse-resize place-items-center rounded-[6px] text-subtle hover:bg-surface-3 hover:text-fg md:grid"
            aria-label={t.widgets.resize}
            title={t.widgets.resize}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") resizeBy(1, 0);
              if (e.key === "ArrowLeft") resizeBy(-1, 0);
              if (e.key === "ArrowDown") resizeBy(0, 1);
              if (e.key === "ArrowUp") resizeBy(0, -1);
            }}
          >
            <MoveDiagonal2 className="size-3.5" />
          </button>
        )}
      </section>
      {editMode && def.external && widget.enabled && (
        <span className="pointer-events-none absolute -top-2 left-4 rounded-full bg-amber-500 px-2 py-0.5 text-[0.6rem] font-semibold text-black" title={tl(def.external, locale)}>
          <Icon name="Globe" className="mr-1 inline size-2.5" />
          {t.widgets.externalNote}
        </span>
      )}
    </div>
  );
});
