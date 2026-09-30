-- =============================================================
-- Logowanie e-mailem ograniczone do domeny gmail.com.
--
-- Walidacja jest też w aplikacji (ładniejszy komunikat), ale to tutaj jest
-- twardą bramką — omija ją nawet ktoś, kto uderzy prosto w /auth/v1/signup.
-- =============================================================

create or replace function public.enforce_allowed_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is null then
    return new;
  end if;

  if lower(new.email) not like '%@gmail.com' then
    raise exception 'email_domain_not_allowed'
      using hint = 'Dozwolone są tylko adresy @gmail.com.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_email_domain_on_insert on auth.users;
create trigger enforce_email_domain_on_insert
  before insert on auth.users
  for each row execute function public.enforce_allowed_email_domain();

-- Zmiana adresu na spoza domeny też jest blokowana.
drop trigger if exists enforce_email_domain_on_update on auth.users;
create trigger enforce_email_domain_on_update
  before update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.enforce_allowed_email_domain();

-- Zaproszenia: adres jest tylko notatką „kogo zapraszam”, ale skoro i tak
-- nikt spoza gmail.com nie założy konta, nie pozwalamy wpisać innej domeny.
alter table public.household_invites
  drop constraint if exists household_invites_email_domain_chk;
alter table public.household_invites
  add constraint household_invites_email_domain_chk
  check (email is null or lower(email) like '%@gmail.com');
