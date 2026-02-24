# How to Publish an Angular Library to GitLab's npm Registry

GitLab (Community Edition 13.x+) includes a built-in npm package registry. No extra infrastructure needed.

## Prerequisites

- A GitLab project with `packages_enabled: true` (default for new projects)
- A GitLab Personal Access Token with `api` scope
- An Angular library already built (see `01-convert-component-to-library.md`)

## Step 1: Verify the Package Registry is Available

```bash
# Check your GitLab version
curl -s -H "PRIVATE-TOKEN: <your-token>" "http://gitlab.minilab/api/v4/version"

# Check packages are enabled on a project
curl -s -H "PRIVATE-TOKEN: <your-token>" \
  "http://gitlab.minilab/api/v4/projects/<PROJECT_ID>" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['packages_enabled'])"
```

If `packages_enabled` is `false`, enable it in Project Settings > General > Visibility > Package Registry.

## Step 2: Create a GitLab Project (if needed)

If you don't already have a GitLab project for this package:

```bash
curl -s -X POST \
  -H "PRIVATE-TOKEN: <your-token>" \
  -H "Content-Type: application/json" \
  "http://gitlab.minilab/api/v4/projects" \
  -d '{
    "name": "ngx-time-range-slider",
    "namespace_id": 7,
    "description": "Angular time range slider component",
    "visibility": "internal",
    "packages_enabled": true
  }'
```

Note the `id` from the response — you'll need it for the registry URL.

For this project: **ID 93**, path `halo/ngx-time-range-slider`.

## Step 3: Configure npm Authentication

Create `.npmrc` in your library's source directory (`projects/time-range-slider/.npmrc`):

```
@halolabs:registry=http://gitlab.minilab/api/v4/projects/93/packages/npm/
//gitlab.minilab/api/v4/projects/93/packages/npm/:_authToken=<your-gitlab-token>
```

**Important:** Add this file to `.gitignore` — it contains your auth token.

```bash
echo "projects/time-range-slider/.npmrc" >> .gitignore
```

## Step 4: Build the Library

```bash
ng build time-range-slider
```

This produces the publishable package in `dist/time-range-slider/`.

## Step 5: Publish

Copy the `.npmrc` into the dist directory and publish:

```bash
cp projects/time-range-slider/.npmrc dist/time-range-slider/
cd dist/time-range-slider
npm publish
```

You should see:
```
+ @halolabs/ngx-time-range-slider@1.0.0
```

## Step 6: Verify on GitLab

Navigate to your GitLab project > Packages & Registries > Package Registry. You should see the published package listed there.

Or via API:
```bash
curl -s -H "PRIVATE-TOKEN: <your-token>" \
  "http://gitlab.minilab/api/v4/projects/93/packages" \
  | python3 -m json.tool
```

## Publishing Updates

To publish a new version:

1. Update the version in `projects/time-range-slider/package.json`
2. Rebuild: `ng build time-range-slider`
3. Copy `.npmrc` and publish: `cp projects/time-range-slider/.npmrc dist/time-range-slider/ && cd dist/time-range-slider && npm publish`

npm will reject duplicate versions — always increment before publishing.

## Registry URL Reference

| Scope | URL |
|-------|-----|
| Project-level | `http://gitlab.minilab/api/v4/projects/<ID>/packages/npm/` |
| Group-level (read) | `http://gitlab.minilab/api/v4/groups/<ID>/-/packages/npm/` |

Group-level URLs let consumers install any package from the group with a single registry entry.
