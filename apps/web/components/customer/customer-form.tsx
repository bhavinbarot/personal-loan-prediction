"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type CustomerFormValues,
  type FieldErrors,
  educationOptions,
  familyOptions,
  fieldGroups,
  numericFields,
  toggleFields,
} from "@/lib/customer/form";
import { cn } from "cn";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 sm:h-9 dark:bg-input/30";

export function CustomerForm({
  values,
  errors,
  onChange,
  disabled = false,
}: {
  values: CustomerFormValues;
  errors: FieldErrors;
  onChange: (next: CustomerFormValues) => void;
  disabled?: boolean;
}) {
  const idPrefix = useId();
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="flex flex-col gap-6">
      {fieldGroups.map((group) => (
        <fieldset key={group.title} className="min-w-0">
          <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.title}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.numeric.map((name) => {
              const field = numericFields[name];
              const error = errors[name];
              return (
                <div key={name} className="flex flex-col gap-1.5">
                  <Label htmlFor={id(name)} className="text-sm">
                    {field.label}
                    {field.unit ? <span className="font-normal text-muted-foreground"> ({field.unit})</span> : null}
                  </Label>
                  <Input
                    id={id(name)}
                    inputMode={field.step === 1 ? "numeric" : "decimal"}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[name]}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? id(`${name}-error`) : field.help ? id(`${name}-help`) : undefined}
                    onChange={(event) => onChange({ ...values, [name]: event.target.value })}
                    className="h-10 sm:h-9"
                  />
                  {error ? (
                    <p id={id(`${name}-error`)} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : field.help ? (
                    <p id={id(`${name}-help`)} className="text-xs text-muted-foreground">
                      {field.help}
                    </p>
                  ) : null}
                </div>
              );
            })}

            {group.choices.map((name) => {
              const options = name === "Education" ? educationOptions : familyOptions;
              const label = name === "Education" ? "Education" : "Family size";
              return (
                <div key={name} className="flex flex-col gap-1.5">
                  <Label htmlFor={id(name)} className="text-sm">
                    {label}
                  </Label>
                  <select
                    id={id(name)}
                    className={selectClassName}
                    value={values[name]}
                    disabled={disabled}
                    onChange={(event) => onChange({ ...values, [name]: Number(event.target.value) })}
                  >
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            {group.toggles.length > 0 ? (
              <div className={cn("grid gap-2", group.numeric.length + group.choices.length > 0 ? "sm:col-span-2 sm:grid-cols-2" : "sm:col-span-2 sm:grid-cols-2")}>
                {group.toggles.map((name) => {
                  const toggle = toggleFields.find((t) => t.name === name)!;
                  return (
                    <Label
                      key={name}
                      htmlFor={id(name)}
                      className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">{toggle.label}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toggle.description}</span>
                      </span>
                      <Switch
                        id={id(name)}
                        checked={values[name]}
                        disabled={disabled}
                        onCheckedChange={(checked) => onChange({ ...values, [name]: checked })}
                      />
                    </Label>
                  );
                })}
              </div>
            ) : null}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
