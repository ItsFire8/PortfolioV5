"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { SiteConfig, WidgetInstance } from "@/lib/config/schema";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/hooks/use-i18n";
import { WidgetFrame } from "./widget-frame";

function SortableWidget(props: { widget: WidgetInstance; config: SiteConfig; isOwner: boolean; bento: boolean; mobileOrder?: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.widget.id });
  return (
    <WidgetFrame
      ref={setNodeRef}
      {...props}
      editMode
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.35 : undefined }}
      dragHandle={{ ...attributes, ...listeners }}
    />
  );
}

export function WidgetGrid({
  widgets,
  config,
  isOwner,
  editMode,
  single,
  className,
}: {
  widgets: WidgetInstance[];
  config: SiteConfig;
  isOwner: boolean;
  editMode: boolean;
  single?: boolean;
  className?: string;
}) {
  const t = useT();
  const moveWidget = useConfigStore((s) => s.moveWidget);
  const openAdd = useUIStore((s) => s.setAddWidgetOpen);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const bento = config.layout.template === "bento";
  const mobileOrder = useMemo(() => {
    if (!config.layout.mobile.customOrder) return undefined;
    return new Map(config.layout.mobile.order.map((id, i) => [id, i + 1]));
  }, [config.layout.mobile]);

  const gridClass = cn("widget-grid", bento && "bento", single && "single", mobileOrder && "mobile-ordered", className);

  if (!editMode)
    return (
      <div className={gridClass}>
        {widgets.map((w) => (
          <WidgetFrame key={w.id} widget={w} config={config} isOwner={isOwner} editMode={false} bento={bento} mobileOrder={mobileOrder?.get(w.id) ?? 999} />
        ))}
      </div>
    );

  const onStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (e.over && e.active.id !== e.over.id) moveWidget(String(e.active.id), String(e.over.id));
  };
  const active = widgets.find((w) => w.id === activeId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActiveId(null)}>
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className={gridClass}>
          {widgets.map((w) => (
            <SortableWidget key={w.id} widget={w} config={config} isOwner={isOwner} bento={bento} mobileOrder={mobileOrder?.get(w.id) ?? 999} />
          ))}
          <div className="widget-cell" style={{ ["--w" as string]: 1, ["--mw" as string]: 2 }}>
            <button
              onClick={() => openAdd(true)}
              className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong text-sm font-medium text-muted transition hover:border-primary hover:bg-primary-soft hover:text-primary"
            >
              <Plus className="size-5" /> {t.widgets.add}
            </button>
          </div>
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? (
          <div className="pointer-events-none" style={{ width: "100%" }}>
            <WidgetFrame widget={active} config={config} isOwner={isOwner} editMode bento={bento} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
