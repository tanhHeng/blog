---
version: "alpha"
name: "tanh.moe Personal Blog"
description: "A desktop-first personal blog visual system blending anime illustration, blueprint grids, magenta accents, cobalt typography, and dark dreamy hero imagery."
colors:
  primary: "#3558A7"
  primaryStrong: "#24488F"
  primarySoft: "#7EA2FF"
  accent: "#F47BDB"
  accentStrong: "#E86AD2"
  accentSoft: "#FFB4F0"
  accentPale: "#FFE8F8"
  cyan: "#42D0E7"
  cyanSoft: "#84DDEB"
  navy: "#07174D"
  navy2: "#101E57"
  deepSurface: "#14245D"
  surface: "#FFFFFF"
  surfaceTint: "#FAFCFF"
  grid: "#EEF3FA"
  diagonal: "#ECEFF6"
  line: "#DCEBFA"
  muted: "#C7D6EA"
  illustrationLine: "#8EA6D8"
  onDark: "#FFFFFF"
  onLight: "#3558A7"
  shadow: "rgba(53, 88, 167, 0.18)"
typography:
  displayHome:
    fontFamily: "Inter, Montserrat, Noto Sans SC, sans-serif"
    fontSize: "5rem"
    fontWeight: 800
    lineHeight: "1.05"
    letterSpacing: "-0.035em"
  displayOutline:
    fontFamily: "Inter, Montserrat, Noto Sans SC, sans-serif"
    fontSize: "9rem"
    fontWeight: 800
    lineHeight: "0.88"
    letterSpacing: "-0.055em"
  h1:
    fontFamily: "Inter, Noto Sans SC, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: "1.05"
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Inter, Noto Sans SC, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: "1.25"
    letterSpacing: "-0.01em"
  articleTitle:
    fontFamily: "Inter, Noto Sans SC, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: "1.25"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, Noto Sans SC, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: "1.85"
    letterSpacing: "0.02em"
  navLatin:
    fontFamily: "Inter, Montserrat, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "-0.03em"
  navCjk:
    fontFamily: "Noto Sans SC, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "0.04em"
  microCaps:
    fontFamily: "Inter, Montserrat, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "0.22em"
  meta:
    fontFamily: "Inter, Montserrat, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.2"
    letterSpacing: "0.02em"
  indexNumber:
    fontFamily: "Inter, Montserrat, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: "1"
    letterSpacing: "0"
  verticalLabel:
    fontFamily: "Inter, Montserrat, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "0.18em"
  quote:
    fontFamily: "Noto Sans SC, Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: "1.7"
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "8px"
  full: "999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
  section: "112px"
  pageX: "56px"
components:
  light-page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
  dark-hero:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.onDark}"
    rounded: "{rounded.none}"
  nav-item:
    textColor: "{colors.primary}"
    typography: "{typography.navLatin}"
    padding: "0px"
  nav-item-dark:
    textColor: "{colors.onDark}"
    typography: "{typography.navLatin}"
    padding: "0px"
  nav-active-bar:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.none}"
    width: "74px"
    height: "10px"
  tag-filled:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.onDark}"
    typography: "{typography.microCaps}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  tag-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    typography: "{typography.microCaps}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
  activity-index:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.onDark}"
    typography: "{typography.indexNumber}"
    rounded: "{rounded.none}"
    width: "60px"
    height: "60px"
  article-title:
    textColor: "{colors.primary}"
    typography: "{typography.articleTitle}"
  article-meta:
    textColor: "{colors.primarySoft}"
    typography: "{typography.meta}"
  profile-card:
    backgroundColor: "{colors.surfaceTint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    width: "285px"
    height: "255px"
  scroll-rail:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    width: "3px"
  hero-title:
    textColor: "{colors.onDark}"
    typography: "{typography.displayHome}"
  hero-title-accent:
    textColor: "{colors.accentSoft}"
    typography: "{typography.displayHome}"
  quote-block:
    textColor: "{colors.primary}"
    typography: "{typography.quote}"
---

## Overview

This design system describes the visual direction shown in the draft screens `homepagev2.png`, `about.png`, `activity.png`, and `footbar.png`.

The site should feel like a personal anime-tech journal: soft, clean, and airy on content pages, then immersive and cinematic on the landing page. The core style is **blueprint grid × magical-girl illustration × geometric cyber UI**. The UI uses precise technical lines, oversized outline lettering, small bilingual labels, magenta highlights, cobalt-blue text, and decorative rails/dots to create a recognizable blog identity.

The design is desktop-first. The supplied drafts are wide layouts around 1920px, with a persistent top-left navigation and a right-side scroll/progress rail. Content is placed asymmetrically: text and lists occupy the left/center area, while character artwork and profile cards anchor the right side.

## Colors

The palette has two modes that must remain visually connected.

**Light mode pages** use white and near-white surfaces, pale grid lines, cobalt-blue typography, and vivid pink accents. These pages should look like a clean technical sheet or design canvas. Keep most of the screen white; the personality comes from thin rules, diagonal guide lines, large outline type, and small bursts of magenta.

**Dark home page** uses deep navy as the base with cyan glow, translucent blue panels, magenta curves, and white typography. It should feel like a dream/night scene without losing the technical grid language used on the light pages.

Color roles:

- **Primary blue `#3558A7`**: main text, navigation, article titles, icon strokes, scroll labels.
- **Strong blue `#24488F`**: large Chinese headings and emphasized text.
- **Soft blue `#7EA2FF`**: metadata, secondary labels, subtle links.
- **Accent pink `#F47BDB`**: active nav underline, chips, index blocks, dividers, orbit dots, vertical rails.
- **Navy `#07174D` / `#101E57`**: dark landing page background and deep overlays.
- **Cyan `#42D0E7`**: dark-page glow and magical/flower highlights only.
- **Grid/line colors `#EEF3FA`, `#ECEFF6`, `#DCEBFA`**: background structure; keep these low contrast.

Do not introduce unrelated accent colors. The identity depends on the narrow pink/blue/cyan palette.

## Typography

Use a geometric sans-serif stack for Latin text and a clean Simplified Chinese sans-serif for Chinese content. Recommended web stack:

```css
font-family: Inter, Montserrat, "Noto Sans SC", "Microsoft YaHei", sans-serif;
```

Typography is bold, technical, and tightly composed:

- Navigation uses small Chinese labels above large uppercase English labels.
- English micro labels are uppercase with wide tracking, such as `PERSONAL BLOG`, `ABOUT / PROFILE`, `RECENT ACTIVITY`, and `SCROLL TO READ`.
- Chinese headings are heavy and compact, often paired with thin magenta dividers.
- Body text is not lightweight. Use medium or semibold weight so blue text remains crisp on the pale grid.
- Oversized outline text, such as `ABOUT ME` and `tanh.moe`, is a background graphic, not normal readable body text.

Outline display text should use `-webkit-text-stroke` or SVG strokes with transparent fill. Use pale blue for light pages and a soft pink/blue gradient stroke for the footer wordmark.

## Layout

The layout is built from a fixed technical grid.

Use these desktop constants as the default implementation target:

- Canvas width: fluid, optimized for 1440px–1920px screens.
- Top navigation origin: about 56px from the left and 58px from the top.
- Page horizontal padding: `56px` minimum on desktop.
- Main content column starts near the left third of the page on content sections.
- Right illustration zone occupies roughly the right 32%–38% of the viewport.
- Right scroll rail sits close to the right edge, around 70px from the edge on desktop.
- Bottom decorative arcs and oversized wordmarks can bleed off the viewport.

### Background grid

Light pages use a white base with three overlapping systems:

1. A large square grid with very pale blue lines.
2. Diagonal 45-degree guide lines in pale gray-blue.
3. Tiny blue intersection dots at selected grid points.

Keep the grid subtle. It should be visible enough to give the page a blueprint feel, but never compete with headings or artwork.

### Navigation

The navigation is persistent and top-left aligned. Each item has:

- Chinese label above the English label.
- Uppercase English text: `HOME`, `ABOUT`, `NOVEL`, `ARTICLE`.
- Thin horizontal rule segments connecting the items.
- Active state shown by a magenta rectangular underline beneath the English label.

On the dark home page, nav text and connector lines become white while the active underline remains pink.

### Right scroll rail

Use the right rail as a recurring signature element. It includes:

- Three small square markers near the top.
- A thin vertical magenta line.
- Small cobalt dots and a diamond marker along the line.
- Vertical text: `← SCROLL TO READ`.

The rail should be fixed or sticky on desktop. On smaller screens, hide the decorative rail before reducing content readability.

### Page-specific layout

**Home page:** full-bleed dark hero with central anime artwork, left-aligned introduction, large name title, boxed `PERSONAL BLOG` label, exploration links, translucent geometric blocks, an S-curve pink path, and a white scalloped footer transition.

**About page:** large pale outline `ABOUT ME` behind the heading, bold Chinese title `关于我`, magenta dotted divider, profile copy in cobalt blue, and tag chips below. The character illustration is cropped large on the right with low-opacity pale blue line art.

**Recent activity page:** vertical Chinese title `近期活动` on the left, faint vertical English `# RECENT ACTIVITY` behind it, a numbered activity list in the center, and a right profile card layered over line-art character illustration.

**Footer/end page:** mostly empty grid space, right-side illustration, huge outlined `tanh.moe` wordmark bleeding from the bottom-left, and a bold quote block in the lower-right.

## Elevation & Depth

Depth should come from layering rather than heavy shadows.

Use these layers from back to front:

1. Base surface or dark image wash.
2. Grid, diagonal guides, dots, arcs, and oversized outline words.
3. Character artwork and translucent geometric panels.
4. Main copy, article rows, tags, and profile card.
5. Right rail and navigation.

Use shadows sparingly. Prefer translucent fills, 1px strokes, glow, blur, and opacity shifts. On the dark home page, cyan glow and soft navy overlays are acceptable; on light pages, shadows should be minimal or absent.

## Shapes

Shapes are sharp, geometric, and editorial.

- Prefer square corners for cards, chips, index blocks, and labels.
- Use thin 1px strokes for boxes, dividers, and profile image frames.
- Use circles and arcs only as decorative orbit/diagram elements.
- Use diamonds, dots, crosses, and star/spark shapes as small accents.
- Use vertical lines and rails to create a technical instrument-panel feeling.

Avoid rounded app-like cards. The draft style is closer to a poster, zine spread, blueprint, or game UI than a conventional dashboard.

## Components

### Navigation item

A nav item is bilingual. The Chinese label is small and sits above the English label. English labels are bold uppercase. The active item receives the magenta underline block. Horizontal connector lines should visually pass through the navigation row.

### Tag chip

Tags are all-caps micro labels with generous letter spacing. Use a mix of filled magenta chips and outlined pink chips. Filled chips may use white text in decorative contexts; for dense or accessibility-critical UI, use darker blue text on pale pink instead.

Example labels from the draft: `LANGAUGE`, `PYTHON`, `JAVA`, `INTERESTS`, `SLEEP & EAT`, `GRAPHIC DESIGN`, `MINECRAFT`.

### Activity row

Each row has a square magenta index block (`01`, `02`, etc.), a bold blue title, a thin magenta horizontal rule, and a soft-blue metadata line. Rows should have large vertical spacing and should read like editorial entries, not compact list items.

### Profile card

The profile card is a small square/rectangular overlay on the activity page. It uses:

- Thin cobalt-blue border.
- Avatar image cropped square.
- Blue display name, e.g. `tanh丶桁`.
- Handle text in soft blue.
- Small icon row for social links.
- Decorative small pink arrows/triangles on both sides.

The card should overlap the right-side character illustration so the screen feels layered.

### Article/content intro block

The About intro block uses a large Chinese title, a magenta dotted or dashed divider, a spaced uppercase English subtitle, and bold blue Chinese body text. Lines should be wide enough to feel editorial but not so long that the block loses rhythm.

### Dark hero decorative system

Use translucent rectangles, wave curves, crosshair marks, numbered labels, orbit arcs, and chart-like bars to create motion around the main illustration. These should be decorative and should not become functional UI unless explicitly interactive.

## Do's and Don'ts

Do:

- Keep the identity blue/pink/cyan and mostly white or deep navy.
- Use large negative space on light pages.
- Keep grid lines and diagonal guides extremely subtle.
- Layer character artwork with UI elements instead of placing it in a simple image box.
- Use magenta as a precise highlight, not as a large background field.
- Use uppercase micro labels and vertical text to reinforce the technical poster style.
- Preserve the right scroll rail across desktop pages.
- Let decorative elements bleed beyond the viewport edges.

Don't:

- Do not add rounded, shadow-heavy cards or generic dashboard components.
- Do not replace the anime illustration system with stock photos or realistic imagery.
- Do not use random gradients outside the pink/blue/cyan palette.
- Do not make the background grid too dark.
- Do not center every section; asymmetry is part of the design.
- Do not use thin body text. Medium/semibold text is needed for the cobalt-on-white look.
- Do not overuse pink for long text; reserve it for emphasis, rules, chips, and rails.

### Responsive behavior

For tablets and mobile screens, keep the visual language but reduce decoration:

- Collapse the nav into a compact top bar or menu.
- Hide the right scroll rail below tablet widths.
- Move illustration art behind content at low opacity or place it after the main content.
- Convert activity rows into a single-column list while preserving index blocks and magenta dividers.
- Keep grid and diagonal guides, but reduce their opacity further.
- Use the dark home hero as a stacked layout: intro first, illustration second, exploration links below.

### Motion guidance

Motion should feel like scanning a technical diagram:

- Active nav underline slides horizontally.
- Scroll rail dots can pulse subtly.
- Background grid and large outline text can parallax slowly.
- Dark hero panels can drift a few pixels or fade in sequentially.
- Avoid bouncy or playful easing. Use precise `ease-out`, `cubic-bezier(0.16, 1, 0.3, 1)`, and short durations around 180ms–420ms.
