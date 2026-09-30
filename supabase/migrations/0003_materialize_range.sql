-- =============================================================
-- Materializacja wielu miesięcy jednym wywołaniem.
--
-- Pulpit pokazuje trend z 6 miesięcy i dotąd wołał materialize_month
-- sześć razy — sześć round-tripów po ~90 ms każdy. Tu robimy to jednym
-- zapytaniem set-based po generate_series.
-- =============================================================

create or replace function public.materialize_range(
  p_household_id uuid,
  p_from         date,
  p_to           date
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from date := date_trunc('month', p_from::timestamp)::date;
  v_to   date := date_trunc('month', p_to::timestamp)::date;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'not_a_member';
  end if;

  if v_to < v_from then
    return;
  end if;

  insert into public.expenses
    (household_id, category_id, amount, description, spent_on, recurring_expense_id, created_by)
  select r.household_id,
         r.category_id,
         r.amount,
         r.name,
         public.clamp_day(m.month, r.day_of_month),
         r.id,
         r.created_by
    from (
      select gs::date as month
        from generate_series(v_from, v_to, interval '1 month') as gs
    ) m
    cross join public.recurring_expenses r
   where r.household_id = p_household_id
     and r.active
     and r.start_month <= m.month
     and (r.end_month is null or r.end_month >= m.month)
     and not exists (
       select 1 from public.recurring_expense_skips s
        where s.recurring_expense_id = r.id and s.period_month = m.month
     )
  on conflict (recurring_expense_id, period_month) where recurring_expense_id is not null
  do nothing;

  insert into public.incomes
    (household_id, amount, description, received_on, recurring_income_id, created_by)
  select r.household_id,
         r.amount,
         r.name,
         public.clamp_day(m.month, r.day_of_month),
         r.id,
         r.created_by
    from (
      select gs::date as month
        from generate_series(v_from, v_to, interval '1 month') as gs
    ) m
    cross join public.recurring_incomes r
   where r.household_id = p_household_id
     and r.active
     and r.start_month <= m.month
     and (r.end_month is null or r.end_month >= m.month)
     and not exists (
       select 1 from public.recurring_income_skips s
        where s.recurring_income_id = r.id and s.period_month = m.month
     )
  on conflict (recurring_income_id, period_month) where recurring_income_id is not null
  do nothing;
end;
$$;

-- Jeden miesiąc to teraz szczególny przypadek zakresu.
create or replace function public.materialize_month(p_household_id uuid, p_month date)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.materialize_range(p_household_id, p_month, p_month);
$$;

revoke all on function public.materialize_range(uuid, date, date) from public, anon;
grant execute on function public.materialize_range(uuid, date, date) to authenticated;
