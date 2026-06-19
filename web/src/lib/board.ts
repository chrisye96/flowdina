// The typed board model. Replaces DOM-as-truth: every diagram is one Board value,
// rendered by React. One model serves both the journey board and the flowchart.
// See doc/DATA_MODEL.md for the rationale and the HTML-vocabulary mapping.

export type ColorValue = string; // a resolved css color

// A semantic colour role, resolved against Theme, or a one-off hex escape hatch.
export type ColorToken =
  | "gray"
  | "green"
  | "blue"
  | "indigo"
  | "amber"
  | "red"
  | "purple"
  | { hex: ColorValue };

export type Icon = { name: string }; // a lucide icon name

export type Board = {
  mode: "board" | "flow";
  theme: Theme;
  banner?: Banner;
  sections: Section[];
  edges: Edge[];
};

export type Banner = { title: string; badge?: { icon?: Icon; text: string } };

// One vertical layout primitive for both modes. Board mode is usually a single
// `columns` section; flow mode is a sequence of full-width nodes, one `columns`
// branch, and captions.
export type Section =
  | { type: "node"; node: Node }
  | { type: "columns"; columns: Column[] }
  | { type: "caption"; text: string };

export type Column = {
  id?: string;
  header?: { num?: string; title: string; sub?: string; color: ColorToken };
  nodes: Node[];
};

// The connectable unit. Its id is what edges reference (today's data-cid).
export type Node = {
  id: string;
  variant?: "card" | "pill";
  accent?: "plain" | "danger" | "decision" | "state-blue" | "state-green";
  header?: { text: string; color: ColorToken };
  pillColor?: ColorToken;
  tag?: string;
  blocks: Block[];
};

export type NoteLine = { accent?: string; text: string; icon?: Icon };

export type Block =
  | { type: "titleRow"; icon?: Icon; iconBg?: ColorToken; text: string }
  | {
      type: "text";
      text: string;
      accentPrefix?: string;
      tone?: "normal" | "muted";
      align?: "left" | "center";
    }
  | { type: "list"; items: string[] }
  | { type: "field"; label: string; value: string; sub?: string; strong?: boolean }
  | {
      type: "button";
      style: "primary" | "outline" | "danger";
      text: string;
      icon?: Icon;
      trailingIcon?: Icon;
    }
  | {
      type: "callout";
      kind: "note" | "warn" | "verify";
      icon?: Icon;
      title?: string;
      blocks: Block[]; // recursive: a note can hold a list/text/chip
    }
  | { type: "chip"; icon?: Icon; text: string }
  | { type: "band"; text: string };

export type Edge = {
  id: string;
  from: string;
  to: string;
  line?: "straight" | "elbow" | "curve";
  arrow?: "end" | "both" | "none";
  dash?: boolean;
  label?: string;
  // Label offset from the wire midpoint (px), so text can be dragged off a crossing.
  labelDx?: number;
  labelDy?: number;
  color?: ColorToken;
};

export type IconColor = Exclude<ColorToken, object>;

// Maps 1:1 to the legacy ~27 css variables, just structured and typed.
export type Theme = {
  banner: {
    from: ColorValue;
    to: ColorValue;
    text: ColorValue;
    badgeBg: ColorValue;
    badgeText: ColorValue;
  };
  columns: ColorValue[]; // stage-header palette (c1..c6)
  columnText: ColorValue;
  surface: { page: ColorValue; card: ColorValue; cardBorder: ColorValue };
  text: { title: ColorValue; body: ColorValue; label: ColorValue; value: ColorValue };
  accent: ColorValue;
  button: {
    primary: ColorValue;
    primaryText: ColorValue;
    outlineBorder: ColorValue;
    outlineText: ColorValue;
    danger: ColorValue;
    dangerText: ColorValue;
  };
  box: {
    noteBg: ColorValue;
    warnBg: ColorValue;
    warnText: ColorValue;
    dangerCardBg: ColorValue;
    tagBg: ColorValue;
  };
  icon: Record<IconColor, ColorValue>;
};
