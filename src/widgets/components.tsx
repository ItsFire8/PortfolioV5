"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { WidgetProps } from "./types";

const loading = () => <div className="h-full min-h-16 animate-pulse rounded-ui bg-surface-2" aria-busy />;
const d = (f: () => Promise<{ default: ComponentType<WidgetProps<never>> }>) => dynamic(f as never, { loading }) as ComponentType<WidgetProps>;

/** Lazy-loaded widget components – each widget ships as its own chunk. */
export const WIDGET_COMPONENTS: Record<string, ComponentType<WidgetProps>> = {
  greeting: d(() => import("./greeting")),
  profile: d(() => import("./profile")),
  about: d(() => import("./about")),
  resume: d(() => import("./resume")),
  skills: d(() => import("./skills")),
  projects: d(() => import("./projects")),
  social: d(() => import("./social")),
  links: d(() => import("./links")),
  search: d(() => import("./search")),
  clock: d(() => import("./clock")),
  weather: d(() => import("./weather")),
  calendar: d(() => import("./calendar")),
  notes: d(() => import("./notes")),
  todo: d(() => import("./todo")),
  rss: d(() => import("./rss")),
  gallery: d(() => import("./gallery")),
  quote: d(() => import("./quote")),
  countdown: d(() => import("./countdown")),
  contact: d(() => import("./contact")),
  custom: d(() => import("./custom")),
};
