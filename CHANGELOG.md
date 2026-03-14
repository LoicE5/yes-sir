# Changelog

All notable changes to this project are documented here, grouped by feature branch / pull request.

---

## [1.O.O] — bun-migration-and-improvements (PR #5)

### Added
- `bun run setup:env` script to copy `.env.local.example` to `.env.local`
- `bun-types` dev dependency for TypeScript awareness of Bun globals
- Unit test suite in `test/functions.test.ts` using Bun's built-in test runner, covering `calculateTimer`, `casualHash`, `randomInt`, `isVpnFromIpInfo`, `isIpv6`, `hasNumber`, and input validation logic
- Bruno API collection in `test/bruno/` with requests and assertions for all API routes: `generate_code`, `process_attendance`, `keep_db_awake`, and `auto_archive` (including error and unauthorized variants)
- `local` Bruno environment with `baseUrl` and `cronSecret` variables

### Changed
- Migrated package manager from npm to **Bun**; replaced `package-lock.json` with `bun.lock`
- Upgraded **Next.js** to v16, **React** to v19, **ESLint** to v9
- Updated `tsconfig.json` target to match Bun's TypeScript requirements
- Applied consistent code style: keyword spacing, descriptive variable names, arrow functions, no unsafe type assertions
- Increased DB keep-alive cron frequency; added `Cache-Control: no-store` header to the keep-alive route to prevent edge caching
- Fixed `vercel.json` formatting

### Fixed
- Used `.at()` for array index access in `storage.ts` to avoid potential undefined access on last element

---

## IndexedDB setup (PR #4)

### Changed
- Replaced `localStorage` with **IndexedDB** for client-side attendance token storage, improving persistence and storage capacity

---

## Archive old data (PR #3)

### Added
- `/api/auto_archive` serverless function that deletes codes and attendance records older than a configurable threshold
- Vercel cron job to run `auto_archive` on a weekly schedule

---

## Calculate time from server (PR #2)

### Changed
- Server-side timestamp (`js_time`, `js_expiry`) is now calculated in the backend and returned in the `generate_code` response, preventing clock skew between client and server

---

## Initial release / Supabase setup (PR #1)

### Added
- Next.js project scaffold via `create-next-app`
- Three-page application: Home, Teacher, Student
- `/api/generate_code` — generates a random 1–999999 code, stores it in Supabase with an expiry, and returns it to the teacher
- `/api/process_attendance` — validates the student's submitted code against the database, records attendance, and applies anti-cheat checks (IP comparison, duplicate detection)
- Supabase integration (`@supabase/supabase-js`) for code and attendance persistence
- IP Quality Score integration to detect VPN, proxy, and Tor usage
- Vercel Analytics and Speed Insights
- `/api/keep_db_awake` cron job to prevent Supabase free-tier hibernation (runs every 3 days)
- Vercel cron job configuration in `vercel.json`
- CC BY-NC-ND 4.0 license
- `.env.local.example` with required environment variable names
- Title and favicon customisation
