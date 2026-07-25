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

Astro file-based routing exposes files under `src/pages/` as routes. The current content routes are `/` and `/articles/reading-test`; the navbar also advertises `/about` and `/novel`, but those routes do not currently have corresponding page files, so treat them as planned or incomplete navigation targets rather than implemented features.

The shared layout stack is:

1. `BaseLayout.astro` owns the HTML document, metadata, favicon, language attribute, global styles, navbar, animated background circles, and desktop mouse-following circle.
2. `DefaultLayout.astro` wraps general pages with optional text decorations and the homepage hero artwork.
3. `ArticleLayout.astro` wraps Markdown articles with article metadata, reading content, a generated table of contents, article-specific decorations, and `lang="zh-CN"` metadata.

`src/pages/index.astro` is the homepage. It renders the brand introduction, About Me content, recent-article area, and footer as sections inside a scroll-driven composition. Its inline browser script controls section activation, navigation/scroll transitions, and responsive behavior; change that script cautiously and verify both desktop and narrow viewport behavior.

`src/pages/articles/*.md` is the article content layer. Each Markdown article supplies frontmatter such as `title`, `date`, `tags`, `wordCount`, `readingTime`, and `description`, and explicitly selects `ArticleLayout.astro`. Markdown headings become anchors through Astro's heading extraction and feed `ArticleContents.astro`, which displays levels 2–4 in the table of contents.

### Reusable components

- `Navbar.astro`: fixed brand/navigation bar; receives `activePage` and marks the matching link active. Keep its link names and route targets synchronized with actual pages.
- `DynamicCircles.astro`: fixed, pointer-transparent animated radial circles, optionally masked by `public/svg/grid-decoration.svg`; its browser code generates motion and follows the pointer for the mask effect.
- `MouseCircle.astro`: desktop-only pointer follower. It hides itself for coarse pointers, touch devices, narrow viewports, blur, and hidden tabs; do not re-enable it indiscriminately on mobile.
- `HeroSection.astro`: homepage hero image plus `RotatingCircles`; measures the navbar and image at runtime to handle overlap and mobile centering.
- `RotatingCircles.astro`: decorative rotating circle treatment used by the homepage and article layout.
- `TextDecorations.astro`: peripheral editorial text ornaments used by the default layout.
- `ArticleContents.astro`: collapsible/generated article table of contents with responsive behavior and heading links.

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