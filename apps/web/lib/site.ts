export const siteConfig = {
  name: "Personal Loan Campaign Intelligence",
  shortName: "Campaign Intelligence",
  tagline: "Reach fewer customers. Capture more likely responders.",
  description:
    "A machine-learning decision-support system for prioritizing existing customers when marketing outreach capacity is limited.",
  repositoryUrl: "https://github.com/bhavinbarot/personal-loan-prediction",
} as const;

export type NavItem = {
  href: "/" | "/simulator" | "/validation";
  label: string;
  shortLabel: string;
  description: string;
};

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    shortLabel: "Overview",
    description: "The business problem, the decision it supports, and the validated result.",
  },
  {
    href: "/simulator",
    label: "Campaign Simulator",
    shortLabel: "Simulator",
    description: "Rank a synthetic population and apply a campaign capacity.",
  },
  {
    href: "/validation",
    label: "Technical Validation",
    shortLabel: "Validation",
    description: "Model comparison, holdout performance, and methodology.",
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
