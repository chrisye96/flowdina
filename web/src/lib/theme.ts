import type { CSSProperties } from "react";
import type { Theme, ColorToken } from "./board";

// The legacy app's default palette, carried over verbatim.
export const DEFAULT_THEME: Theme = {
  banner: { from: "#1d4ed8", to: "#2563eb", text: "#ffffff", badgeBg: "#3b82f6", badgeText: "#ffffff" },
  columns: ["#374151", "#16a34a", "#2563eb", "#6d28d9", "#f59e0b", "#7c3aed"],
  columnText: "#ffffff",
  surface: { page: "#eef1f5", card: "#ffffff", cardBorder: "#e5e7eb" },
  text: { title: "#1f2937", body: "#6b7280", label: "#6b7280", value: "#111827" },
  accent: "#2563eb",
  button: {
    primary: "#2563eb",
    primaryText: "#ffffff",
    outlineBorder: "#d1d5db",
    outlineText: "#374151",
    danger: "#dc2626",
    dangerText: "#ffffff",
  },
  box: { noteBg: "#f9fafb", warnBg: "#fffbeb", warnText: "#b45309", dangerCardBg: "#fff5f5", tagBg: "#ef4444" },
  icon: { gray: "#374151", green: "#16a34a", blue: "#2563eb", indigo: "#6d28d9", amber: "#f59e0b", red: "#dc2626", purple: "#7c3aed" },
};

// Resolve a semantic colour token (or a one-off hex) against the theme.
export function tokenColor(token: ColorToken, theme: Theme): string {
  return typeof token === "object" ? token.hex : theme.icon[token];
}

// Project the theme onto the css custom properties the board styles read.
export function themeVars(theme: Theme): CSSProperties {
  const v: Record<string, string> = {
    "--page-bg": theme.surface.page,
    "--card-bg": theme.surface.card,
    "--card-border": theme.surface.cardBorder,
    "--title-color": theme.text.title,
    "--body-color": theme.text.body,
    "--label-color": theme.text.label,
    "--value-color": theme.text.value,
    "--accent": theme.accent,
    "--banner-from": theme.banner.from,
    "--banner-to": theme.banner.to,
    "--banner-text": theme.banner.text,
    "--badge-bg": theme.banner.badgeBg,
    "--badge-text": theme.banner.badgeText,
    "--col-text": theme.columnText,
    "--btn-primary": theme.button.primary,
    "--btn-primary-text": theme.button.primaryText,
    "--btn-outline-border": theme.button.outlineBorder,
    "--btn-outline-text": theme.button.outlineText,
    "--btn-danger": theme.button.danger,
    "--btn-danger-text": theme.button.dangerText,
    "--note-bg": theme.box.noteBg,
    "--warn-bg": theme.box.warnBg,
    "--warn-text": theme.box.warnText,
    "--danger-card-bg": theme.box.dangerCardBg,
    "--tag-bg": theme.box.tagBg,
  };
  return v as CSSProperties;
}
