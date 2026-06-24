# TorqueTrader API 🏍️

A transparency-focused C2C marketplace backend for premium superbikes.

**Stack:** FastAPI · SQLAlchemy · PostgreSQL · Redis · Cloudflare R2 · Resend Email OTP

---

## Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Git

### 2. Clone & install
```bash
git clone https://github.com/DoctorDisco23/TorqueTrader.git
cd TorqueTrader
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET_KEY
```

For **local dev**, the defaults work out of the box:
- Database: SQLite (`torque_trader.db` auto-created)
- Redis: in-memory fakeredis (OTP printed to console)
- File storage: local `mock_s3/` folder

### 4. Run
```bash
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

---

## Running Tests

```bash
pytest tests/ -v
```

---

## Deploying to Render (Free Tier)

### One-click deploy with Render Blueprint
1. Fork this repo to your GitHub account
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your forked repo — Render reads `render.yaml` automatically
4. Render will create: Web Service + PostgreSQL database
5. Set the following env vars manually in the Render dashboard:

| Variable | Where to get it |
|---|---|
| `REDIS_URL` | [Upstash](https://upstash.com) — free Redis, copy the Redis URL |
| `RESEND_API_KEY` | [Resend](https://resend.com) — free, 3K emails/month |
| `OTP_FROM_EMAIL` | Your verified sender domain in Resend |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 → Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | Same as above |

6. After deploy, run the database migration:
```bash
# In Render dashboard → Shell tab:
alembic upgrade head
```

### Upgrading the database schema after changes
```bash
# Generate a new migration
alembic revision --autogenerate -m "describe your change"

# Apply to production (run in Render shell)
alembic upgrade head
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  FastAPI App                 │
│  /auth  /listings  /media  /leads           │
└──────────┬──────────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
  SQLAlchemy    Redis
  PostgreSQL    (OTP, rate limits,
  (Render)       token blacklist)
                (Upstash)
           │
      boto3 S3 client
      Cloudflare R2
      (bike photos + docs)
           │
       Resend
       (Email OTP delivery)
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/send-otp` | Send OTP to email |
| POST | `/auth/verify-otp` | Verify OTP, receive JWT |
| POST | `/auth/logout` | Blacklist current token |
| GET | `/auth/me` | Get current user |
| POST | `/auth/register-dealer` | Submit dealer registration |

### Listings (Inventory)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/listings/` | Seller | Create a listing (starts as DRAFT) |
| GET | `/listings/` | Public | Search active listings |
| PATCH | `/listings/{id}/status` | Admin | Update status + transparency score |

### Media
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/media/public/bike-photo` | Seller/Dealer | Upload bike photo → R2 |
| POST | `/media/private/verification-doc` | Dealer | Upload RC/docs → R2 private |
| GET | `/media/private/{id}/presigned-url` | Admin | Get time-limited doc URL |

### Leads
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/leads/reveal-phone` | Buyer | Reveal seller contact (rate-limited) |
| POST | `/leads/whatsapp-click` | Buyer | Log WhatsApp click |

---

## Environment Variables

See [`.env.example`](.env.example) for a full documented list.

| Variable | Required | Default |
|---|---|---|
| `JWT_SECRET_KEY` | ✅ Yes | — |
| `DATABASE_URL` | ✅ Prod | `sqlite:///./torque_trader.db` |
| `REDIS_URL` | Prod | fakeredis fallback |
| `RESEND_API_KEY` | Prod | print to console |
| `R2_ACCOUNT_ID` etc. | Prod | local mock_s3/ fallback |
| `ALLOWED_ORIGINS` | No | `*` |

---

## Security Notes

- JWTs are signed with HS256 and expire in 7 days
- Tokens are blacklisted on logout via Redis
- OTP brute-force: max 5 attempts per hour per email
- File uploads: MIME-sniffed from bytes (not filename), UUID-renamed
- Images: re-compressed through Pillow (strips EXIF metadata)
- All DB queries use parameterised SQLAlchemy (zero SQL injection surface)
- Listings always start as DRAFT — no self-activation possible
- Transparency score capped at 100 server-side