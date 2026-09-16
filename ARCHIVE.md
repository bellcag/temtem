# Process V20 archive

Frozen snapshot. **Do not merge this branch into the live guide.**

- Branch: `archive/process-v20`
- Hosted at: https://bellcag.github.io/temtem/v20/
- Process is v20 only. `/process` and `/process-v20` open the same guide.
- Later process URLs (`/process-v21`–`/process-v24`, `/works`) redirect back to `/process`.
- Role switcher changes login only. It does not jump to v24. Reset Works is not on this branch.

## New idea from this freeze

```bash
git fetch origin
git checkout -b experiment/v20-your-idea origin/archive/process-v20
```

Tell Cursor: work only on `experiment/v20-your-idea`. Do not edit `archive/process-v20`, the live branch, or the Pages root.

Deploy an experiment to its own folder (`/v20-your-idea/`), never over `/` or `/v20/`.
