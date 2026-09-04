import type { CustomerFeatures } from "@/lib/api/types";

/** Field definitions for the individual customer form, grouped the way a campaign analyst thinks about them. */

export type NumericFieldName = "Age" | "Experience" | "Income" | "CCAvg" | "Mortgage";
export type ChoiceFieldName = "Education" | "Family";
export type ToggleFieldName = "Securities_Account" | "CD_Account" | "Online" | "CreditCard";

export interface NumericField {
  name: NumericFieldName;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  help?: string;
}

export const numericFields: Record<NumericFieldName, NumericField> = {
  Age: { name: "Age", label: "Age", unit: "years", min: 18, max: 100, step: 1 },
  Experience: { name: "Experience", label: "Professional experience", unit: "years", min: 0, max: 80, step: 1 },
  Income: { name: "Income", label: "Annual income", unit: "$000s", min: 0, max: 1000, step: 1 },
  CCAvg: { name: "CCAvg", label: "Average monthly card spend", unit: "$000s", min: 0, max: 50, step: 0.1 },
  Mortgage: { name: "Mortgage", label: "Mortgage value", unit: "$000s", min: 0, max: 2000, step: 1, help: "0 if none" },
};

export const educationOptions = [
  { value: 1, label: "Undergraduate" },
  { value: 2, label: "Graduate" },
  { value: 3, label: "Advanced / Professional" },
] as const;

export const familyOptions = [1, 2, 3, 4].map((value) => ({ value, label: String(value) }));

export const toggleFields: { name: ToggleFieldName; label: string; description: string }[] = [
  { name: "Securities_Account", label: "Securities account", description: "Holds a securities account with the bank" },
  { name: "CD_Account", label: "CD account", description: "Holds a certificate of deposit account" },
  { name: "Online", label: "Online banking", description: "Uses online banking" },
  { name: "CreditCard", label: "Credit card", description: "Holds a credit card issued by the bank" },
];

export const fieldGroups = [
  { title: "Customer", numeric: ["Age", "Experience"] as NumericFieldName[], choices: ["Family", "Education"] as ChoiceFieldName[], toggles: [] as ToggleFieldName[] },
  {
    title: "Financial relationship",
    numeric: ["Income", "CCAvg", "Mortgage"] as NumericFieldName[],
    choices: [] as ChoiceFieldName[],
    toggles: ["Securities_Account", "CD_Account"] as ToggleFieldName[],
  },
  { title: "Channels", numeric: [] as NumericFieldName[], choices: [] as ChoiceFieldName[], toggles: ["Online", "CreditCard"] as ToggleFieldName[] },
];

/** Raw form values are strings so partially typed numbers never crash rendering. */
export type CustomerFormValues = Record<NumericFieldName, string> & Record<ChoiceFieldName, number> & Record<ToggleFieldName, boolean>;

export function formValuesFromFeatures(features: CustomerFeatures): CustomerFormValues {
  return {
    Age: String(features.Age),
    Experience: String(features.Experience),
    Income: String(features.Income),
    CCAvg: String(features.CCAvg),
    Mortgage: String(features.Mortgage),
    Education: features.Education,
    Family: features.Family,
    Securities_Account: features.Securities_Account === 1,
    CD_Account: features.CD_Account === 1,
    Online: features.Online === 1,
    CreditCard: features.CreditCard === 1,
  };
}

export type FieldErrors = Partial<Record<NumericFieldName, string>>;

export interface ParsedForm {
  features: CustomerFeatures | null;
  errors: FieldErrors;
}

/** Validate the form client-side with the same ranges the API enforces, producing readable messages. */
export function parseFormValues(values: CustomerFormValues): ParsedForm {
  const errors: FieldErrors = {};
  const numbers: Partial<Record<NumericFieldName, number>> = {};

  for (const field of Object.values(numericFields)) {
    const raw = values[field.name].trim();
    if (raw === "") {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      errors[field.name] = `${field.label} must be a number.`;
      continue;
    }
    if (field.step === 1 && !Number.isInteger(parsed)) {
      errors[field.name] = `${field.label} must be a whole number.`;
      continue;
    }
    if (parsed < field.min || parsed > field.max) {
      errors[field.name] = `${field.label} must be between ${field.min} and ${field.max}${field.unit ? ` ${field.unit}` : ""}.`;
      continue;
    }
    numbers[field.name] = parsed;
  }

  if (numbers.Age !== undefined && numbers.Experience !== undefined && numbers.Experience > numbers.Age - 16) {
    errors.Experience = "Professional experience cannot exceed age minus 16 years.";
  }

  if (Object.keys(errors).length > 0) return { features: null, errors };

  return {
    features: {
      Age: numbers.Age as number,
      Experience: numbers.Experience as number,
      Income: numbers.Income as number,
      CCAvg: numbers.CCAvg as number,
      Mortgage: numbers.Mortgage as number,
      Education: values.Education as CustomerFeatures["Education"],
      Family: values.Family as CustomerFeatures["Family"],
      Securities_Account: values.Securities_Account ? 1 : 0,
      CD_Account: values.CD_Account ? 1 : 0,
      Online: values.Online ? 1 : 0,
      CreditCard: values.CreditCard ? 1 : 0,
    },
    errors,
  };
}

export function outreachPriorityLabel(priority: "higher" | "lower"): string {
  return priority === "higher" ? "Higher outreach priority" : "Lower outreach priority";
}
