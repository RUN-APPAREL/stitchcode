export type ThemeId = "alpine" | "teal" | "mint" | "chartreuse" | "cinnabar";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tag: string;
  /** swatch preview colours */
  bg: string;
  ink: string;
  accent: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "alpine",
    name: "Comelea Alpine",
    tag: "MP-01",
    bg: "#F0EEDF",
    ink: "#1C1C1A",
    accent: "#FE492A",
  },
  {
    id: "teal",
    name: "Teal Wave & Lagoon",
    tag: "MP-02",
    bg: "#D9FAF4",
    ink: "#0F2A2A",
    accent: "#00BFA6",
  },
  {
    id: "mint",
    name: "Fresh Mint & Pine",
    tag: "MP-03",
    bg: "#DFF8EB",
    ink: "#132A22",
    accent: "#19C37D",
  },
  {
    id: "chartreuse",
    name: "Spring Chartreuse",
    tag: "MP-076",
    bg: "#F6F7ED",
    ink: "#001F3F",
    accent: "#DBE64C",
  },
  {
    id: "cinnabar",
    name: "Midnight Cinnabar",
    tag: "MP-05",
    bg: "#FAF5F5",
    ink: "#191815",
    accent: "#E84528",
  },
];

const KEY = "qrsmith:theme";

export function getInitialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return "alpine";
}

export function persistTheme(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
}
