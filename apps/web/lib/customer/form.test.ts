import { describe, expect, it } from "vitest";

import type { CustomerFeatures } from "@/lib/api/types";

import { formValuesFromFeatures, outreachPriorityLabel, parseFormValues } from "./form";

const features: CustomerFeatures = {
  Age: 42,
  Experience: 17,
  Income: 120,
  CCAvg: 3.2,
  Mortgage: 0,
  Education: 2,
  Family: 3,
  Securities_Account: 0,
  CD_Account: 1,
  Online: 1,
  CreditCard: 0,
};

describe("customer form parsing", () => {
  it("round-trips API features through form values", () => {
    const parsed = parseFormValues(formValuesFromFeatures(features));

    expect(parsed.errors).toEqual({});
    expect(parsed.features).toEqual(features);
  });

  it("reports readable field errors instead of sending invalid input", () => {
    const values = formValuesFromFeatures(features);
    values.Income = "";
    values.CCAvg = "abc";
    values.Age = "17";

    const parsed = parseFormValues(values);

    expect(parsed.features).toBeNull();
    expect(parsed.errors.Income).toMatch(/required/);
    expect(parsed.errors.CCAvg).toMatch(/number/);
    expect(parsed.errors.Age).toMatch(/between 18 and 100/);
  });

  it("rejects experience that is implausible for the age", () => {
    const values = formValuesFromFeatures(features);
    values.Age = "25";
    values.Experience = "20";

    expect(parseFormValues(values).errors.Experience).toMatch(/cannot exceed/);
  });

  it("requires whole numbers for integer fields and allows decimals for card spend", () => {
    const values = formValuesFromFeatures(features);
    values.Age = "42.5";
    values.CCAvg = "2.75";

    const parsed = parseFormValues(values);

    expect(parsed.errors.Age).toMatch(/whole number/);
    expect(parsed.errors.CCAvg).toBeUndefined();
  });

  it("uses outreach wording rather than approval wording", () => {
    expect(outreachPriorityLabel("higher")).toBe("Higher outreach priority");
    expect(outreachPriorityLabel("lower")).toBe("Lower outreach priority");
  });
});
