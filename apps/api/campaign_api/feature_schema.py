from __future__ import annotations


EDUCATION_OPTIONS = [
    {"value": 1, "label": "Undergraduate"},
    {"value": 2, "label": "Graduate"},
    {"value": 3, "label": "Advanced / Professional"},
]

FAMILY_OPTIONS = [{"value": n, "label": str(n)} for n in (1, 2, 3, 4)]

BINARY_OPTIONS = [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}]


FEATURE_SCHEMA = [
    {"name": "Age", "label": "Age", "kind": "integer", "unit": "years", "minimum": 18, "maximum": 100},
    {"name": "Experience", "label": "Professional experience", "kind": "integer", "unit": "years", "minimum": 0, "maximum": 80},
    {"name": "Income", "label": "Annual income", "kind": "number", "unit": "$000s", "minimum": 0, "maximum": 1000},
    {"name": "CCAvg", "label": "Average monthly card spend", "kind": "number", "unit": "$000s", "minimum": 0, "maximum": 50},
    {"name": "Mortgage", "label": "Mortgage value", "kind": "number", "unit": "$000s", "minimum": 0, "maximum": 2000},
    {"name": "Education", "label": "Education", "kind": "categorical", "options": EDUCATION_OPTIONS},
    {"name": "Family", "label": "Family size", "kind": "categorical", "options": FAMILY_OPTIONS},
    {"name": "Securities_Account", "label": "Securities account", "kind": "binary", "options": BINARY_OPTIONS},
    {"name": "CD_Account", "label": "CD account", "kind": "binary", "options": BINARY_OPTIONS},
    {"name": "Online", "label": "Online banking", "kind": "binary", "options": BINARY_OPTIONS},
    {"name": "CreditCard", "label": "Credit card", "kind": "binary", "options": BINARY_OPTIONS},
]
