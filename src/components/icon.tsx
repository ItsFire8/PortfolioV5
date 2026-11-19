"use client";

import {
  AtSign, BookOpen, BookUser, Bookmark, BriefcaseBusiness, Calendar, CalendarDays, Camera, ChartBar, Clock3, Cloud, CloudSun, Code2,
  Coffee, Compass, Cpu, Database, Download, FileText, Film, Flame, FolderKanban, Gamepad2, Gift, Globe, GraduationCap, Hand, Heart,
  Home, Images, Inbox, Key, Laptop, Layers, Leaf, Lightbulb, Link, ListTodo, Lock, Mail, Map, MapPin, MessageCircle, Mic, Monitor,
  Moon, Music, Newspaper, NotebookPen, Package, Palette, PenTool, Phone, Plane, Puzzle, Quote, Rocket, Rss, Search, Server, Settings,
  ShoppingBag, Smartphone, Sparkles, Star, Sun, Terminal, Timer, Trophy, Tv, UserRound, Users, Video, Wallet, Wifi, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";

/** Curated icon set (keeps the bundle small – importing all of lucide would not). */
export const ICONS: Record<string, LucideIcon> = {
  AtSign, BookOpen, BookUser, Bookmark, BriefcaseBusiness, Calendar, CalendarDays, Camera, ChartBar, Clock3, Cloud, CloudSun, Code2,
  Coffee, Compass, Cpu, Database, Download, FileText, Film, Flame, FolderKanban, Gamepad2, Gift, Globe, GraduationCap, Hand, Heart,
  Home, Images, Inbox, Key, Laptop, Layers, Leaf, Lightbulb, Link, ListTodo, Lock, Mail, Map, MapPin, MessageCircle, Mic, Monitor,
  Moon, Music, Newspaper, NotebookPen, Package, Palette, PenTool, Phone, Plane, Puzzle, Quote, Rocket, Rss, Search, Server, Settings,
  ShoppingBag, Smartphone, Sparkles, Star, Sun, Terminal, Timer, Trophy, Tv, UserRound, Users, Video, Wallet, Wifi, Wrench, Zap,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className, fallback = "Link" }: { name?: string; className?: string; fallback?: string }) {
  const C = (name && ICONS[name]) || ICONS[fallback] || Link;
  return <C className={className} aria-hidden />;
}
