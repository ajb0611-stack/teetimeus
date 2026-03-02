# TeeTime Florida (V1 - Complete)

## 1) Supabase setup
- Create a Supabase project
- Open **SQL Editor** and run: `supabase/schema.sql`

## 2) Local setup
- Copy `.env.example` -> `.env.local` and fill in values from Supabase
- In this folder run:
  - `npm install`
  - `npm run dev`

Open:
- Home: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## 3) Make yourself an admin
- Sign up at `/admin/login`
- In Supabase -> Authentication -> Users, copy your **User UID**
- Run in SQL Editor:

  insert into public.admins (user_id) values ('YOUR-UID-HERE');

Then refresh `/admin`.
