-- =============================================================
-- Miesięczny próg wydatków dla przestrzeni.
--
-- 'none'    — bez progu
-- 'amount'  — sztywna kwota, np. 5000 zł
-- 'percent' — procent przychodów danego miesiąca, np. 80%
-- =============================================================

alter table public.households
  add column if not exists spending_limit_kind text not null default 'none',
  add column if not exists spending_limit_value numeric(12, 2);

alter table public.households
  drop constraint if exists households_spending_limit_kind_chk;
alter table public.households
  add constraint households_spending_limit_kind_chk
  check (spending_limit_kind in ('none', 'amount', 'percent'));

-- Rodzaj i wartość muszą trzymać się razem — inaczej dałoby się zapisać
-- próg procentowy bez procentu albo kwotę przy wyłączonym progu.
alter table public.households
  drop constraint if exists households_spending_limit_value_chk;
alter table public.households
  add constraint households_spending_limit_value_chk
  check (
    (spending_limit_kind = 'none' and spending_limit_value is null)
    or (spending_limit_kind = 'amount'
        and spending_limit_value is not null
        and spending_limit_value > 0
        and spending_limit_value <= 99999999)
    or (spending_limit_kind = 'percent'
        and spending_limit_value is not null
        and spending_limit_value > 0
        and spending_limit_value <= 100)
  );
