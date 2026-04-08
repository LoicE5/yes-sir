# Yes Sir

Yes Sir is a web application built to illustrate a friend's group startup idea and pitch at ESSEC Business School (France). It enhances attendance checks in classes using a one-time code system that both teachers and students can use.

Built with **Next.js**, **Bun** and **Supabase**, it features three pages:

- **Home** — The welcome page where the user selects their role (student or teacher).
- **Teacher** — The teacher generates a one-time unique code for their class (OTP-inspired), valid for a configurable duration.
- **Student** — Students enter the code to confirm their attendance.

The app is intentionally simple to use, while including anti-cheat mechanisms: IP address comparison (IPv4/IPv6) and IndexedDB key storage detect duplicate submissions without requiring any user authentication.

---

## Requirements

- [Bun](https://bun.sh) >= 1.0
- A [Supabase](https://supabase.com) project
- An [IP Quality Score](https://www.ipqualityscore.com/) API key

---

## Setup

Copy the example environment file and fill in your credentials:

```bash
bun run setup:env
```

Then edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `IPQUALITYSCORE_API_KEY` — your IP Quality Score API key
- `CRON_SECRET` — a secret string used to authenticate cron job requests

---

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Start the development server at `http://localhost:3000` |
| `bun run build` | Build the application for production |
| `bun run start` | Start the production server (requires a prior build) |
| `bun run lint` | Run ESLint across the `src/` directory |
| `bun test` | Run unit tests with Bun's built-in test runner |
| `bun run setup:env` | Copy `.env.local.example` to `.env.local` |

---

## Testing

The project has two layers of testing: **unit tests** and **API integration tests** via Bruno.

### Unit tests

Unit tests live in [test/functions.test.ts](test/functions.test.ts) and use Bun's built-in test runner (no extra dependencies needed).

Run them with:

```bash
bun test
```

The tests cover the utility functions in `src/utils/functions.ts`:

- `calculateTimer` — countdown formatting and expiry detection
- `casualHash` — deterministic RIPEMD-160 hashing for IP addresses
- `randomInt` — bounded random integer generation
- `isVpnFromIpInfo` — VPN/proxy/Tor detection from IP Quality Score response
- `isIpv6` — IPv4 vs IPv6 detection
- `hasNumber` — digit presence check in strings
- Input validation logic (class name rules)

### API tests (Bruno)

API integration tests live in [test/bruno/](test/bruno/) and use [Bruno](https://www.usebruno.com/), an open-source API client. Each `.bru` file is a self-contained request with built-in assertions.

**Install Bruno** from [usebruno.com](https://www.usebruno.com/) or via Homebrew:

```bash
brew install bruno
```

**Run the collection** by opening Bruno, importing the `test/bruno/` folder as a collection, selecting the `local` environment, and running requests individually or as a full collection.

The `local` environment (defined in [test/bruno/environments/local.bru](test/bruno/environments/local.bru)) sets:
- `baseUrl` → `http://localhost:3000`
- `cronSecret` → `test-cron-secret`

**Available requests:**

| File | Method | Endpoint | Description |
|---|---|---|---|
| `generate_code.bru` | POST | `/api/generate_code` | Generate a valid class code |
| `generate_code_missing_class_name.bru` | POST | `/api/generate_code` | Reject request with missing `class_name` |
| `generate_code_wrong_method.bru` | GET | `/api/generate_code` | Reject wrong HTTP method |
| `process_attendance.bru` | POST | `/api/process_attendance` | Submit valid attendance |
| `process_attendance_missing_params.bru` | POST | `/api/process_attendance` | Reject request with missing parameters |
| `keep_db_awake.bru` | GET | `/api/keep_db_awake` | Authorized cron ping to keep DB alive |
| `keep_db_awake_unauthorized.bru` | GET | `/api/keep_db_awake` | Reject unauthorized cron request |
| `auto_archive.bru` | GET | `/api/auto_archive` | Authorized cron to archive old records |
| `auto_archive_unauthorized.bru` | GET | `/api/auto_archive` | Reject unauthorized cron request |

> Make sure the dev server is running (`bun run dev`) before executing Bruno tests.

---

## Deployment

The app is deployed on [Vercel](https://vercel.com). Cron jobs are configured in [vercel.json](vercel.json):

- `/api/keep_db_awake` — runs every 3 days to prevent Supabase free-tier hibernation
- `/api/auto_archive` — runs weekly to archive old codes and attendance records

---

## View the project

[yes-sir-class.vercel.app](https://yes-sir-class.vercel.app/)

---

## Legal

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://yes-sir-class.vercel.app/">Yes Sir</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://github.com/loice5">Loïc Etienne</a> is licensed under <a href="http://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC-ND 4.0<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1"></a></p>
