# tavia-liu.github.io

Personal research notebook and blog for <https://tavialiu.com>.

## Structure

- `_research/`: public research notes, survey maps, paper notes, and project pages.
- `_posts/`: public blog posts using Jekyll's `YYYY-MM-DD-title.md` format.
- `_posts/`: essays, logs, fragments, and literature-review notes.
- `_private/`: local-only private notes. This directory is ignored by Git.
- `templates/`: starter front matter for new notes.

## Add a Public Note

Copy one of the files in `templates/` into the matching collection:

```bash
cp templates/research-note.md _research/YYYY-MM-DD-short-title.md
cp templates/blog-post.md _posts/YYYY-MM-DD-short-title.md
cp templates/blog-post.md _posts/YYYY-MM-DD-short-title.md
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
