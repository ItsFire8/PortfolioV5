"use client";

import {
  siBehance, siBluesky, siDevdotto, siDiscord, siDribbble, siFacebook, siFigma, siGithub, siGitlab, siInstagram, siKofi, siMastodon,
  siMatrix, siMedium, siPatreon, siPinterest, siReddit, siSignal, siSpotify, siStackoverflow, siSteam, siTelegram, siThreads, siTiktok,
  siTwitch, siWhatsapp, siX, siXing, siYoutube,
} from "simple-icons";
import { Briefcase, Globe, Mail, Rss } from "lucide-react";

const BRANDS: Record<string, { path: string; title: string; hex: string }> = {
  github: siGithub, gitlab: siGitlab, x: siX, mastodon: siMastodon, bluesky: siBluesky, threads: siThreads, instagram: siInstagram,
  facebook: siFacebook, youtube: siYoutube, twitch: siTwitch, tiktok: siTiktok, discord: siDiscord, telegram: siTelegram,
  whatsapp: siWhatsapp, signal: siSignal, matrix: siMatrix, reddit: siReddit, stackoverflow: siStackoverflow, devto: siDevdotto,
  medium: siMedium, dribbble: siDribbble, behance: siBehance, figma: siFigma, xing: siXing, spotify: siSpotify, steam: siSteam,
  pinterest: siPinterest, kofi: siKofi, patreon: siPatreon,
};

export const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn", email: "E-Mail", website: "Website", rss: "RSS", x: "X", devto: "DEV", kofi: "Ko-fi", stackoverflow: "Stack Overflow",
};

export const platformLabel = (p: string) => PLATFORM_LABELS[p] ?? BRANDS[p]?.title ?? p;
export const platformColor = (p: string) => (BRANDS[p] ? `#${BRANDS[p].hex}` : undefined);

export function BrandIcon({ platform, className }: { platform: string; className?: string }) {
  const b = BRANDS[platform];
  if (b)
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={b.path} />
      </svg>
    );
  if (platform === "linkedin")
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.83v1.5h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13v5.43h-4v-4.82c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.9h-4v-11Z" />
      </svg>
    );
  const C = platform === "email" ? Mail : platform === "rss" ? Rss : platform === "website" ? Globe : Briefcase;
  return <C className={className} aria-hidden />;
}
