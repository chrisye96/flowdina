"use client";

import { type ComponentProps } from "react";
import { DynamicIcon } from "lucide-react/dynamic";

type DynName = ComponentProps<typeof DynamicIcon>["name"];

export default function Ico({ name, size = 16, color }: { name?: string; size?: number; color?: string }) {
  if (!name) return null;
  return <DynamicIcon name={name as DynName} size={size} color={color} />;
}
