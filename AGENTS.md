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