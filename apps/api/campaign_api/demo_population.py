from __future__ import annotations

from functools import lru_cache

import numpy as np

from campaign_api.config import DEMO_POPULATION_SEED


DEMO_NOTE = (
    "Synthetic customers generated deterministically from a fixed seed. "
    "They are not drawn from the training dataset and carry no observed campaign outcomes."
)


def customer_label(position: int) -> str:
    return f"Customer {position:03d}"


@lru_cache(maxsize=8)
def generate_population(size: int, seed: int = DEMO_POPULATION_SEED) -> list[dict]:
    """Generate a deterministic synthetic customer population within the model's expected ranges."""
    rng = np.random.default_rng(seed)

    age = rng.integers(23, 68, size=size)
    experience = np.clip(age - 22 - rng.integers(0, 6, size=size), 0, None)
    income = np.clip(np.round(rng.lognormal(mean=4.15, sigma=0.55, size=size)), 8, 224).astype(int)
    ccavg = np.clip(np.round(income / 100 * rng.gamma(shape=2.2, scale=0.75, size=size), 2), 0.0, 10.0)
    has_mortgage = rng.random(size) < 0.31
    mortgage = np.where(has_mortgage, np.clip(np.round(rng.gamma(shape=2.5, scale=70, size=size)), 60, 635), 0).astype(int)
    education = rng.choice([1, 2, 3], size=size, p=[0.42, 0.28, 0.30])
    family = rng.choice([1, 2, 3, 4], size=size, p=[0.29, 0.26, 0.20, 0.25])
    securities = rng.binomial(1, 0.10, size=size)
    cd_account = rng.binomial(1, 0.06, size=size)
    online = rng.binomial(1, 0.60, size=size)
    credit_card = rng.binomial(1, 0.29, size=size)

    customers = []
    for i in range(size):
        customers.append(
            {
                "customer_id": customer_label(i + 1),
                "features": {
                    "Age": int(age[i]),
                    "Experience": int(experience[i]),
                    "Income": float(income[i]),
                    "CCAvg": float(ccavg[i]),
                    "Mortgage": float(mortgage[i]),
                    "Education": int(education[i]),
                    "Family": int(family[i]),
                    "Securities_Account": int(securities[i]),
                    "CD_Account": int(cd_account[i]),
                    "Online": int(online[i]),
                    "CreditCard": int(credit_card[i]),
                },
            }
        )
    return customers
