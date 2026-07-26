# Blogger Templates

Personal collection of Blogger themes. One directory per template, containing the theme XML (plus companion JS where applicable).

| Template | Description |
|----------|-------------|
| [technote](technote/) | Developer-notes style: two-column layout, dark mode, Prism code highlighting, Mermaid diagrams |
| [simpledays](simpledays/) | Refactor of the classic Picture Window theme: warm cream palette and original widget set, Layout v3 + Bootstrap 5 responsive grid, dark mode |

## Applying a template to Blogger

### 1. Back up the current theme

Blogger dashboard → **Theme** → **⋮** (next to Customize) → **Backup**, and keep the downloaded XML. Uploading a new theme replaces everything; widget configs on the Layout page may be lost.

### 2. Upload the theme XML

1. Get the template file, e.g. `simpledays/template.xml` (prefer a released tag over the work-in-progress `main` branch).
2. Blogger dashboard → **Theme** → **⋮** → **Restore** → upload the XML.
3. Visit the site and confirm it renders.

### 3. Check the JS reference (technote only)

technote loads its companion JS from jsDelivr pinned to a git tag (`<x.y.z>` = the version of that XML):

```html
<script src='https://cdn.jsdelivr.net/gh/aleck31/blogger-template@v<x.y.z>/technote/main.js'/>
```

XML and JS ship together: **the XML of a given tag already points at the JS of the same tag** — normally nothing to change. Only mind this after hand-editing the template: jsDelivr caches tags permanently, so never switch the reference to a branch name like `@main` or you may get a stale cache.

simpledays is a single-file template — all JS is inlined in the XML, no external references. Skip this step.

### 4. Dashboard configuration

Common:

- **Layout** page: gadgets are managed per section by drag and drop; after uploading, verify all gadgets survived.
- **Theme → Customize**: main color, backgrounds, fonts — everything declared as `<Variable>` in the template. User changes override template defaults; recheck them after upgrading the template.

technote:

- **Label convention**: the sidebar Categories list only shows labels prefixed with `#` (e.g. `#AI`, `#Cloud`); unprefixed labels render as code-style chips on post cards. Tag posts accordingly to separate "categories" from "tags".

simpledays:

- **Blog List (blogroll) must be re-entered**: the list data lives in your Blogger account's widget settings, not in the template XML. After upload the section is empty — re-add entries under **Layout → Sidebar Links → Blog List**.
- **Pages navigation**: PageList links (Service/Beliefs/Albums/Archives/About) also live account-side; after upload, confirm the tabs and their order on the Layout page.

## Versioning

- The release unit is a **git tag**, `v<major>.<minor>.<patch>` (moving to `<template>-v<x.y.z>` prefixes now that multiple templates coexist).
- Version markers inside the XML must stay in sync: the `b:templateVersion` attribute, the Layout-page badge (`body#layout:before` content), and — for technote — the jsDelivr tag reference.
- jsDelivr caches tag snapshots permanently: never amend a published tag; fix bugs by bumping patch and tagging again.
- Upgrading a site = uploading the newer tag's XML; rolling back = uploading the older tag's XML.

## Local development

- Templates are single-file XML; CSS lives inside `<b:skin><![CDATA[...]]]></b:skin>` — mind XML escaping (`<`, `&`), and never write literal tag-like text (e.g. an example `<p>`) in skin CSS comments: Blogger scans the whole skin for `<Variable>` declarations and rejects the upload on stray angle brackets.
- Blogger renders server-side: a `b:eval` referencing a nonexistent data member kills the whole gadget ("Failed to render gadget"), possibly only under specific data conditions (e.g. only on posts that have comments). Exercise the real branch when testing includable changes.
- Run `.dev/tools/check-template.py <template.xml>` before every upload; more field notes and tooling live in `.dev/` (not tracked in git).
- For technote JS changes, reference a commit sha during development to bypass the CDN cache: `@<short-sha>/technote/main.js`.
- Verify on a separate test blog before touching the live site.
