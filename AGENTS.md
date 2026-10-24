## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `yarn astro dev stop`, `yarn astro dev status`, and `yarn astro dev logs`.

There's no need to stop astro dev server every time.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Git Workflow

1. **Analyze**: Run `git status` and `git diff --staged`. If nothing is staged, prompt the user to add files.
2. **Draft**: Write a commit message following **Conventional Commits** (e.g., `feat:`, `fix:`, `docs:`).
3. **Show & Ask (CRITICAL)**: 
   - Display the exact command you intend to run.
   - **Always** ask for explicit approval before executing.
   - Template: *"Proposed command: `git commit -m "..."` Do you approve? (yes/no)"*
4. **Execute**: Only run `git commit` after receiving a positive confirmation ("yes"/"y"/"approve").
5. **Report**: Output the commit hash upon success.

**Never execute `git commit` without showing the commit info and receiving explicit user confirmation first.**

## Project Overview

### Purpose

This repository contains `TANH.MOE`, a personal editorial blog for tanh_Heng. It is a design-led, static Astro site rather than an application with a server, database, API, authentication, or CMS. The project objective is to present personal writing and identity through a highly art-directed reading experience: restrained blue tones, Playfair typography, generous whitespace, decorative circles, grid textures, and responsive layouts. Preserve this editorial and visual character when changing the site.

### Technology and runtime

- Framework: Astro 7 with TypeScript support and `.astro` components.
- Package manager: Yarn 4.17.1; use the existing `yarn.lock` and do not introduce another package manager.
- Runtime requirement: Node `>=22.12.0`.
- Styling: Sass/SCSS, including component-scoped styles and global styles; `animate.css` is loaded by the base layout.
- Build and preview: `yarn build` creates the production site in `dist/`; `yarn preview` serves that build.
- Astro is currently configured with `defineConfig({})`; there are no integrations, adapters, server endpoints, or external data sources configured.

### Repository structure

```text
/
├── public/                 Static assets served from the site root
│   ├── img/hero.png        Homepage hero artwork
│   └── svg/                Logo/decorative SVG assets
├── src/
│   ├── pages/              File-based routes
│   │   ├── index.astro     Homepage and its section navigation behavior
│   │   ├── 404.astro       Not-found page
│   │   └── articles/       Markdown article routes
│   ├── components/         Reusable visual and interactive Astro components
│   ├── layouts/            Shared document, homepage, and article shells
│   ├── styles/             Global Sass variables/base styles and navbar styles
│   └── env.d.ts            Astro/TypeScript environment declarations
├── .design/                Reference screenshots and visual design targets
├── astro.config.mjs        Astro configuration
├── vite.config.ts          Vite Plus configuration
├── package.json             Scripts, dependencies, and Node/package-manager constraints
└── AGENTS.md               Development and agent operating instructions
```

### Page and layout architecture

Astro file-based routing exposes files under `src/pages/` as routes. The current content routes are `/`, `/about`, `/articles`, `/articles/reading-test`, and `/novel`, matching every navbar link.

`src/pages/about.astro` is a static, Chinese-language profile page laid out like the article archive: a sticky sidebar (title, motto, intro, profile facts, signature) beside numbered sections for current work, skills, selected projects, and contact. Its copy follows the GitHub profile README (`github.com/tanhHeng/tanhHeng`); it has no client script and uses the `article` transition veil.

`src/pages/novel.astro` is a self-contained immersive page: a fixed looping video stage (`public/novel/`) whose camera pans and zooms to per-scene focus points, one-viewport verse sections, and a chapter rail. Scrolling is script-driven instead of CSS snapping: each wheel, swipe, or key press glides exactly one scene with an eased 1.6s animation, input during a glide is absorbed, and scrollbar drags settle onto the nearest scene; links into scenes use `data-glide-to`. The flow is pulled up by the navbar's in-flow box so the opening scene starts at scroll 0. Interaction is text-only: each scene's in-image hotspot label swaps to its destination on hover/focus and opens a `<dialog>` reading panel (prologue, chapter list and reader, character codex, world-building with a night-phase cycle chart); the outro returns every hotspot to its place on the image plus a cue that glides back to the opening, falling back to a list under the closing text when the crop cannot show them all. Panels lock page scroll; `scrollbar-gutter: stable` keeps the layout from shifting. Scene excerpts, hotspot labels, and focus coordinates live in the page's `scenes` array; coordinates are percentages of the video frame. It hides the site-wide circle texture and footnote; verify desktop, narrow, and reduced-motion behavior when changing it.

The novel text lives in `src/novel/flowe-orld.md` (not a route). `src/lib/novel.ts` splits its compiled HTML by heading: `# 序章`, volume `#` headings holding `## Chapter NN / Title` with `###` sections, and `# 谐相图鉴` holding a `## … / 世界观` section plus `## affinity / name` character sections whose `label：value` paragraphs become profile fields. Keep that heading structure when editing the draft; the build fails if a required section is missing.

The shared layout stack is:

1. `BaseLayout.astro` owns the HTML document, metadata, favicon, language attribute, global styles, navbar, animated background circles, desktop mouse-following circle, and the page transition (`transition` prop).
2. `ArticleLayout.astro` wraps Markdown articles with article metadata, reading content, a generated table of contents, article-specific decorations, and `lang="zh-CN"` metadata.

The homepage and 404 use `BaseLayout.astro` directly and place `TextDecorations` and `HeroSection` themselves. The only background grid is the site-wide `DynamicCircles` mask; pages do not draw a static grid texture of their own.

Astro `<ClientRouter />` enables same-origin client-side routing while preserving full-page fallback for unsupported routes. `BaseLayout.astro` installs it in the shared head, persists the navbar, background circles, pointer circle, and transition veil, and serializes the route transition table (`routeTransitions` in `src/lib/pageTransitions.ts`: each route's veil variant and text) into every page; the root view transition itself is `none`. Add a route there when adding a page that should not use the plain fade. `transitionCoordinator.ts` hooks `astro:before-preparation` and runs each navigation as one sequence on the veil: (1) the variant's cover starts immediately; (2) 30% into the cover, the veil text enters inside it (the cover's clip keeps it hidden where it has not reached); if the next document is still loading 500ms after the click, the dots below the text pulse until it arrives and then burst (scale up and fade), while faster loads show no dots; (3) once the cover is complete and has held the text at least 450ms, the DOM swaps under it and the reveal plays after `astro:page-load`. Veil entrances run through the Web Animations API because the persisted veil is re-inserted at swap, which would restart CSS animations. `prefers-reduced-motion` skips the whole sequence. The navbar keeps one live DOM node and synchronizes its active link from the incoming document before swap.

`src/pages/index.astro` is the homepage. It renders the brand introduction, About Me content, recent-article area, and footer as sections inside a scroll-driven composition. `src/scripts/home.js` initializes both section navigation and circle attraction on every `astro:page-load`; the shared page lifecycle scope aborts listeners and disconnects observers, timers, animations, and animation frames on `astro:before-swap`.

Friend links live in `src/lib/friends.ts`. On the homepage coda, the piano keys are the only friend-link entry where they are shown (wider than `900px`); below that the keys are hidden and a single footer link cycles through the friends. The site footnote in `BaseLayout.astro` always uses that cycling link. Both use `src/scripts/friendRotator.ts`, which drives every `[data-friend-rotator]` link and pauses while the link is hidden, hovered, or focused.

Page-specific scripts register through `src/lib/pageLifecycle.ts`. Use `onPageLoad` to query current-page DOM and bind resources through the provided scope; cleanup runs before the body is swapped. In particular, the novel page's global wheel/touch/key handlers must remain scoped so they never intercept input after leaving `/novel`.

`src/pages/articles/*.md` is the article content layer. Each Markdown article supplies frontmatter such as `title`, `date`, `tags`, `wordCount`, `readingTime`, and `description`, and explicitly selects `ArticleLayout.astro`. Markdown headings become anchors through Astro's heading extraction and feed `ArticleContents.astro`, which displays levels 2–4 in the table of contents.

### Reusable components

- `Navbar.astro`: fixed brand/navigation bar; receives `activePage` during server rendering and marks the matching link active. Keep its link names and route targets synchronized with actual pages. Its `.navbar-content` (`#site-navbar`) uses `transition:persist`, preserving one live DOM node across navigation.
- `DynamicCircles.astro`: fixed, pointer-transparent animated radial circles, optionally masked by `public/svg/grid-decoration.svg`; its browser code generates motion and follows the pointer for the mask effect.
- `GridMarks.astro`: persisted, pointer-transparent layer of faint grid annotations snapped to the `DynamicCircles` mask grid (`min(10vh, 10vw)` tiles from the viewport corner): around a mouse pointer it lights the nearest row and column, marks the nearest intersection with its coordinate, ticks the four neighbours, and sends a ring on press; it fades out after 2.4s idle. Over content (text, links, media, controls) it dims almost to nothing and sends no ring, so it never competes with readable material. Hidden for touch/coarse pointers and on the novel page; keep its tile formula in sync with the mask.
- `MouseCircle.astro`: desktop-only pointer follower. It hides itself for coarse pointers, touch devices, narrow viewports, blur, and hidden tabs; do not re-enable it indiscriminately on mobile.
- `HeroSection.astro`: homepage hero image plus `RotatingCircles`; measures the navbar and image at runtime to handle overlap and mobile centering.
- `RotatingCircles.astro`: decorative rotating circle treatment used by the homepage and article layout.
- `TextDecorations.astro`: peripheral editorial text ornaments used by the default layout.
- `ArticleContents.astro`: collapsible/generated article table of contents with responsive behavior and heading links.
- `PageTransitionVeil.astro`: persistent per-variant transition overlay (home: a white circle carrying the brand and "Life is Piano. You are Pianist.", revealed through a centre hole with rings rippling ahead of its edge; article: archive/title text and directional wipe; novel: white mist and tagline; plain: white fade). Each variant has exactly one group of three loading dots under its text, shown only when loading takes longer than 500ms.

### Styling and visual conventions

`src/styles/global.scss` defines the site palette, typography, font imports, and base document rules. `src/styles/Navbar.scss` contains the navbar Sass variables and its responsive breakpoint at `900px`. Most page/layout styles are colocated in their `.astro` files. Prefer existing Sass variables, component styles, and layout conventions over introducing duplicate colors, fonts, or global selectors. Use `.design/` screenshots as visual references when making UI changes, and verify responsive behavior because the composition intentionally differs between desktop and mobile.

### Content and implementation guidance

- Keep content changes in `src/pages/articles/` and page markup changes in the relevant page/layout; do not hard-code article metadata into shared components.
- Preserve frontmatter field names consumed by `ArticleLayout.astro` unless all producers and consumers are updated together.
- Prefer Astro's server-rendered markup for static content. Add client-side code only for an observable interaction that cannot be achieved with HTML/CSS, and scope inline scripts to the component that owns the behavior.
- Reuse existing assets in `public/`; reference them with root-relative URLs such as `/img/hero.png` and `/svg/X.svg`.
- There is no implemented content collection or CMS layer at present. Do not invent one for a small content or styling change.
- Check for missing routes before changing navbar behavior. A new navigation destination requires a corresponding page and should be verified through the built site.

### Verification expectations

For content or layout work, run `yarn check:astro` and `yarn build` when practical. For visual or interaction changes, use the background Astro server workflow above and inspect the affected route in both desktop and narrow viewport sizes. Verify article rendering, metadata, heading anchors, and table-of-contents links when changing article layouts or Markdown handling. Report any existing unrelated warnings separately instead of masking them.