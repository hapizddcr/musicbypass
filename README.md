# AudioForge

> Professional audio processing SaaS platform with cloud automation.

A production-ready Next.js 15 application for converting, trimming, normalizing, and processing audio files in the cloud. Built with TypeScript, Prisma, Auth.js, and Stripe-grade payment integration.

---

## ✨ Features

- 🎵 **Multi-format conversion** — MP3, WAV, OGG, AAC, FLAC
- ✂️ **Audio editing** — Trim, fade in/out, normalize, speed, amplify
- 📊 **Real-time waveform** with built-in player
- 🔐 **OAuth + Email** auth (Discord, Google, Credentials)
- 💳 **Subscription billing** via Midtrans (QRIS, VA, etc.)
- ☁️ **Cloudflare R2** for scalable object storage
- ⚡ **Background workers** with realtime progress
- 🛡️ **Role-based admin panel** with full audit log
- 🎨 **Modern dark UI** with glassmorphism & purple accents
- 🌐 **Remote URL upload** — process audio from any HTTP(S) source

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.7 |
| **Styling** | TailwindCSS 3.4 + shadcn/ui |
| **Animations** | Framer Motion |
| **State** | Zustand + React Query |
| **Auth** | Auth.js (NextAuth v5) |
| **ORM** | Prisma 5.22 |
| **Database** | PostgreSQL 16 |
| **Storage** | Cloudflare R2 (S3 API) |
| **Payments** | Midtrans |
| **Validation** | Zod |
| **Audio** | ffmpeg (via worker) |
| **Tests** | Vitest + Testing Library |
| **Deployment** | Docker, Nginx, GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (tested on 22)
- PostgreSQL 14+
- ffmpeg (for audio processing)
- npm / pnpm / yarn

### 1. Clone & Install

```bash
git clone https://github.com/hapizddcr/musicbypass.git
cd musicbypass
npm install
```

### 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/audioforge?schema=public"

# Auth.js
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="audioforge"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Midtrans
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
MIDTRANS_NOTIFICATION_URL="https://yourdomain.com/api/payment/webhook"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a secret: `openssl rand -base64 32`

### 3. Database Setup

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This creates 3 plans (Free/Starter/Pro) and a super-admin user:
- Email: `admin@audioforge.app`
- Password: `Admin123456`

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 5. Run Audio Worker (separate terminal)

```bash
npm run worker
```

---

## 📦 Production Deployment

### Docker (Recommended)

```bash
# Build images
docker compose build

# Start all services (app, worker, postgres, nginx)
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed
docker compose exec app npm run db:seed
```

Services:
- `app` — Next.js application (port 3000)
- `worker` — Background audio processor
- `postgres` — Database (port 5432)
- `nginx` — Reverse proxy with SSL (ports 80, 443)

### SSL Setup

Place your certificates at `./certs/fullchain.pem` and `./certs/privkey.pem`.

### Manual Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "audioforge-app" -- start
pm2 start npm --name "audioforge-worker" -- run worker

# Or with systemd (see /etc/systemd/system/audioforge.service)
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Integration tests (requires test DB)
npm run test:integration

# Type check
npm run typecheck

# Lint
npm run lint
```

Current test coverage: **36 tests passing** (utils, validations, rate-limit, password, midtrans).

---

## 🏗️ Project Structure

```
audioforge/
├── prisma/              # Database schema & migrations
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── (dashboard)/ # Authenticated routes
│   │   │   ├── dashboard/
│   │   │   ├── workspace/
│   │   │   ├── uploads/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── admin/       # Admin panel
│   │   ├── api/         # API routes
│   │   ├── login/
│   │   ├── register/
│   │   └── page.tsx     # Landing
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── landing/     # Landing sections
│   │   ├── admin/
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── lib/             # Core utilities
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── storage.ts
│   │   ├── audio-processor.ts
│   │   ├── midtrans.ts
│   │   ├── rate-limit.ts
│   │   ├── audit.ts
│   │   ├── password.ts
│   │   ├── logger.ts
│   │   ├── validations.ts
│   │   └── utils.ts
│   ├── types/
│   └── middleware.ts
├── workers/
│   └── audio-worker.ts  # Standalone job processor
├── .github/workflows/   # CI/CD
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

---

## 🔐 Security

- **Authentication** via Auth.js with secure JWT sessions
- **Password hashing** with bcrypt (12 rounds)
- **Rate limiting** in-memory token bucket (60 req/min default)
- **Input validation** with Zod on all endpoints
- **CSRF protection** via Auth.js
- **Security headers** (HSTS, X-Frame-Options, X-Content-Type-Options)
- **Audit logging** for sensitive operations
- **File upload validation** (size limits, MIME type checks)

For production, consider:
- Upstash Redis for distributed rate limiting
- Cloudflare WAF / DDoS protection
- Regular dependency audits (`npm audit`)

---

## 📊 Database Schema

10 models with proper relations:

- **User** — Account, sessions, role-based access (USER/ADMIN/SUPER_ADMIN)
- **Account/Session/VerificationToken** — Auth.js schema
- **AudioFile** — Uploaded audio metadata
- **AudioJob** — Processing jobs (queued/processing/completed/failed)
- **Plan** — Subscription tiers
- **Subscription** — Active user subscriptions
- **Payment** — Midtrans payment records
- **Notification** — User notifications
- **AuditLog** — Security/activity audit trail

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js handlers |
| `POST` | `/api/upload` | Upload audio (file or URL) |
| `POST` | `/api/jobs/create` | Create processing job |
| `GET` | `/api/jobs` | List user's jobs |
| `GET/DELETE` | `/api/jobs/[id]` | Get/cancel a job |
| `DELETE` | `/api/files/[id]` | Delete uploaded file |
| `GET` | `/api/dashboard/stats` | Dashboard metrics |
| `POST` | `/api/payment/create` | Create Midtrans transaction |
| `POST` | `/api/payment/webhook` | Midtrans callback |
| `PATCH` | `/api/user/profile` | Update profile |
| `POST` | `/api/user/password` | Change password |
| `GET` | `/api/health` | Health check |

---

## 🧰 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run worker` | Start audio worker |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript validation |
| `npm test` | Run unit tests |
| `npm run db:seed` | Seed database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run format` | Format code with Prettier |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with love using:
- [Next.js](https://nextjs.org)
- [Auth.js](https://authjs.dev)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com)
- [Midtrans](https://midtrans.com)
- [Cloudflare R2](https://cloudflare.com/products/r2)

---

## 💬 Support

- 🐛 Issues: [GitHub Issues](https://github.com/hapizddcr/musicbypass/issues)
- 📧 Email: support@audioforge.app
- 📖 Docs: [docs.audioforge.app](https://docs.audioforge.app)

**Happy audio forging! 🎧**
