# Data

The TrendVibe Apparel dataset used in this portfolio case is simulated and is not currently distributed with the repository.

## Scenario schema

Expected fields:

- `customer_id`
- `age`
- `signup_channel`
- `total_orders`
- `total_spent`
- `customer_support_tickets`
- `days_since_last_purchase`
- `churn_status`

## Known scenario characteristics

- 10,000 customer accounts
- 2,400 churned customers (24% overall churn)
- 850 records with missing signup-channel attribution
- 45 wholesale accounts with `total_spent > 15000`
- Snapshot date: 2025-12-31
- Churn definition: 90+ days without a purchase

The analysis separates wholesale accounts from consumer-retail metrics and categorizes missing signup-channel values as `Unknown`.
