"""Generate a deterministic synthetic dataset for the TrendVibe portfolio case.

This generator creates 10,000 fictional customer records with the schema expected by
retention_diagnostics.py. The data is designed for reproducible demonstration of the
pipeline; it is not the original client dataset and should not be interpreted as
independent evidence for the aggregate case-study findings.
"""

from pathlib import Path
import numpy as np
import pandas as pd

SEED = 20251231
N_CUSTOMERS = 10_000
N_WHOLESALE = 45
SNAPSHOT = pd.Timestamp("2025-12-31")
OUTPUT_PATH = Path(__file__).resolve().parent / "generated" / "trendvibe_customer_data.csv"


def weighted_choice(rng, values, probabilities, size):
    return rng.choice(values, size=size, p=probabilities)


def generate_dataset():
    rng = np.random.default_rng(SEED)
    n_retail = N_CUSTOMERS - N_WHOLESALE

    age_band = weighted_choice(
        rng,
        ["18-24", "25-34", "35-44", "45-65"],
        [0.35, 0.40, 0.15, 0.10],
        n_retail,
    )
    age_ranges = {"18-24": (18, 24), "25-34": (25, 34), "35-44": (35, 44), "45-65": (45, 65)}
    ages = np.array([rng.integers(age_ranges[b][0], age_ranges[b][1] + 1) for b in age_band])

    channels = weighted_choice(
        rng,
        ["Social Media", "Paid Ads", "Organic Search", "Referral", None],
        [0.31, 0.40, 0.105, 0.10, 0.085],
        n_retail,
    )

    order_band = weighted_choice(
        rng,
        ["1", "2-3", "4-5", "6+"],
        [0.25, 0.50, 0.18, 0.07],
        n_retail,
    )
    orders = np.array([
        1 if band == "1" else rng.integers(2, 4) if band == "2-3"
        else rng.integers(4, 6) if band == "4-5" else rng.integers(6, 13)
        for band in order_band
    ])

    ticket_band = weighted_choice(
        rng,
        ["0", "1", "2", "3+"],
        [0.60, 0.25, 0.10, 0.05],
        n_retail,
    )
    tickets = np.array([
        int(band) if band != "3+" else rng.integers(3, 6)
        for band in ticket_band
    ])

    # Risk score creates plausible overlap between lifecycle, service friction,
    # acquisition source, and age. It is a synthetic mechanism, not a fitted model.
    logit = np.full(n_retail, -2.35)
    logit += np.where(orders == 1, 2.10, 0.0)
    logit += np.where(tickets == 2, 1.25, 0.0)
    logit += np.where(tickets >= 3, 2.65, 0.0)
    logit += np.where(channels == "Social Media", 0.65, 0.0)
    logit += np.where(ages <= 24, 0.55, 0.0)
    probability = 1 / (1 + np.exp(-logit))
    churn = rng.binomial(1, np.clip(probability, 0.01, 0.95))

    # Recency is generated consistently with the case definition: churn means
    # 90+ days without a purchase. It is therefore not used above as a driver.
    days_since = np.where(
        churn == 1,
        rng.integers(90, 366, n_retail),
        rng.integers(0, 90, n_retail),
    )

    base_spend = orders * rng.lognormal(mean=4.45, sigma=0.42, size=n_retail)
    spend_adjustment = np.where(churn == 1, 0.55, 1.0)
    total_spent = np.round(np.maximum(15, base_spend * spend_adjustment), 2)

    signup_days_ago = rng.integers(30, 900, n_retail)
    signup_date = SNAPSHOT - pd.to_timedelta(signup_days_ago, unit="D")

    retail = pd.DataFrame({
        "customer_id": [f"TV-{i:05d}" for i in range(1, n_retail + 1)],
        "age": ages,
        "signup_channel": channels,
        "signup_date": signup_date.date,
        "total_orders": orders,
        "total_spent": total_spent,
        "customer_support_tickets": tickets,
        "days_since_last_purchase": days_since,
        "churn_status": churn,
    })

    wholesale = pd.DataFrame({
        "customer_id": [f"TV-W-{i:03d}" for i in range(1, N_WHOLESALE + 1)],
        "age": rng.integers(25, 66, N_WHOLESALE),
        "signup_channel": weighted_choice(rng, ["Referral", "Organic Search", "Paid Ads"], [0.5, 0.3, 0.2], N_WHOLESALE),
        "signup_date": (SNAPSHOT - pd.to_timedelta(rng.integers(365, 1200, N_WHOLESALE), unit="D")).date,
        "total_orders": rng.integers(20, 80, N_WHOLESALE),
        "total_spent": np.round(rng.uniform(15001, 45000, N_WHOLESALE), 2),
        "customer_support_tickets": rng.integers(0, 4, N_WHOLESALE),
        "days_since_last_purchase": rng.integers(0, 90, N_WHOLESALE),
        "churn_status": np.zeros(N_WHOLESALE, dtype=int),
    })

    return pd.concat([retail, wholesale], ignore_index=True)


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df = generate_dataset()
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Generated {len(df):,} synthetic customer records.")
    print(f"Output: {OUTPUT_PATH}")
    print(f"Random seed: {SEED}")


if __name__ == "__main__":
    main()
