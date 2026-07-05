-- ============================================================
-- ITE NRI — Supabase schema
-- Run this whole file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. PROFILES ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  plan text not null default 'guest' check (plan in ('guest', 'full')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile name" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile (as guest) whenever a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Guest'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. DEVICES (single-device lock) ---------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  device_id text not null,
  device_name text,
  status text not null default 'pending' check (status in ('active', 'pending', 'revoked')),
  created_at timestamptz default now(),
  unique (user_id, device_id)
);

alter table public.devices enable row level security;
create policy "read own devices" on public.devices
  for select using (auth.uid() = user_id);

-- Called on every login. First device becomes ACTIVE.
-- Any additional device becomes PENDING until approved —
-- even if the user logged out of the first device.
create or replace function public.register_device(p_device_id text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_other_active int;
  v_status text;
begin
  select count(*) into v_other_active
  from devices
  where user_id = auth.uid() and status = 'active' and device_id <> p_device_id;

  insert into devices (user_id, device_id, device_name, status)
  values (auth.uid(), p_device_id, p_name,
          case when v_other_active = 0 then 'active' else 'pending' end)
  on conflict (user_id, device_id) do update
    set device_name = excluded.device_name,
        status = case
          when devices.status = 'active' then 'active'
          when v_other_active = 0 then 'active'
          else 'pending'
        end;

  select status into v_status
  from devices where user_id = auth.uid() and device_id = p_device_id;
  return v_status;
end $$;

-- Approve a pending device FROM the currently active device.
-- The old device is revoked; only one active device ever exists.
create or replace function public.approve_device(p_row uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from devices where id = p_row and user_id = auth.uid()) then
    raise exception 'Not your device';
  end if;
  update devices set status = 'revoked'
   where user_id = auth.uid() and id <> p_row;
  update devices set status = 'active' where id = p_row;
end $$;

create or replace function public.deny_device(p_row uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update devices set status = 'revoked'
   where id = p_row and user_id = auth.uid();
end $$;

-- Claim this device after the user re-proves identity by email OTP
-- (used when the old device is unavailable, e.g. lost or logged out).
create or replace function public.claim_device(p_device_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update devices set status = 'revoked'
   where user_id = auth.uid() and device_id <> p_device_id;
  update devices set status = 'active'
   where user_id = auth.uid() and device_id = p_device_id;
end $$;

-- 3. SUBSCRIPTION FIELDS -------------------------------------
alter table public.profiles add column if not exists plan_expires_at timestamptz;
alter table public.profiles add column if not exists has_paid_initiation boolean not null default false;

-- 3b. PAYMENTS ------------------------------------------------
-- PayPal payments auto-activate. MTN MoMo payments are created as
-- 'pending' and must be validated by the developer (admin) after
-- confirming the money arrived.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  method text not null check (method in ('paypal', 'momo')),
  period text not null check (period in ('first', 'monthly', '6months', 'yearly',
                                         'first6months', 'firstyearly')),
  amount_usd numeric not null,
  amount_cfa numeric,
  reference text,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "own payments select" on public.payments
  for select using (auth.uid() = user_id);
create policy "own payments insert" on public.payments
  for insert with check (auth.uid() = user_id and status = 'pending');
-- The developer (admin) can see and manage every payment:
create policy "admin manage payments" on public.payments
  for all using ((auth.jwt() ->> 'email') = 'jdtechnologies92@gmail.com');

-- Pricing lives in the database so the client can't tamper with it.
create or replace function public.price_for(p_period text)
returns numeric language sql immutable as $$
  select case p_period
    when 'first'        then 20   -- activation + first month
    when 'first6months' then 40   -- activation + 6 months (save $5)
    when 'firstyearly'  then 65   -- activation + 12 months (save $10)
    when 'monthly'      then 5
    when '6months'      then 27   -- renewal bundle (save $3)
    when 'yearly'       then 50   -- renewal bundle (save $10)
  end
$$;

create or replace function public.months_for(p_period text)
returns int language sql immutable as $$
  select case p_period
    when 'first' then 1 when 'monthly' then 1
    when 'first6months' then 6 when '6months' then 6
    else 12 end
$$;

-- Internal: extend a user's subscription after a confirmed payment.
create or replace function public.apply_subscription(p_user uuid, p_period text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set
    plan = 'full',
    has_paid_initiation = true,
    plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
                      + (months_for(p_period) || ' months')::interval
  where id = p_user;
end $$;

-- MoMo: user submits proof → pending row (developer is notified by
-- WhatsApp from the app and validates in the Admin panel).
create or replace function public.submit_momo_payment(p_period text, p_reference text, p_phone text, p_cfa numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into payments (user_id, method, period, amount_usd, amount_cfa, reference, phone, status)
  values (auth.uid(), 'momo', p_period, price_for(p_period), p_cfa, p_reference, p_phone, 'pending')
  returning id into v_id;
  return v_id;
end $$;

-- PayPal: automatic — records the capture and activates instantly.
-- (For production hardening, verify the order server-side via a
-- Supabase Edge Function + PayPal webhook before applying.)
create or replace function public.record_paypal_payment(p_period text, p_reference text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into payments (user_id, method, period, amount_usd, reference, status)
  values (auth.uid(), 'paypal', p_period, price_for(p_period), p_reference, 'approved');
  perform apply_subscription(auth.uid(), p_period);
end $$;

-- Admin-only: validate or reject a pending MoMo payment.
create or replace function public.review_payment(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v payments;
begin
  if (auth.jwt() ->> 'email') <> 'jdtechnologies92@gmail.com' then
    raise exception 'Only the developer can validate payments';
  end if;
  select * into v from payments where id = p_id and status = 'pending';
  if v.id is null then raise exception 'Payment not found or already reviewed'; end if;
  update payments set status = case when p_approve then 'approved' else 'rejected' end
   where id = p_id;
  if p_approve then
    perform apply_subscription(v.user_id, v.period);
  end if;
end $$;

-- 4. KITCHEN STATE (cloud save of pantry, family, plan) ------
create table if not exists public.kitchen_state (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.kitchen_state enable row level security;
create policy "own state select" on public.kitchen_state
  for select using (auth.uid() = user_id);
create policy "own state insert" on public.kitchen_state
  for insert with check (auth.uid() = user_id);
create policy "own state update" on public.kitchen_state
  for update using (auth.uid() = user_id);

-- ============================================================
-- 5. DEVELOPER-CONTROLLED DEVICE APPROVAL  (added)
-- The developer (admin) approves new devices — NOT the user's
-- other device. New devices sit as 'pending' and the developer
-- is alerted on WhatsApp from the app, then approves here.
-- ============================================================

-- Store the account email + device name on the device row so the
-- admin can tell whose device is waiting.
alter table public.devices add column if not exists user_email text;

-- Let the admin read & manage every device row.
drop policy if exists "admin manage devices" on public.devices;
create policy "admin manage devices" on public.devices
  for all using ((auth.jwt() ->> 'email') = 'jdtechnologies92@gmail.com');

-- Re-register: first device active; any later device is pending and
-- records the account email for the admin's list.
create or replace function public.register_device(p_device_id text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_other_active int;
  v_status text;
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();

  select count(*) into v_other_active
  from devices
  where user_id = auth.uid() and status = 'active' and device_id <> p_device_id;

  insert into devices (user_id, device_id, device_name, user_email, status)
  values (auth.uid(), p_device_id, p_name, v_email,
          case when v_other_active = 0 then 'active' else 'pending' end)
  on conflict (user_id, device_id) do update
    set device_name = excluded.device_name,
        user_email = excluded.user_email,
        status = case
          when devices.status = 'active' then 'active'
          when v_other_active = 0 then 'active'
          else 'pending'
        end;

  select status into v_status
  from devices where user_id = auth.uid() and device_id = p_device_id;
  return v_status;
end $$;

-- Admin-only: approve a pending device. Revokes any other device for
-- that same user, then activates the chosen one.
create or replace function public.admin_approve_device(p_row uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if (auth.jwt() ->> 'email') <> 'jdtechnologies92@gmail.com' then
    raise exception 'Only the developer can approve devices';
  end if;
  select user_id into v_user from devices where id = p_row;
  if v_user is null then raise exception 'Device not found'; end if;
  update devices set status = 'revoked' where user_id = v_user and id <> p_row;
  update devices set status = 'active'  where id = p_row;
end $$;

-- Admin-only: reject/deny a pending device.
create or replace function public.admin_deny_device(p_row uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (auth.jwt() ->> 'email') <> 'jdtechnologies92@gmail.com' then
    raise exception 'Only the developer can deny devices';
  end if;
  update devices set status = 'revoked' where id = p_row;
end $$;

-- ============================================================
-- 6. ADMINS, FREE ACCESS GRANTS & COUPONS  (added)
-- ============================================================

-- 6a. ADMINS -------------------------------------------------
-- A list of admin emails, so you can promote/remove admins later
-- WITHOUT changing code. The first admin is seeded below.
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;

-- Anyone logged in can check IF THEY THEMSELVES are an admin.
drop policy if exists "read own admin row" on public.admins;
create policy "read own admin row" on public.admins
  for select using ((auth.jwt() ->> 'email') = email);

-- Admins can see and manage the whole admin list.
drop policy if exists "admins manage admins" on public.admins;
create policy "admins manage admins" on public.admins
  for all using (exists (select 1 from admins a where a.email = (auth.jwt() ->> 'email')));

-- Seed your admin accounts (edit / add rows here anytime).
insert into public.admins (email) values
  ('jdtechnologies92@gmail.com'),
  ('ngwana2015@gmail.com')
on conflict (email) do nothing;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = (auth.jwt() ->> 'email'));
$$;

-- A profile flag the app reads to know whether to show admin tools
-- and to grant full access without payment.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Keep profiles.is_admin in sync with the admins table on login.
create or replace function public.sync_admin_flag()
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles
     set is_admin = exists (select 1 from admins where email = (auth.jwt() ->> 'email'))
   where id = auth.uid();
end $$;

-- Admin action: promote another user to admin by email.
create or replace function public.add_admin(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can add admins'; end if;
  insert into admins (email) values (lower(trim(p_email))) on conflict do nothing;
  update profiles p set is_admin = true
    from auth.users u
   where u.id = p.id and u.email = lower(trim(p_email));
end $$;

-- Admin action: remove an admin by email.
create or replace function public.remove_admin(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can remove admins'; end if;
  delete from admins where email = lower(trim(p_email));
  update profiles p set is_admin = false
    from auth.users u
   where u.id = p.id and u.email = lower(trim(p_email));
end $$;

-- 6b. GRANT FREE ACCESS --------------------------------------
-- Admin action: give a specific user full access for N months
-- (or forever) with NO payment. p_months = null means lifetime.
create or replace function public.grant_free_access(p_email text, p_months int)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not is_admin() then raise exception 'Only an admin can grant access'; end if;
  select id into v_user from auth.users where email = lower(trim(p_email));
  if v_user is null then raise exception 'No user with that email'; end if;

  if p_months is null then
    update profiles set plan = 'full', has_paid_initiation = true,
      plan_expires_at = null            -- null expiry = lifetime access
     where id = v_user;
  else
    update profiles set plan = 'full', has_paid_initiation = true,
      plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
                        + (p_months || ' months')::interval
     where id = v_user;
  end if;
end $$;

-- Admin action: revoke access (send a user back to guest).
create or replace function public.revoke_access(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not is_admin() then raise exception 'Only an admin can revoke access'; end if;
  select id into v_user from auth.users where email = lower(trim(p_email));
  if v_user is null then raise exception 'No user with that email'; end if;
  update profiles set plan = 'guest', plan_expires_at = null where id = v_user;
end $$;

-- 6c. COUPONS ------------------------------------------------
-- Codes an admin creates. A user redeems a code to get free months
-- (percent-off discounts can be layered on later at checkout).
create table if not exists public.coupons (
  code text primary key,
  free_months int,                 -- e.g. 1, 6, 12  (null if percent type)
  percent_off int,                 -- e.g. 50 = 50% off (null if free-months type)
  max_uses int default 1,          -- how many times it can be used in total
  used_count int not null default 0,
  active boolean not null default true,
  expires_at timestamptz,          -- null = never expires
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;

-- Admins manage coupons.
drop policy if exists "admins manage coupons" on public.coupons;
create policy "admins manage coupons" on public.coupons
  for all using (is_admin());

-- Track who redeemed what (prevents the same user reusing a code).
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text references coupons(code) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  unique (code, user_id)
);

alter table public.coupon_redemptions enable row level security;
drop policy if exists "own redemptions" on public.coupon_redemptions;
create policy "own redemptions" on public.coupon_redemptions
  for select using (auth.uid() = user_id or is_admin());

-- Admin action: create a coupon that grants free months.
create or replace function public.create_coupon(
  p_code text, p_free_months int, p_percent_off int, p_max_uses int, p_expires timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can create coupons'; end if;
  insert into coupons (code, free_months, percent_off, max_uses, expires_at)
  values (upper(trim(p_code)), p_free_months, p_percent_off, coalesce(p_max_uses,1), p_expires);
end $$;

-- Admin action: turn a coupon off.
create or replace function public.deactivate_coupon(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can manage coupons'; end if;
  update coupons set active = false where code = upper(trim(p_code));
end $$;

-- User action: redeem a coupon. Free-months coupons unlock access
-- immediately. Returns a message describing what happened.
create or replace function public.redeem_coupon(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare c coupons;
begin
  select * into c from coupons where code = upper(trim(p_code));
  if c.code is null then raise exception 'Invalid coupon code'; end if;
  if not c.active then raise exception 'This coupon is no longer active'; end if;
  if c.expires_at is not null and c.expires_at < now() then raise exception 'This coupon has expired'; end if;
  if c.used_count >= c.max_uses then raise exception 'This coupon has reached its usage limit'; end if;
  if exists (select 1 from coupon_redemptions where code = c.code and user_id = auth.uid()) then
    raise exception 'You have already used this coupon';
  end if;

  insert into coupon_redemptions (code, user_id) values (c.code, auth.uid());
  update coupons set used_count = used_count + 1 where code = c.code;

  if c.free_months is not null then
    update profiles set plan = 'full', has_paid_initiation = true,
      plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
                        + (c.free_months || ' months')::interval
     where id = auth.uid();
    return 'Success! You now have ' || c.free_months || ' month(s) of full access.';
  else
    return 'Coupon applied: ' || c.percent_off || '% off at checkout.';
  end if;
end $$;

-- ============================================================
-- 7. PASSWORD RESET + ADMIN USER LISTING
-- (added for: forgotten-password flow + admin "Users" tab)
-- ============================================================

-- Admin action: list all users so an admin can see everyone
-- and trigger a password reset for them. Returns email, name,
-- plan, admin flag, expiry and join date. Admin-only.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  plan text,
  is_admin boolean,
  plan_expires_at timestamptz,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can list users'; end if;
  return query
    select u.id,
           u.email::text,
           p.full_name,
           p.plan,
           coalesce(p.is_admin, false),
           p.plan_expires_at,
           u.created_at
      from auth.users u
      left join profiles p on p.id = u.id
     where u.email is not null            -- skip anonymous guest accounts
     order by u.created_at desc;
end $$;

-- Note: the actual reset EMAIL is sent from the browser using
-- Supabase's built-in supabase.auth.resetPasswordForEmail(email).
-- That call only needs the email address, so an admin can trigger
-- it for any user shown by admin_list_users(). No extra SQL needed.
