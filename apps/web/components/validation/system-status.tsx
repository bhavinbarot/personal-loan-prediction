import { getMetadata, getReadiness } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { MetadataResponse } from "@/lib/api/types";

type Status = { service: "operational" | "unreachable"; modelLoaded: boolean | null; metadata: MetadataResponse | null };

async function loadStatus(): Promise<Status> {
  let modelLoaded: boolean | null = null;
  let service: Status["service"] = "operational";
  try {
    const ready = await getReadiness({ timeoutMs: 5_000 });
    modelLoaded = ready.model_loaded;
  } catch (error) {
    if (isApiError(error) && error.status === 503) modelLoaded = false;
    else service = "unreachable";
  }
  let metadata: MetadataResponse | null = null;
  if (service === "operational") {
    try {
      metadata = await getMetadata({ timeoutMs: 5_000 });
    } catch {
      metadata = null;
    }
  }
  return { service, modelLoaded, metadata };
}

/** Subtle operational status: enough to confirm what is running, not a monitoring console. */
export async function SystemStatus() {
  const status = await loadStatus();
  const app = status.metadata?.application;
  const model = status.metadata?.model;
  const rows = [
    { label: "Service", value: status.service === "operational" ? "Operational" : "Unreachable", ok: status.service === "operational" },
    { label: "Model", value: status.modelLoaded === null ? "Unknown" : status.modelLoaded ? "Loaded" : "Not loaded", ok: status.modelLoaded === true },
    { label: "API version", value: app ? `v${app.version}${app.git_commit ? ` · ${app.git_commit.slice(0, 7)}` : ""}` : "—", ok: null },
    { label: "Model artifact", value: model ? `${model.estimator_class} · artifact ${model.artifact_version} · sklearn ${model.sklearn_version}` : "—", ok: null },
  ];

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="System status">
      {rows.map((row) => (
        <div key={row.label} className="rounded-lg border border-border px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="mt-0.5 flex items-start gap-1.5 text-sm font-medium">
            {row.ok !== null ? (
              <span className={row.ok ? "mt-1.5 size-2 shrink-0 rounded-full bg-success" : "mt-1.5 size-2 shrink-0 rounded-full bg-warning"} aria-hidden />
            ) : null}
            <span className="min-w-0 break-words">{row.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
