# Buzhao Liu website

Personal research notebook and blog for Buzhao Liu at <https://tavialiu.com>.

## Structure

- `_research/`: public research notes, survey maps, paper notes, and project pages.
- `_posts/`: essays, logs, fragments, and literature-review notes.
- `_private/`: local-only private notes. This directory is ignored by Git.

## Add a Public Note

```bash
touch _posts/YYYY-MM-DD-short-title.md
```

Then edit the front matter and body.

## Keep a Note Private

For genuinely private notes, keep the file under `_private/` or use a
`.private.md` suffix. Both are ignored by Git and excluded from the published
site.

You can also add this front matter to prevent Jekyll from publishing a file:

```yaml
visibility: private
published: false
```

Important: if this repository is public, any committed source file should be
treated as public, even if the generated website does not link to it.
