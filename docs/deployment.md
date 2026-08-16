# Deployment

K-Weather is hosted on **AWS Amplify Hosting**. Amplify connects directly to the GitHub repository and builds, hosts, and serves the app automatically — no servers to manage, no manual uploads.

## Two environments, two branches

Amplify treats every connected Git branch as its own environment. K-Weather has two:

| Branch | Amplify stage | Purpose | URL |
|---|---|---|---|
| `main` | DEVELOPMENT | Test environment | `https://test-weather.konarobinson.com` |
| `prod` | PRODUCTION | Production environment | `https://weather.konarobinson.com` |

Both branches have **auto-build enabled**, so a push to either branch triggers a fresh deployment to its URL.

## How a deployment happens

1. Code is merged into `main` (or `prod`) via a pull request — branch protection requires it.
2. GitHub notifies Amplify of the push.
3. Amplify starts a build job using the build spec in [`amplify.yml`](../amplify.yml).
4. On success, the generated static files are published to that branch's environment and the new version goes live.

Promoting to production is simply a merge of `main` → `prod`, which kicks off the `prod` deployment.

## The build spec

`amplify.yml` drives the build:

```yaml
version: 1
applications:
  - appRoot: .
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: out
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/.cache
```

| Phase | What it does |
|---|---|
| `preBuild` | Installs dependencies with `npm ci` |
| `build` | Runs `npm run build`, producing a static export |
| `artifacts` | Publishes the contents of `out/` — every file — as the deployed site |
| `cache` | Caches `node_modules/.cache` between builds to speed up repeat builds |

## Static export

`next.config.ts` sets `output: "export"`, so the build emits a fully static site into `out/` — plain HTML, CSS, and JS with no Node.js server required. Amplify uploads these files and serves them through its CDN.

`trailingSlash: true` produces clean directory-based paths (e.g. `/privacy/index.html`) so Amplify can resolve URLs without extension rewriting.

Because the site is fully static, no build-time environment variables or server-side configuration are needed.

## Rolling back

Every build job is retained in the Amplify console. To revert a bad release:

1. Open the **Amplify console** → **k-weather** app.
2. Select the branch you want to revert (`main` or `prod`).
3. Find the job you want to restore and choose **Redeploy**.

That re-publishes the previous version without touching the Git history.

## Related links

- [AWS Amplify console](https://eu-west-2.console.aws.amazon.com/amplify/apps/d2ci6n23cawsj8)
- [README](../README.md)
