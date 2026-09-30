-- =============================================================
-- Spending App — schemat początkowy
-- Przestrzenie domowe (households), członkowie, zaproszenia,
-- kategorie, wydatki, przychody + szablony cykliczne.
-- =============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- Profile użytkowników (lustro auth.users)
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text,
  full_name           text,
  avatar_url          text,
  active_household_id uuid,
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Przestrzenie domowe
-- ------------------------------------------------------------------
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 60),
  currency   text not null default 'PLN',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists household_members_user_idx on public.household_members (user_id);

alter table public.profiles
  drop constraint if exists profiles_active_household_fkey;
alter table public.profiles
  add constraint profiles_active_household_fkey
  foreign key (active_household_id) references public.households (id) on delete set null;

-- ------------------------------------------------------------------
-- Zaproszenia (bez ACL — kto wejdzie, ma pełne prawa)
-- ------------------------------------------------------------------
create table if not exists public.household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(24), 'hex'),
  email        text,
  invited_by   uuid not null references auth.users (id) on delete cascade,
  accepted_by  uuid references auth.users (id) on delete set null,
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  expires_at   timestamptz not null default now() + interval '14 days',
  created_at   timestamptz not null default now()
);

create index if not exists household_invites_household_idx on public.household_invites (household_id);

-- ------------------------------------------------------------------
-- Kategorie
-- ------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 40),
  -- Slot palety, nie dowolny hex — dzięki temu kolory są walidowane pod kątem
  -- daltonizmu i mają osobne warianty dla trybu ciemnego (patrz src/lib/palette.ts).
  color        text not null default 'slate'
                 check (color in ('blue','orange','aqua','yellow','magenta',
                                  'green','violet','red','slate')),
  icon         text,
  sort_order   integer not null default 0,
  archived     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists categories_household_idx on public.categories (household_id);
create unique index if not exists categories_household_name_key
  on public.categories (household_id, lower(trim(name)));

-- ------------------------------------------------------------------
-- Szablony cykliczne — wydatki
-- ------------------------------------------------------------------
create table if not exists public.recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  name         text not null check (char_length(trim(name)) between 1 and 80),
  amount       numeric(12, 2) not null check (amount >= 0),
  day_of_month smallint not null default 1 check (day_of_month between 1 and 31),
  start_month  date not null,             -- zawsze 1. dzień miesiąca
  end_month    date,                      -- null = bezterminowo
  active       boolean not null default true,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint recurring_expenses_range_chk check (end_month is null or end_month >= start_month)
);

create index if not exists recurring_expenses_household_idx on public.recurring_expenses (household_id);

-- ------------------------------------------------------------------
-- Szablony cykliczne — przychody
-- ------------------------------------------------------------------
create table if not exists public.recurring_incomes (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 80),
  amount       numeric(12, 2) not null check (amount >= 0),
  day_of_month smallint not null default 1 check (day_of_month between 1 and 31),
  start_month  date not null,
  end_month    date,
  active       boolean not null default true,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint recurring_incomes_range_chk check (end_month is null or end_month >= start_month)
);

create index if not exists recurring_incomes_household_idx on public.recurring_incomes (household_id);

-- ------------------------------------------------------------------
-- Wydatki
-- ------------------------------------------------------------------
create table if not exists public.expenses (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references public.households (id) on delete cascade,
  category_id          uuid references public.categories (id) on delete set null,
  amount               numeric(12, 2) not null check (amount >= 0),
  description          text,
  spent_on             date not null,
  period_month         date generated always as (date_trunc('month', spent_on::timestamp)::date) stored,
  recurring_expense_id uuid references public.recurring_expenses (id) on delete set null,
  created_by           uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists expenses_household_period_idx on public.expenses (household_id, period_month);
create index if not exists expenses_category_idx on public.expenses (category_id);
-- jeden wpis z danego szablonu na miesiąc
create unique index if not exists expenses_recurring_period_key
  on public.expenses (recurring_expense_id, period_month)
  where recurring_expense_id is not null;

-- ------------------------------------------------------------------
-- Przychody (wpisy — wygenerowane z szablonu lub jednorazowe)
-- ------------------------------------------------------------------
create table if not exists public.incomes (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households (id) on delete cascade,
  amount              numeric(12, 2) not null check (amount >= 0),
  description         text,
  received_on         date not null,
  period_month        date generated always as (date_trunc('month', received_on::timestamp)::date) stored,
  recurring_income_id uuid references public.recurring_incomes (id) on delete set null,
  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists incomes_household_period_idx on public.incomes (household_id, period_month);
create unique index if not exists incomes_recurring_period_key
  on public.incomes (recurring_income_id, period_month)
  where recurring_income_id is not null;

-- ------------------------------------------------------------------
-- Pominięcia — żeby skasowana pozycja cykliczna nie wróciła
-- ------------------------------------------------------------------
create table if not exists public.recurring_expense_skips (
  recurring_expense_id uuid not null references public.recurring_expenses (id) on delete cascade,
  period_month         date not null,
  created_at           timestamptz not null default now(),
  primary key (recurring_expense_id, period_month)
);

create table if not exists public.recurring_income_skips (
  recurring_income_id uuid not null references public.recurring_incomes (id) on delete cascade,
  period_month        date not null,
  created_at          timestamptz not null default now(),
  primary key (recurring_income_id, period_month)
);

-- ------------------------------------------------------------------
-- updated_at
-- ------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at
  before update on public.expenses
  for each row execute function public.touch_updated_at();

drop trigger if exists incomes_touch_updated_at on public.incomes;
create trigger incomes_touch_updated_at
  before update on public.incomes
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Funkcje pomocnicze
-- =============================================================

-- Czy zalogowany user należy do przestrzeni.
-- SECURITY DEFINER, żeby nie wpaść w rekursję RLS na household_members.
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;

-- Zakładanie profilu przy rejestracji
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tworzenie przestrzeni wraz z domyślnymi kategoriami.
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.households (name, created_by)
  values (coalesce(nullif(trim(p_name), ''), 'Dom'), v_uid)
  returning id into v_id;

  insert into public.household_members (household_id, user_id) values (v_id, v_uid);

  insert into public.categories (household_id, name, color, icon, sort_order) values
    (v_id, 'Jedzenie',     'blue',    'utensils',      10),
    (v_id, 'Mieszkanie',   'orange',  'house',         20),
    (v_id, 'Transport',    'aqua',    'car',           30),
    (v_id, 'Rachunki',     'yellow',  'receipt',       40),
    (v_id, 'Rozrywka',     'magenta', 'party-popper',  50),
    (v_id, 'Zdrowie',      'green',   'heart-pulse',   60),
    (v_id, 'Oszczędności', 'violet',  'piggy-bank',    70),
    (v_id, 'Zakupy',       'red',     'shopping-bag',  80),
    (v_id, 'Inne',         'slate',   'circle-dashed', 90);

  update public.profiles set active_household_id = v_id where id = v_uid;

  return v_id;
end;
$$;

-- Bootstrap po zalogowaniu: profil + (jeśli brak) pierwsza przestrzeń.
create or replace function public.bootstrap_user()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_hid uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id, email)
  select v_uid, u.email from auth.users u where u.id = v_uid
  on conflict (id) do nothing;

  select m.household_id into v_hid
  from public.household_members m
  join public.profiles p on p.id = v_uid
  where m.user_id = v_uid
  order by (m.household_id = p.active_household_id) desc, m.joined_at
  limit 1;

  if v_hid is null then
    v_hid := public.create_household('Dom');
  end if;

  update public.profiles
     set active_household_id = v_hid
   where id = v_uid and active_household_id is distinct from v_hid;

  return v_hid;
end;
$$;

-- Akceptacja zaproszenia po tokenie.
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.household_invites%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_inv from public.household_invites where token = p_token;

  if v_inv.id is null then
    raise exception 'invite_not_found';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'invite_revoked';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  insert into public.household_members (household_id, user_id)
  values (v_inv.household_id, v_uid)
  on conflict do nothing;

  update public.household_invites
     set accepted_by = coalesce(accepted_by, v_uid),
         accepted_at = coalesce(accepted_at, now())
   where id = v_inv.id;

  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  update public.profiles set active_household_id = v_inv.household_id where id = v_uid;

  return v_inv.household_id;
end;
$$;

-- Podgląd zaproszenia przed akceptacją (nazwa przestrzeni + status).
create or replace function public.invite_preview(p_token text)
returns table (
  household_name text,
  invited_by     text,
  status         text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select h.name,
         coalesce(p.full_name, p.email),
         case
           when i.revoked_at is not null then 'revoked'
           when i.accepted_at is not null then 'accepted'
           when i.expires_at < now()      then 'expired'
           when public.is_household_member(i.household_id) then 'already_member'
           else 'valid'
         end
    from public.household_invites i
    join public.households h on h.id = i.household_id
    left join public.profiles p on p.id = i.invited_by
   where i.token = p_token;
$$;

-- Opuszczenie przestrzeni (ostatni członek => przestrzeń znika).
create or replace function public.leave_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_left integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_household_member(p_household_id) then
    raise exception 'not_a_member';
  end if;

  delete from public.household_members
   where household_id = p_household_id and user_id = v_uid;

  select count(*) into v_left
    from public.household_members where household_id = p_household_id;

  if v_left = 0 then
    delete from public.households where id = p_household_id;
  end if;

  update public.profiles
     set active_household_id = (
       select m.household_id from public.household_members m
        where m.user_id = v_uid order by m.joined_at limit 1
     )
   where id = v_uid and active_household_id = p_household_id;
end;
$$;

-- Dzień miesiąca przycięty do długości miesiąca (31 -> 30 w kwietniu).
create or replace function public.clamp_day(p_month date, p_day smallint)
returns date
language sql
immutable
as $$
  select date_trunc('month', p_month::timestamp)::date
       + (least(
            p_day,
            extract(day from (date_trunc('month', p_month::timestamp) + interval '1 month - 1 day'))::smallint
          ) - 1);
$$;

-- Materializacja pozycji cyklicznych dla danego miesiąca.
create or replace function public.materialize_month(p_household_id uuid, p_month date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_month date := date_trunc('month', p_month::timestamp)::date;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'not_a_member';
  end if;

  insert into public.expenses
    (household_id, category_id, amount, description, spent_on, recurring_expense_id, created_by)
  select r.household_id,
         r.category_id,
         r.amount,
         r.name,
         public.clamp_day(v_month, r.day_of_month),
         r.id,
         r.created_by
    from public.recurring_expenses r
   where r.household_id = p_household_id
     and r.active
     and r.start_month <= v_month
     and (r.end_month is null or r.end_month >= v_month)
     and not exists (
       select 1 from public.recurring_expense_skips s
        where s.recurring_expense_id = r.id and s.period_month = v_month
     )
  on conflict (recurring_expense_id, period_month) where recurring_expense_id is not null
  do nothing;

  insert into public.incomes
    (household_id, amount, description, received_on, recurring_income_id, created_by)
  select r.household_id,
         r.amount,
         r.name,
         public.clamp_day(v_month, r.day_of_month),
         r.id,
         r.created_by
    from public.recurring_incomes r
   where r.household_id = p_household_id
     and r.active
     and r.start_month <= v_month
     and (r.end_month is null or r.end_month >= v_month)
     and not exists (
       select 1 from public.recurring_income_skips s
        where s.recurring_income_id = r.id and s.period_month = v_month
     )
  on conflict (recurring_income_id, period_month) where recurring_income_id is not null
  do nothing;
end;
$$;

-- Usunięcie pozycji: jeśli pochodzi z szablonu, zapamiętaj pominięcie.
create or replace function public.delete_expense(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.expenses%rowtype;
begin
  select * into v_row from public.expenses where id = p_id;
  if v_row.id is null or not public.is_household_member(v_row.household_id) then
    raise exception 'not_found';
  end if;

  if v_row.recurring_expense_id is not null then
    insert into public.recurring_expense_skips (recurring_expense_id, period_month)
    values (v_row.recurring_expense_id, v_row.period_month)
    on conflict do nothing;
  end if;

  delete from public.expenses where id = p_id;
end;
$$;

create or replace function public.delete_income(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.incomes%rowtype;
begin
  select * into v_row from public.incomes where id = p_id;
  if v_row.id is null or not public.is_household_member(v_row.household_id) then
    raise exception 'not_found';
  end if;

  if v_row.recurring_income_id is not null then
    insert into public.recurring_income_skips (recurring_income_id, period_month)
    values (v_row.recurring_income_id, v_row.period_month)
    on conflict do nothing;
  end if;

  delete from public.incomes where id = p_id;
end;
$$;

-- Członkowie przestrzeni z danymi profilu (omija RLS na cudzych profilach).
create or replace function public.household_members_view(p_household_id uuid)
returns table (
  user_id    uuid,
  email      text,
  full_name  text,
  avatar_url text,
  joined_at  timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.user_id, p.email, p.full_name, p.avatar_url, m.joined_at
    from public.household_members m
    left join public.profiles p on p.id = m.user_id
   where m.household_id = p_household_id
     and public.is_household_member(p_household_id)
   order by m.joined_at;
$$;

-- =============================================================
-- RLS
-- =============================================================
alter table public.profiles               enable row level security;
alter table public.households             enable row level security;
alter table public.household_members      enable row level security;
alter table public.household_invites      enable row level security;
alter table public.categories             enable row level security;
alter table public.expenses               enable row level security;
alter table public.incomes                enable row level security;
alter table public.recurring_expenses     enable row level security;
alter table public.recurring_incomes      enable row level security;
alter table public.recurring_expense_skips enable row level security;
alter table public.recurring_income_skips  enable row level security;

-- profiles: tylko własny
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- households
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (public.is_household_member(id));

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update to authenticated
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

drop policy if exists households_delete on public.households;
create policy households_delete on public.households
  for delete to authenticated
  using (public.is_household_member(id));

-- household_members
drop policy if exists household_members_select on public.household_members;
create policy household_members_select on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists household_members_delete on public.household_members;
create policy household_members_delete on public.household_members
  for delete to authenticated
  using (public.is_household_member(household_id));

-- invites
drop policy if exists household_invites_select on public.household_invites;
create policy household_invites_select on public.household_invites
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists household_invites_insert on public.household_invites;
create policy household_invites_insert on public.household_invites
  for insert to authenticated
  with check (public.is_household_member(household_id) and invited_by = auth.uid());

drop policy if exists household_invites_update on public.household_invites;
create policy household_invites_update on public.household_invites
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists household_invites_delete on public.household_invites;
create policy household_invites_delete on public.household_invites
  for delete to authenticated
  using (public.is_household_member(household_id));

-- tabele przypisane do przestrzeni — identyczna polityka
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'expenses', 'incomes', 'recurring_expenses', 'recurring_incomes'
  ] loop
    execute format('drop policy if exists %1$s_member_all on public.%1$I', t);
    execute format($p$
      create policy %1$s_member_all on public.%1$I
        for all to authenticated
        using (public.is_household_member(household_id))
        with check (public.is_household_member(household_id))
    $p$, t);
  end loop;
end $$;

-- skips — przez szablon nadrzędny
drop policy if exists recurring_expense_skips_all on public.recurring_expense_skips;
create policy recurring_expense_skips_all on public.recurring_expense_skips
  for all to authenticated
  using (exists (
    select 1 from public.recurring_expenses r
     where r.id = recurring_expense_id and public.is_household_member(r.household_id)))
  with check (exists (
    select 1 from public.recurring_expenses r
     where r.id = recurring_expense_id and public.is_household_member(r.household_id)));

drop policy if exists recurring_income_skips_all on public.recurring_income_skips;
create policy recurring_income_skips_all on public.recurring_income_skips
  for all to authenticated
  using (exists (
    select 1 from public.recurring_incomes r
     where r.id = recurring_income_id and public.is_household_member(r.household_id)))
  with check (exists (
    select 1 from public.recurring_incomes r
     where r.id = recurring_income_id and public.is_household_member(r.household_id)));

-- =============================================================
-- Uprawnienia
-- =============================================================
revoke all on function public.create_household(text)        from public, anon;
revoke all on function public.bootstrap_user()              from public, anon;
revoke all on function public.accept_invite(text)           from public, anon;
revoke all on function public.invite_preview(text)          from public, anon;
revoke all on function public.leave_household(uuid)         from public, anon;
revoke all on function public.materialize_month(uuid, date) from public, anon;
revoke all on function public.delete_expense(uuid)          from public, anon;
revoke all on function public.delete_income(uuid)           from public, anon;
revoke all on function public.household_members_view(uuid)  from public, anon;

grant execute on function public.create_household(text)        to authenticated;
grant execute on function public.bootstrap_user()              to authenticated;
grant execute on function public.accept_invite(text)           to authenticated;
grant execute on function public.invite_preview(text)          to authenticated;
grant execute on function public.leave_household(uuid)         to authenticated;
grant execute on function public.materialize_month(uuid, date) to authenticated;
grant execute on function public.delete_expense(uuid)          to authenticated;
grant execute on function public.delete_income(uuid)           to authenticated;
grant execute on function public.household_members_view(uuid)  to authenticated;
grant execute on function public.is_household_member(uuid)     to authenticated;
