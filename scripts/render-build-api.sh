#!/usr/bin/env bash
# Render.com build hook — no Docker required on developer machines.
set -euo pipefail
corepack enable
corepack prepare pnpm@9.14.2 --activate
pnpm install --frozen-lockfile
pnpm --filter=@roam/types build
pnpm --filter=@roam/db build
pnpm --filter=@roam/api build
