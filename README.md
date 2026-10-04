# Store — single-app eCommerce (Next.js + Express + Prisma)

Storefront, admin panel and JSON API live in **one Node.js process** on **one
port**. There is no separate API URL, no CORS setup and no second hosting slot.

```
store-app/
├── server.js          single entry point: Express API + Next.js SSR
├── app/ components/ lib/   Next.js App Router storefront + admin
├── api/               Express 5 API (routes, Prisma access, mail, storage)
├── prisma/            schema + migrations
├── public/uploads/    uploaded product images (local storage provider)
├── dist/              compiled output of api/  (tsc, tsconfig.server.json)
└── .next/             Next.js build output
```

## Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | Next.js 15 App Router, React 19, TypeScript, Tailwind v4, HeroUI  |
| Backend   | Express 5, Zod, bcryptjs, Multer, Nodemailer, AWS SDK (S3)         |
| Database  | Prisma 6 → MySQL                                                   |
| Auth      | Bearer session tokens stored in the database, role based            |
| Secrets   | AES-256-GCM for payment / SMTP / courier / AI credentials          |

## Local development

1. Copy the env file and point `DATABASE_URL` at a MySQL server:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Install and prepare the database:

   ```powershell
   npm install
   npm run prisma:deploy   # apply migrations (use prisma:migrate in dev to create new ones)
   npm run seed            # optional demo catalogue
   ```

3. Start everything on <http://localhost:3000>:

   ```powershell
   npm run dev
   ```

   Editing a file under `api/` restarts the API; edits inside `app/`,
   `components/` or `lib/` hot-reload through Next.js. Only one process runs.

## Production build

```powershell
npm run build     # prisma generate + next build + tsc for the API
npm start         # node server.js, listens on $PORT (default 3000)
```

`npm start` fails fast with a clear message if `dist/server.js` is missing —
run `npm run build` first.

### Environment variables

| Variable            | Required | Purpose                                                            |
| ------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`      | yes      | MySQL connection string used by Prisma                              |
| `PORT`              | yes      | Port the single server binds to (Hostinger sets this for you)       |
| `APP_ENCRYPTION_KEY`| yes      | AES-256-GCM key (≥ 32 chars) for stored gateway credentials         |
| `FRONTEND_URL`      | no       | CORS allow-list; only needed if the API is hosted separately        |
| `INTERNAL_API_URL`  | no       | Absolute origin for server-side fetches; defaults to `127.0.0.1:$PORT` |
| `HOST`              | no       | Bind address, defaults to `0.0.0.0`                                 |

Generate an encryption key with `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

## Deploying to Hostinger

### 1. Create the Node.js application

hPanel → **Websites → Node.js → Create** and pick the domain you want to sell
on. Hostinger provisions a folder such as `~/node_app` with a `server.js`
startup file — that is exactly our entry point, so nothing else is needed.

Requirements: Node.js **22** (20 works), and the **Node.js** Web Application
feature (Business/Cloud plans).

### 2. Upload the code

Upload the whole `store-app/` directory (Git, SFTP or the hPanel file manager)
and **exclude** `node_modules`, `.next`, `dist`, `.env` and `*.log` — those are
produced on the server.

### 3. Create the database

hPanel → **Databases → MySQL Databases**, create a database and a user with
full privileges. Hostinger usually restricts connections to `localhost`, so
keep the host as `localhost` in the connection string.

### 4. Configure environment variables

Either add a `.env` file inside the app folder:

```dotenv
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
PORT=3000
APP_ENCRYPTION_KEY=<64 hex characters>
FRONTEND_URL=https://yourstore.com
```

or set them in hPanel → **Node.js app → Environment variables**.

### 5. Install, build, migrate

Open the **Node.js terminal** (or SSH) inside the app folder:

```bash
npm install
npm run deploy     # prisma generate + migrate deploy + next build + tsc
```

`npm run deploy` is idempotent, so re-running it after every deploy applies any
new migrations.

> If the host only allows `npm install --omit=dev`, the Next.js build cannot run
> there. In that case build on your machine (`npm run build`), upload `.next`
> and `dist` too, then run `npm install --omit=dev` on the server.

### 6. Start the app

hPanel → **Node.js app → Restart**, and confirm the startup file is `server.js`.
Logs appear under the same screen.

The storefront, `/api/*`, `/uploads/*`, `/admin` and `/onboarding` are all
served from the same domain.

## Local file storage vs S3

New installs have no storage provider configured. Open `/admin` →
**Storage** after onboarding and pick one:

- **Local** — files are written to `public/uploads/products` inside the app
  folder. Works if the app directory is writable; included in your uploads.
- **Hostinger Object Storage / S3** — files go to a bucket and are served from
  its public URL. Recommended once the store is live, and it survives app
  re-deploys.

SMTP, payment gateways (bKash, Nagad, SSLCommerz), courier (Steadfast) and AI
credentials are stored encrypted in the database from `/admin` → **Settings**;
they never belong in a frontend env file.

## Adding a new API route

Add it to `api/server.ts` under `/api/...`. Because the API app is mounted at
the root of `server.js`, the path is already the public path — the browser calls
`/api/your-route` on the same origin.