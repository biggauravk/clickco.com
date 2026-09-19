# Meridian Deployment-Ready Project

This archive is arranged with the project root at the archive root. `package.json` is directly at the top level so GitHub/Vercel will detect the project correctly.

## Correct build setup

- Install command: `npm ci`
- Build command: `npm run build`
- `vercel.json` explicitly enforces both commands
- Do not configure the host to run `nitro build`

## Included

- Complete source tree
- Public assets
- Supabase SQL
- Vercel/Nitro production output in `.vercel/output/`
- `vercel.json`, package manifests, configuration, and deployment documentation

## Excluded

Dependencies, Git metadata, local environment files, secrets, logs, and temporary folders are excluded.
