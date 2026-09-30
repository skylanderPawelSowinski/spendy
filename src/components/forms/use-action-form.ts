"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/actions/shared";

const IDLE: ActionState = { status: "idle" };

type Options = {
  /** Wywoływane po udanym zapisie — np. zamknięcie dialogu. */
  onSuccess?: () => void;
  /** Domyślnie pokazujemy toast sukcesu; wyłącz dla akcji „cichych”. */
  toastOnSuccess?: boolean;
};

/**
 * useActionState + toast + callback po sukcesie.
 * Reagujemy na identyczność obiektu stanu, nie na jego treść — dzięki temu
 * dwa takie same zapisy pod rząd dają dwa toasty.
 */
export function useActionForm(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  { onSuccess, toastOnSuccess = true }: Options = {},
) {
  const [state, formAction, isPending] = useActionState(action, IDLE);
  const seen = useRef<ActionState>(IDLE);
  const onSuccessRef = useRef(onSuccess);

  // Aktualizujemy w efekcie, nie w renderze — inline'owe callbacki zmieniają
  // tożsamość co render, więc trzymanie ich w refie omija zbędne odpalenia.
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;

    if (state.status === "ok") {
      if (toastOnSuccess && state.message) toast.success(state.message);
      onSuccessRef.current?.();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state, toastOnSuccess]);

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return { state, formAction, isPending, fieldErrors };
}
