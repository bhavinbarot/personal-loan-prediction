"use client";

import { useEffect, useMemo, useState } from "react";

import { CustomerForm } from "@/components/customer/customer-form";
import { CustomerResult } from "@/components/customer/customer-result";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPresets, predictCustomer } from "@/lib/api/endpoints";
import type { CustomerFeatures, CustomerPreset, PredictResponse } from "@/lib/api/types";
import { type CustomerFormValues, formValuesFromFeatures, parseFormValues } from "@/lib/customer/form";

type PresetsState = { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; presets: CustomerPreset[] };
type ResultState =
  | { status: "idle" }
  | { status: "loading"; previous: PredictResponse | null }
  | { status: "error"; error: unknown }
  | { status: "ready"; result: PredictResponse };

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-9 sm:w-auto sm:min-w-56 dark:bg-input/30";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function CustomerExplorer() {
  const [presets, setPresets] = useState<PresetsState>({ status: "loading" });
  const [presetsAttempt, setPresetsAttempt] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [values, setValues] = useState<CustomerFormValues | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [request, setRequest] = useState<{ key: number; features: CustomerFeatures } | null>(null);
  const [outcome, setOutcome] = useState<{ key: number; state: ResultState } | null>(null);
  const [lastResult, setLastResult] = useState<PredictResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getPresets({ signal: controller.signal })
      .then((response) => {
        setPresets({ status: "ready", presets: response.presets });
        // First visit: load the first sample into the form and score it straight away.
        const first = response.presets[0];
        if (first) {
          setActivePreset(first.id);
          setValues((current) => current ?? formValuesFromFeatures(first.features));
          setRequest((current) => current ?? { key: 1, features: first.features });
        }
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) setPresets({ status: "error", error });
      });
    return () => controller.abort();
  }, [presetsAttempt]);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    predictCustomer(request.features, { signal: controller.signal })
      .then((result) => {
        setLastResult(result);
        setOutcome({ key: request.key, state: { status: "ready", result } });
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) setOutcome({ key: request.key, state: { status: "error", error } });
      });
    return () => controller.abort();
  }, [request]);

  const parsed = useMemo(() => (values ? parseFormValues(values) : null), [values]);
  const resultState: ResultState = !request
    ? { status: "idle" }
    : outcome && outcome.key === request.key
      ? outcome.state
      : { status: "loading", previous: lastResult };
  const displayedResult =
    resultState.status === "ready" ? resultState.result : resultState.status === "loading" ? resultState.previous : null;
  const pending = resultState.status === "loading";

  function selectPreset(id: string) {
    if (presets.status !== "ready") return;
    const preset = presets.presets.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(preset.id);
    setValues(formValuesFromFeatures(preset.features));
    setShowErrors(false);
    setRequest({ key: (request?.key ?? 0) + 1, features: preset.features });
  }

  function handleValuesChange(next: CustomerFormValues) {
    setValues(next);
    setActivePreset(null);
  }

  function score() {
    if (!parsed) return;
    setShowErrors(true);
    if (!parsed.features) return;
    setRequest({ key: (request?.key ?? 0) + 1, features: parsed.features });
  }

  if (presets.status === "error") {
    return <ApiErrorState error={presets.error} onRetry={() => setPresetsAttempt((n) => n + 1)} compact />;
  }

  if (presets.status === "loading" || !values || !parsed) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" aria-busy>
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  const activeName = presets.presets.find((p) => p.id === activePreset)?.name ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
      <form
        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          score();
        }}
        noValidate
      >
        <div className="mb-5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="customer-preset" className="text-sm font-medium">
            Start from a sample customer
          </label>
          <select
            id="customer-preset"
            className={selectClassName}
            value={activePreset ?? ""}
            onChange={(event) => selectPreset(event.target.value)}
          >
            {activePreset === null ? <option value="">Custom profile</option> : null}
            {presets.presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <CustomerForm values={values} errors={showErrors ? parsed.errors : {}} onChange={handleValuesChange} disabled={false} />

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="submit" className="h-11 sm:h-9" disabled={pending}>
            {pending ? "Scoring…" : "Score customer"}
          </Button>
          <p className="text-xs text-muted-foreground">Values are scored by the API and never stored.</p>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {resultState.status === "error" ? (
          <ApiErrorState error={resultState.error} onRetry={score} compact />
        ) : displayedResult ? (
          <CustomerResult result={displayedResult} pending={pending} customerName={activeName} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Choose a sample customer or enter a profile, then score it to see the predicted campaign response.
          </div>
        )}
      </div>
    </div>
  );
}
