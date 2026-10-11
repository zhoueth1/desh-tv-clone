# desh-tv-clone

The existing Desh TV scraper and news/poll frontend, upgraded on October 11, 2026. The Pages Router, page layout, CSS values, categories, article URLs, English translations, and dashboard workflow are preserved.

Use Node **26.11.1** (`.nvmrc`) and npm **12.2.0**. Dependencies are pinned and `package-lock.json` is the reproducible installation source. Next.js 16.4, React 19.3, Keystone 8.1, and Prisma 7.10 are installed. Prisma 8 is currently a release candidate; GraphQL 16.14.2 is the newest release compatible with Keystone and graphql-request. Obsolete Keystone 4, Cloudscraper, Lingva, Faker, and unused Apollo dependencies were removed. Prisma's older transitive MySQL/deepmerge packages are overridden to current releases and covered by the build/database checks.

## Configure Supabase

Copy `.env.example` if starting a new checkout. Next loads `.env.local` before `.env`, and shell environment variables take precedence over both.

`DATABASE_URL` must be a **PostgreSQL connection URI**, rather than `NEXT_PUBLIC_SUPABASE_URL`. On an IPv4 connection, open Supabase **Connect → Session pooler** and copy the pooler URI, inserting your database password. URL-encode special characters in the password. The direct `db.<project>.supabase.co` endpoint requires IPv6 unless the project has the IPv4 add-on. The project's Supabase web URL and publishable key alone cannot connect Keystone/Prisma.

The connection uses `sslmode=verify-full&sslrootcert=certs/supabase-prod-ca-2021.crt` to verify the server certificate and hostname. The included public root certificate comes from the [certificate download URL published in Supabase's dashboard source](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json). Keep the `certs` directory available when running the server or database scripts.

Remove `DIRECT_URL` when you do not have a separate reachable migration connection. If provided, it must refer to the same database project. A connection pointing at a different Supabase project is ignored to prevent migrations targeting the old database.

The original dashboard credentials remain `admin` / `password` unless `ADMIN_USERNAME` and `ADMIN_PASSWORD` are provided. Set `NEXTAUTH_SECRET`; the older `NEXT_AUTH_SECRET` variable also remains supported. `NEXT_PUBLIC_HOST_URL` should match the app's origin, normally `http://localhost:3000`.

## Initialize and run

```powershell
npm ci
npm run db:check
npm run db:setup
npm run db:initialize
npm run dev
```

`db:check` verifies the configured connection. `db:setup` previews missing tables; `db:initialize` creates missing project tables/indexes, enables RLS, and seeds the original categories in a transaction. It is repeatable and does not reset or delete existing data. It stops if existing columns do not match the expected schema. Tables are accessed through the server's Keystone GraphQL API; Supabase's browser Data API roles have no direct access policies.

The app runs at `http://localhost:3000`; GraphQL and its explorer are at `/api/graphql`, login is `/coolkidsonly`, and scraping is managed at `/dashboard`. No separate Keystone process is required for the app. `npm run keystone:dev` is still available for the standalone admin UI at `/admin`.

Production:

```powershell
npm run build
npm start
```

Client generation runs on install and before development/type checking. The pinned Prisma, esbuild, and protobuf installation scripts are explicitly approved in `package.json` for npm 12.

## Verify

```powershell
npm run typecheck
npm run test:scraper
npm run scraper:check
npm run test:database
npm run build
npm run test:browser
npm run test:upload
```

`test:scraper` uses deterministic parser/status/concurrency cases. `test:scraper:routes` additionally checks bulk inserts, recommendation links, and duplicate retries against an isolated localhost PostgreSQL database; it removes its fixtures afterward. `scraper:check` makes read-only requests to live Desh/translation/image endpoints. `test:database` uses the configured database, checks GraphQL CRUD/documents/images/recommendations/atomic votes/RLS, and rolls back its verification records. Run it after database initialization. `test:browser` checks desktop/mobile pages, pagination, login, and navigation in a running app. It uses installed Edge on Windows; set `BROWSER_CHANNEL` to another installed Playwright channel if needed. `test:upload` checks real HTTP multipart image upload/serving/update and cleans up its temporary article/file. Set `TEST_BASE_URL` when the app is not at localhost:3000. Browser voting verification is optional: set `TEST_ALLOW_WRITES=1` only with an isolated localhost test server; the temporary poll is removed afterward.

English translation still uses Google's browser translation transport, matching the original scraping approach. External site markup and provider availability can change; failures are returned in the dashboard's existing summary.

Legacy category/recommendation transfer buttons require `OLD_DATABASE_URL` for the optional old MySQL or PostgreSQL source. All current article/poll storage uses the new PostgreSQL database.

Upgrade references: [Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16), [Keystone 8 migration](https://keystonejs.com/docs/guides/migrate-to-8/), [Supabase connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres).
