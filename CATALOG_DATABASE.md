# Catalog database and image storage

Stage 54 uses server-side persistence for admin catalog products.

## Required for production (Vercel)

### 1. Postgres database

1. Vercel Dashboard → **Storage** → **Create Database** → **Postgres**
2. Connect the database to the `bellaflore` project
3. Ensure `DATABASE_URL` (or `POSTGRES_URL`) is available to Production

The schema is applied automatically on first API request (`lib/catalogDb/schema.sql`).

### 2. Image storage (Vercel Blob)

1. Vercel Dashboard → **Storage** → **Create Store** → **Blob**
2. Connect `BLOB_READ_WRITE_TOKEN` to the project

Without Blob in production, image upload shows: **«Хранилище изображений не настроено»**.

### 3. Admin session secret (recommended)

Set `ADMIN_SESSION_SECRET` in Vercel env for signed admin API cookies.

## Local development

Without `DATABASE_URL`, catalog uses `.data/catalog-products.json` (server file, not browser localStorage).

Without `BLOB_READ_WRITE_TOKEN`, images save to `public/uploads/products/`.

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/catalog/products?published=1` | Public published products |
| `GET /api/catalog/products/[slug]` | Public product by slug |
| `GET /api/admin/products` | Admin list (auth required) |
| `POST /api/admin/products` | Create / save draft |
| `PUT /api/admin/products/[id]` | Update |
| `POST /api/admin/products/[id]/publish` | Publish |
| `POST /api/admin/products/[id]/archive` | Archive |
| `POST /api/admin/products/upload-image` | Upload image |

Admin API requires httpOnly cookie from `/api/admin/login`.
