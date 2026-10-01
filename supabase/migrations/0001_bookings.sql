-- MansPeak bookings. One chair, so one confirmed booking per slot.
-- Run in the Supabase SQL editor, or with `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique,
  name          text not null check (char_length(name) between 1 and 120),
  phone         text not null,                     -- E.164, e.g. +639171234567
  email         text not null,
  cut_slug      text not null,                     -- matches src/data/cuts.js, or '__unsure'
  cut_name      text not null,
  booking_date  date not null,                     -- shop-local date (Asia/Manila)
  start_min     smallint not null check (start_min between 0 and 1439),  -- minutes after midnight, shop-local
  price         integer not null check (price >= 0),
  notes         text,
  status        text not null default 'confirmed'
                check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  created_at    timestamptz not null default now()
);

-- The double-booking guard. Cancelling a booking frees its slot.
-- (If you add more chairs, add a chair column and include it here.)
create unique index if not exists bookings_one_per_slot
  on public.bookings (booking_date, start_min)
  where status = 'confirmed';

create index if not exists bookings_date_idx on public.bookings (booking_date);

-- Lock the table down: no policies means the public anon key can do nothing.
-- Only the Vercel functions, using the service-role key, read and write.
alter table public.bookings enable row level security;
