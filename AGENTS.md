# Project specifications

- The overall spec for the app is at ./specs/spec.md
- The spec for data storage is located at ./specs/data.spec.md

After making any code changes to typescript files (.ts/.tsx), run `npm run build` to check the typescript build
Then run the Prettier formatter: `npm run format`

Four cron pipelines drive content generation: events → articles → editions → daily edition. See `crontab.txt` and README.md for the full pipeline details.

The `/api/cron/*` routes are triggered by system crontab (see `crontab.txt`), not by the frontend.