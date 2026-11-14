# stead.ing

The websites for [Steading](https://stead.ing/): the hub at `stead.ing`, and one site per project at `<project>.stead.ing`. One codebase builds all of them, so every site shares a header, a footer, a look, and a set of dependencies that is updated in one place.

Each project's site is published from the project's own repository, by its own workflow, and everything it says comes from there: a `site.yaml` for the front page, and the project's `README.md` and `docs/` folder for its docs. This repository supplies only what the sites have in common, through the [site action](#publishing-a-projects-site).

## What every site has

- **A front page** written by `site.yaml`: the headline, a prompt to paste into your agent, and whichever sections the project fills in.
- **Docs at `/docs/`**, built from the project's `README.md` and every Markdown file under `docs/`, with navigation that follows the folder, or the sections the project names. A page with more than one section lists them beside it and marks the one being read.
- **A Markdown twin of every page.** Swap a page's trailing slash for `.md` (`/docs/vision/` is also `/docs/vision.md`; the front page is `/index.md`).
- **`/llms.txt` and `/llms-full.txt`**, so an agent can read the whole site without parsing HTML.
- **The same header and footer**: a Projects menu that lists every Steading project with a line saying what it is, and the project's own color and mark.
- **The same closing invitation** to build it with other people.

The sites are static files that work without JavaScript and load nothing from another origin.

## What a project's repository provides

```text
site.yaml        which project this is, and the front page's words
README.md        the first page of the docs, at /docs/
docs/
  vision.md      a page at /docs/vision/
  adrs/
    001-first.md a page at /docs/adrs/001-first/, filed under "Decisions"
```

Nothing is written twice. The README people read on GitHub is the docs' overview, and a link in it to `docs/vision.md` leads to that page on the site.

### `site.yaml`

| Field | Required | What it is |
|-------|----------|------------|
| `project` | yes | The project's id in [`src/projects.ts`](src/projects.ts). `steading` is the hub. |
| `headline` | yes | The front page's heading. |
| `summary` | yes | One paragraph under it. Also the description in `llms.txt`. |
| `fit` | no | Who the project suits and who it does not, as statements of fact. Goes in `llms.txt`. |
| `prompt` | no | Replaces the prompt every site offers, which asks whether the project is a good fit for the reader's work ([`src/lib/prompt.ts`](src/lib/prompt.ts)). It should only point at the site's `llms.txt`. |
| `install` | no | `command`, and an optional `note` under it. |
| `facts` | no | Short labels under the prompt: "Open source", "Built in Go". |
| `demo` | no | A small plan to draw in the hero: a `title`, and `nodes`, each with a `ref`, `title`, `kind`, `priority`, `state`, `who`, `note`, and the refs it `waits` on. |
| `run` | no | One piece of work going through a workflow, to draw in the hero: a `title`, the `work` (`ref` and `title`), the `workflow`, and `steps`, each with a `name`, `kind`, `state` (`closed`, `running`, `needs-you`, or `open`), `who` runs it, what it `closes` on, the `proof` on record once there is one, and a `note`. |
| `video` | no | A demonstration: a `caption`, and a `url` once there is one. Until then the page holds its place. |
| `offers` | no | What the project offers: a `title`, and `items` of `title` and `body`. |
| `thinking` | no | How the project thinks about its problem: a `title`, and `items` of `title`, `body`, and an `href` into the docs. |
| `quickstart` | no | The first few minutes: a `title`, and `steps` of `title`, `body`, optional `code`, and `prompt: true` to show the site's prompt and its copy button in that step. |
| `starts` | no | "Pick your starting point": a list of `title` and `body`. |
| `not` | no | "What it is not": a list of `title`, `body` (why not), and `use` (the id of the project to use for that). |
| `instead` | no | A line after the "is not" table, saying what the project is for. |
| `pairs` | no | "Works better with": any number of `project` (an id) and `body`. |
| `docs` | no | How the docs are arranged: `sections` (the navigation in named parts, described under [Docs](#docs)), `order` (top-level pages, by name, in reading order, for a site without sections), `exclude` (files, or folders ending in a slash, to leave out), and `groups` (names for folders). |

`body`, `note`, and `instead` may use `` `code` ``, `**bold**`, `*emphasis*`, and `[links](https://example.com)`. [`tests/fixtures/site/site.yaml`](tests/fixtures/site/site.yaml) uses every field.

### Docs

- **The README is the overview.** It is the page at `/docs/`, and the navigation calls it "Overview".
- **A page's title** is its `title` in frontmatter, or else its first `# Heading`. Frontmatter is optional.
- **Top-level pages** come in the order `docs.order` gives, then by title. **A folder's pages** stay in file order, since records are usually numbered or dated on purpose.
- **A folder is one line** in the navigation, named by `docs.groups`, or by its own `index.md`, or after itself, and leading to the folder's page. Its pages appear beneath it only while the reader is in the folder, each held to two lines and led by the number or date its file name opens with. A folder without an `index.md` gets a page that lists what is in it.
- **Sections split the navigation by reader.** `docs.sections` is a list, each entry a `title` and the `pages` under it: top-level pages by name, and folders by name with a slash after it. An entry written `install: Install` gives the page a shorter name in the navigation than its title. `collapsed: true` folds a section away until the reader opens it or is on one of its pages. The overview leads, the sections follow in the order given, and whatever no section lists follows in one called "More". A build fails on a section that lists what is not a page, or lists a page twice.

  ```yaml
  docs:
    sections:
      - title: Using it
        pages:
          - install: Install
          - guide/
      - title: Developing it
        collapsed: true
        pages: [developing, adrs/]
  ```

- **A page's contents stand beside it.** A page with two or more sections lists its `##` and `###` headings under "On this page", beside the page in a wide window and folded above it in a narrow one. The list is links without JavaScript, and marks the section being read with it.
- **Links are written the way they work on GitHub.** A link to a Markdown file that is a page leads to that page. A link to a folder of pages leads to the folder's page. A link to anything else in the repository (source, a workflow, a config file) leads to that file on GitHub. The Markdown twins keep links as written.
- **Pictures are written the same way.** An image kept under `docs/` is served at the same path on the site, and a page that shows it, in Markdown or in HTML, points there. A table that is wider than the page scrolls on its own.

The hub is the one site arranged differently: its pages live in [`content/`](content/) and sit at the top of the site (`content/how-we-work.md` is `/how-we-work/`).

### What the sites say to agents

`llms.txt`, `/index.md`, and `robots.txt` state facts. They never tell an agent what to do.

Text that instructs its reader ("ask them what they are building", "say so if it is not a fit") reads as a prompt injection to a model and to anything guarding it, whatever was meant, and gets a site flagged. A visitor who wants their agent to do something says so themselves, in the prompt they paste; that is what `prompt` is for.

So `summary` and `fit` are checked when a site is built, and a build fails on wording such as "you should", "if you are an agent", or a sentence that opens with a command. [`src/lib/policy.ts`](src/lib/policy.ts) holds the rule and the wording it catches. Write what is true of the project: who it suits, what it needs, what it is not.

A page's own Markdown is documentation for people, and a how-to may tell its reader to run a command. That is carried into `llms-full.txt` as written.

## Working on the sites

```bash
mise install            # node, pnpm, and the linters
pnpm install
pnpm dev                # the hub, from content/
```

`STEADING_CONTENT` points a build at any project's repository:

```bash
STEADING_CONTENT=../skift pnpm dev
```

To look at finished builds the way a static host serves them:

```bash
pnpm build:all          # dist/steading, and dist/fixture (a made-up project that uses every field)
pnpm serve              # http://127.0.0.1:4410 and :4412
```

### Checks

`hk check --all` runs the linters and `astro check`. `hk run pre-push --all` runs the rest, in order:

| Command | What it proves |
|---------|----------------|
| `pnpm test` | The brand's colors meet WCAG AA against every surface they sit on; links, navigation, and `llms.txt` come out as specified. |
| `pnpm build:all` | The hub, and a fixture project that uses every field and every kind of link, both build. |
| `pnpm test:dist` | Every internal link resolves, every page has its Markdown twin, nothing loads from another origin, and fonts stay under 120 KB. |
| `pnpm test:e2e` | No WCAG 2.2 AA violations in light or dark, on a desktop or a phone; the keyboard reaches everything; the prompt copies. Needs `pnpm exec playwright install chromium`. |

## Adding a project

Add it to `PROJECTS` in [`src/projects.ts`](src/projects.ts): its name, the problem it answers in the words of someone who has it, what it does about that, its status, its two colors, and its mark's shape (drawn in [`src/lib/mark.ts`](src/lib/mark.ts)). The hub lists projects by those problems, and so does `llms.txt`, because a visitor arrives with a problem and not with a project's name. A test fails if either color is too faint against the theme it belongs to. Leave `site` unset until the project's site is deployed; nothing links to a site before that.

## Publishing a project's site

In the project's repository, add a `site.yaml` beside the README, and this workflow as `.github/workflows/site.yml`:

```yaml
name: Site

on:
  push:
    branches: [main]
    paths: ["site.yaml", "README.md", "docs/**", ".github/workflows/site.yml", ".github/workflows/actions.lock"]
  pull_request:
    paths: ["site.yaml", "README.md", "docs/**", ".github/workflows/site.yml", ".github/workflows/actions.lock"]
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
      - uses: actions/checkout@v7.0.1
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
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - id: site
        uses: steading-ai/stead.ing@main
```

The action takes two inputs: `content`, the folder that holds `site.yaml`, the README and `docs/` (default: the repository itself), and `deploy`, which builds without publishing when `"false"`.

The project's repository never installs Node or carries a lockfile. Astro, Tailwind, and everything else are pinned here and kept current by Renovate here. The project's `.github/workflows/actions.lock`, written by [`gh actions-lock`](https://github.com/github/gh-actions-lock), pins `steading-ai/stead.ing@main` to a commit, and pins the actions the site action runs too. `gh actions-lock --relock` moves the project to the newest commit of this repository; the pull request that carries the new lockfile builds the site as its check, so an update that breaks a project's site stops there.

Then, once per site, in this order:

1. In the repository's settings, set Pages to deploy from GitHub Actions and run the workflow.
2. Set the custom domain to `<project>.stead.ing` in the same settings.
3. Add the DNS record: a `CNAME` from `<project>` to `steading-ai.github.io`, DNS-only. `stead.ing`'s records are managed in `ivy/homestead`'s Terraform.
4. When GitHub has issued the certificate, turn on "Enforce HTTPS". Because the domain was set before its record existed, GitHub's first check of it failed, and it can be slow to look again. If no certificate has appeared a few minutes after the record resolves, clear the custom domain and set it again straight away; the certificate follows within a minute.
5. Set the project's `site` in `src/projects.ts`, so the hub and the other sites start linking to it.

The domain is set before the record exists so that nobody else can claim the address in between.

## License

[ISC](LICENSE.md).
