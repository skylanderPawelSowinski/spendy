/**
 * Typy bazy. Można je zregenerować poleceniem:
 *   npx supabase gen types typescript --project-id hlvziklzfkvqyjdoluog > src/lib/supabase/types.ts
 */

type Timestamp = string;
type DateStr = string;

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  active_household_id: string | null;
  created_at: Timestamp;
};

export type SpendingLimitKind = "none" | "amount" | "percent";

export type HouseholdRow = {
  id: string;
  name: string;
  currency: string;
  spending_limit_kind: SpendingLimitKind;
  spending_limit_value: number | null;
  created_by: string;
  created_at: Timestamp;
};

export type HouseholdMemberRow = {
  household_id: string;
  user_id: string;
  joined_at: Timestamp;
};

export type HouseholdInviteRow = {
  id: string;
  household_id: string;
  token: string;
  email: string | null;
  invited_by: string;
  accepted_by: string | null;
  accepted_at: Timestamp | null;
  revoked_at: Timestamp | null;
  expires_at: Timestamp;
  created_at: Timestamp;
};

export type CategoryRow = {
  id: string;
  household_id: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  archived: boolean;
  created_at: Timestamp;
};

export type ExpenseRow = {
  id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  spent_on: DateStr;
  period_month: DateStr;
  recurring_expense_id: string | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type IncomeRow = {
  id: string;
  household_id: string;
  amount: number;
  description: string | null;
  received_on: DateStr;
  period_month: DateStr;
  recurring_income_id: string | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type RecurringExpenseRow = {
  id: string;
  household_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  day_of_month: number;
  start_month: DateStr;
  end_month: DateStr | null;
  active: boolean;
  created_by: string | null;
  created_at: Timestamp;
};

export type RecurringIncomeRow = {
  id: string;
  household_id: string;
  name: string;
  amount: number;
  day_of_month: number;
  start_month: DateStr;
  end_month: DateStr | null;
  active: boolean;
  created_by: string | null;
  created_at: Timestamp;
};

export type HouseholdMemberView = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  joined_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      households: Table<
        HouseholdRow,
        Pick<HouseholdRow, "name" | "created_by"> & Partial<HouseholdRow>
      >;
      household_members: Table<HouseholdMemberRow>;
      household_invites: Table<
        HouseholdInviteRow,
        Pick<HouseholdInviteRow, "household_id" | "invited_by"> &
          Partial<HouseholdInviteRow>
      >;
      categories: Table<
        CategoryRow,
        Pick<CategoryRow, "household_id" | "name"> & Partial<CategoryRow>
      >;
      expenses: Table<
        ExpenseRow,
        Pick<ExpenseRow, "household_id" | "amount" | "spent_on"> &
          Partial<Omit<ExpenseRow, "period_month">>
      >;
      incomes: Table<
        IncomeRow,
        Pick<IncomeRow, "household_id" | "amount" | "received_on"> &
          Partial<Omit<IncomeRow, "period_month">>
      >;
      recurring_expenses: Table<
        RecurringExpenseRow,
        Pick<
          RecurringExpenseRow,
          "household_id" | "name" | "amount" | "start_month"
        > &
          Partial<RecurringExpenseRow>
      >;
      recurring_incomes: Table<
        RecurringIncomeRow,
        Pick<
          RecurringIncomeRow,
          "household_id" | "name" | "amount" | "start_month"
        > &
          Partial<RecurringIncomeRow>
      >;
      recurring_expense_skips: Table<{
        recurring_expense_id: string;
        period_month: DateStr;
        created_at: Timestamp;
      }>;
      recurring_income_skips: Table<{
        recurring_income_id: string;
        period_month: DateStr;
        created_at: Timestamp;
      }>;
    };
    Views: Record<never, never>;
    Functions: {
      bootstrap_user: { Args: Record<string, never>; Returns: string };
      create_household: { Args: { p_name: string }; Returns: string };
      accept_invite: { Args: { p_token: string }; Returns: string };
      invite_preview: {
        Args: { p_token: string };
        Returns: {
          household_name: string;
          invited_by: string | null;
          status:
            | "valid"
            | "revoked"
            | "accepted"
            | "expired"
            | "already_member";
        }[];
      };
      leave_household: { Args: { p_household_id: string }; Returns: void };
      materialize_month: {
        Args: { p_household_id: string; p_month: string };
        Returns: void;
      };
      materialize_range: {
        Args: { p_household_id: string; p_from: string; p_to: string };
        Returns: void;
      };
      delete_expense: { Args: { p_id: string }; Returns: void };
      delete_income: { Args: { p_id: string }; Returns: void };
      household_members_view: {
        Args: { p_household_id: string };
        Returns: HouseholdMemberView[];
      };
      is_household_member: { Args: { hid: string }; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
