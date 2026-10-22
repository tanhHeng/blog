<div align="center">
  <img src="./banner.svg" alt="TANH.MOE banner" width="80%" />
</div>

# TANH.MOE

Hi, I'm **tanh_Heng** (tanh丶桁): a deep learning enthusiast and amateur graphic designer exploring the space between code, algorithms, and visual design.

**[TANH.MOE](https://tanh.moe)** is my personal blog: writing, technical thoughts, and everyday observations, presented through a design-led reading experience of restrained blues, Playfair typography, generous whitespace, and drifting circles.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Homepage: a scroll-driven sequence of prologue, about, recent articles, and a piano coda of friend links |
| `/about` | Profile in Chinese: current projects, skills, selected work, and contact |
| `/articles` | Article archive with tag filtering |
| `/articles/*` | Markdown articles with a generated table of contents |
| `/novel` | *Flowe_orld*: an immersive reading page for my novel, set on a looping video stage |

Navigation uses Astro's `<ClientRouter />`, so the navbar persists between pages while each route arrives with its own transition.

## Development

Requires Node `>=24.18.0` and Yarn 4.

```sh
yarn install
yarn dev            # local dev server
yarn check:astro    # type and template diagnostics
yarn build          # static build into dist/
yarn preview        # serve the build
```

Built with [Astro](https://astro.build), Sass, and a little TypeScript; there is no server, database, or CMS.

## License

[GPL-3.0](./LICENSE)
