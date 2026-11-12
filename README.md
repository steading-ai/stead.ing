# stead.ing

The websites for [Steading](https://stead.ing/): the hub at `stead.ing`, and one site per project at `<project>.stead.ing`. One codebase builds all of them, so every site shares a look, a structure, and a set of dependencies that is updated in one place.

A project's repository holds only its own words: a folder with a `site.yaml` and Markdown pages. The [site action](#publishing-a-projects-site) in this repository turns that folder into a site and publishes it to GitHub Pages.

## What every site has

- **A front page** written by `site.yaml`: what the project does, a prompt to paste into your agent, where to start, what it is not, and what it works better with.
- **A page for every Markdown file** in the folder, with navigation built from the folder layout.
- **A Markdown twin of every page.** Swap a page's trailing slash for `.md` (`/guide/first/` is also `/guide/first.md`; the front page is `/index.md`).
- **`/llms.txt` and `/llms-full.txt`**, so an agent can read the whole site without parsing HTML.
- **A Projects menu** that lists every Steading project with a line saying what it is, and the project's own color and mark.

The sites are static files that work without JavaScript and load nothing from another origin.

## A site's content folder

```text
site/
  site.yaml        which project this is, and the front page's words
  get-started.md   a page at /get-started/
  guide/
    index.md       a page at /guide/, and the name of the "guide" group
    first.md       a page at /guide/first/
```

### `site.yaml`

| Field | Required | What it is |
|-------|----------|------------|
| `project` | yes | The project's id in [`src/projects.ts`](src/projects.ts). `steading` is the hub. |
| `headline` | yes | The front page's heading. |
| `summary` | yes | One paragraph under it. Also the description in `llms.txt`. |
| `prompt` | yes | The prompt a visitor pastes into their agent. It should only point at the site's `llms.txt`. |
| `fit` | no | Who the project suits and who it does not, as statements of fact. Goes in `llms.txt`. |
| `install` | no | `command`, and an optional `note` under it. |
| `facts` | no | Short labels under the prompt: "Open source", "Built in Go". |
| `starts` | no | "Pick your starting point": a list of `title` and `body`. |
| `features` | no | "What it does": a list of `title` and `body`. |
| `not` | no | "What it is not": a list of `title` and `body`. |
| `instead` | no | A line after the "is not" list, pointing at a better fit. |
| `pairs` | no | "Works better with": a list of `project` (an id) and `body`. |

`body`, `note`, and `instead` may use `` `code` ``, `**bold**`, and `[links](https://example.com)`. [`examples/skift/site.yaml`](examples/skift/site.yaml) is a complete one.

### What the sites say to agents

`llms.txt`, `/index.md`, and `robots.txt` state facts. They never tell an agent what to do.

Text that instructs its reader ("ask them what they are building", "say so if it is not a fit") reads as a prompt injection to a model and to anything guarding it, whatever was meant, and gets a site flagged. A visitor who wants their agent to do something says so themselves, in the prompt they paste; that is what `prompt` is for.

So `summary` and `fit` are checked when a site is built, and a build fails on wording such as "you should", "if you are an agent", or a sentence that opens with a command. [`src/lib/policy.ts`](src/lib/policy.ts) holds the rule and the wording it catches. Write what is true of the project: who it suits, what it needs, what it is not.

A page's own Markdown is documentation for people, and a how-to may tell its reader to run a command. That is carried into `llms-full.txt` as written.

### Pages

- Frontmatter is optional. A page takes its title from `title`, or else from its first `# Heading`.
- `description` appears beside the page's link in listings and in `llms.txt`.
- `order` places a page in the navigation; lower comes first. Pages without one follow, by title.
- Link between pages the way you would on GitHub, to the file: `[first steps](guide/first.md)`. The site points those links at pages, and the Markdown twins keep them as written.
- A top-level `index.md` is refused, because `site.yaml` writes the front page.

## Working on the sites

```bash
mise install            # node, pnpm, and the linters
pnpm install
pnpm dev                # the hub, from content/
pnpm dev:skift          # a project's site, from examples/skift/
```

`STEADING_CONTENT` points a build at any content folder, including one in another checkout:

```bash
STEADING_CONTENT=../skift/site pnpm dev
```

To look at finished builds the way a static host serves them:

```bash
pnpm build:all          # dist/steading, dist/skift, dist/fixture
pnpm serve              # http://127.0.0.1:4410, :4411, :4412
```

### Checks

`hk check --all` runs the linters and `astro check`. `hk run pre-push --all` runs the rest, in order:

| Command | What it proves |
|---------|----------------|
| `pnpm test` | The brand's colors meet WCAG AA against every surface they sit on; links, navigation, and `llms.txt` come out as specified. |
| `pnpm build:all` | The hub, the skift example, and a fixture site that uses every field all build. |
| `pnpm test:dist` | Every internal link resolves, every page has its Markdown twin, nothing loads from another origin, and fonts stay under 120 KB. |
| `pnpm test:e2e` | No WCAG 2.2 AA violations in light or dark, on a desktop or a phone; the keyboard reaches everything; the prompt copies. Needs `pnpm exec playwright install chromium`. |

## Adding a project

Add it to `PROJECTS` in [`src/projects.ts`](src/projects.ts): its name, the problem it answers in the words of someone who has it, what it does about that, its status, its two colors, and its mark's shape (drawn in [`src/lib/mark.ts`](src/lib/mark.ts)). The hub lists projects by those problems, and so does `llms.txt`, because a visitor arrives with a problem and not with a project's name. A test fails if either color is too faint against the theme it belongs to. Leave `site` unset until the project's site is deployed; nothing links to a site before that.

## Publishing a project's site

In the project's repository, add the content folder and this workflow as `.github/workflows/site.yml`:

```yaml
name: Site

on:
  push:
    branches: [main]
    paths: ["site/**", ".github/workflows/site.yml"]
  pull_request:
    paths: ["site/**", ".github/workflows/site.yml"]
  workflow_dispatch:

permissions: {}

concurrency:
  group: site-${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: steading-ai/stead.ing@main
        with:
          deploy: "false"

  publish:
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.site.outputs.url }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - id: site
        uses: steading-ai/stead.ing@main
```

The action takes two inputs: `content`, the folder to build (default `site`), and `deploy`, which builds without publishing when `"false"`.

The project's repository never installs Node or carries a lockfile. Astro, Tailwind, and everything else are pinned here and kept current by Renovate here. Renovate in the project's repository pins `steading-ai/stead.ing@main` to a commit and proposes each new one; the pull request builds the site as its check, so an update that breaks a project's site stops there.

Then, once per site, in this order:

1. In the repository's settings, set Pages to deploy from GitHub Actions and run the workflow.
2. Set the custom domain to `<project>.stead.ing` in the same settings.
3. Add the DNS record: a `CNAME` from `<project>` to `steading-ai.github.io`, DNS-only. `stead.ing`'s records are managed in `ivy/homestead`'s Terraform.
4. When GitHub has issued the certificate, turn on "Enforce HTTPS". Because the domain was set before its record existed, GitHub's first check of it failed, and it can be slow to look again. If no certificate has appeared a few minutes after the record resolves, clear the custom domain and set it again straight away; the certificate follows within a minute.
5. Set the project's `site` in `src/projects.ts`, so the hub and the other sites start linking to it.

The domain is set before the record exists so that nobody else can claim the address in between.

## License

[ISC](LICENSE.md).
