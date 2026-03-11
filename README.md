# Kōkiri

A civil defence status and alerts app built with Next.js, Tailwind CSS, Sanity.io, and Auth.js.

## Features

- **Members**: Register with Full Name, Email, Phone, Address. View a map with GPS location. When an admin sends an alert, respond with "I'm safe" or "I need help". Edit profile anytime.
- **Admins**: View a map with markers for members who need help (when an alert is active). Create alerts (title + subtitle) and send to all members. View all members and their response status; open member details and mark as safe/not safe.

## Setup

### 1. Environment variables

Copy `.env.local.example` to `.env.local` and set:

- `AUTH_SECRET` – Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` – e.g. `http://localhost:3000`
- `NEXT_PUBLIC_SANITY_PROJECT_ID` – From [sanity.io](https://sanity.io) project
- `NEXT_PUBLIC_SANITY_DATASET` – Usually `production`
- `SANITY_API_TOKEN` – Token with write access (for register, mutations, create alert)

### 2. Sanity project and schema

1. Create a project at [sanity.io](https://sanity.io).
2. In the Sanity project, create document types that match the app:
   - **member**: fullName, email, phone, address, passwordHash (string), role (admin | member), lastKnownLat, lastKnownLng
   - **alert**: title, subtitle, createdAt (datetime), createdBy (reference to member), status (active | closed)
   - **alertResponse**: member (ref), alert (ref), status (safe | need_help | unconfirmed), adminMarkedSafe (boolean), respondedAt (datetime), lat, lng

Schema definitions for reference live in `sanity/schemas/`. You can use [Sanity Studio](https://www.sanity.io/docs/getting-started-with-sanity-studio) (hosted or run locally with `npx sanity init` in a separate folder) and configure it with the same project ID and dataset to manage content.

### 3. First admin user

Members are created on register with `role: "member"`. To make someone an admin, set their document’s `role` to `"admin"` in Sanity (Studio or API). Alternatively, create the first member document in Sanity with `role: "admin"` and use the same email/password to sign in after setting `passwordHash` (e.g. via a one-off script using bcrypt).

### 4. Run the app

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Register** to create an account, then sign in.

## Tech stack

- **Next.js 15** (App Router), **Tailwind CSS**, **TypeScript**
- **Sanity.io** – data (members, alerts, alert responses)
- **Auth.js (NextAuth v5)** – credentials (email/password), JWT session
- **Leaflet** + **react-leaflet** – maps (OpenStreetMap)
- **Zod** – validation; **bcryptjs** – password hashing; **lucide-react** – icons

## Routes

- `/` – Redirects to `/login`, `/dashboard`, or `/admin` by role
- `/login`, `/register` – Auth
- `/dashboard` – Member: map, alert banner + Safe/Need help (when alert active), Edit profile link
- `/profile` – Edit Full Name, Phone, Address
- `/admin` – Admin: map (need-help markers when alert active), burger menu (Create Alert, View Members)
- `/admin/alert/new` – Create alert form
- `/admin/members` – List members and latest status; click for detail and Mark safe/not safe
