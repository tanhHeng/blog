export interface NavItem {
  cjk: string;
  href: string;
  label: string;
}

export interface ExploreLink {
  cjk: string;
  href: string;
  label: string;
}

export interface AfterCard {
  body: string;
  href: string;
  title: string;
}

export const navItems: NavItem[] = [
  { cjk: "首页", label: "HOME", href: "/" },
  { cjk: "关于", label: "ABOUT", href: "/about" },
  { cjk: "小说", label: "NOVEL", href: "/blog" },
  { cjk: "文章", label: "ARTICLE", href: "/blog" },
];

export const exploreLinks: ExploreLink[] = [
  { label: "ABOUT", cjk: "关于我", href: "/about" },
  { label: "RECENT", cjk: "近期活动", href: "/blog" },
  { label: "LATEST ARTICLE", cjk: "最新文章", href: "/blog" },
];

export const afterCards: AfterCard[] = [
  {
    href: "/about",
    title: "关于我",
    body: "Profile, interests, and the small coordinates behind tanh.moe.",
  },
  {
    href: "/blog",
    title: "近期活动",
    body: "Recent posts, notes, experiments, and design/deep learning logs.",
  },
  {
    href: "/blog",
    title: "最新文章",
    body: "Jump straight into the newest article in the personal blog archive.",
  },
];
