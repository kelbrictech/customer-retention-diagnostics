# TrendVibe Apparel — Customer Retention Diagnostic

## Objective

Investigate a simulated deterioration in customer retention and translate the strongest observed churn signals into operational intervention rules.

## Scenario

TrendVibe Apparel is a simulated online fashion retailer with 10,000 customer records. Overall churn is 24%, while quarterly retention declined from 79% in Q1 to 66% in Q4. Churn is defined as 90 or more days without a purchase as of December 31, 2025.

The source population also contains 45 wholesale accounts with lifetime spending above $15,000. These accounts are structurally separated from core consumer-retail analysis to prevent them from distorting spending metrics.

## Key observed patterns

| Dimension | Segment | Observed churn |
| --- | --- | ---: |
| Order lifecycle | 1 order | 68% |
| Order lifecycle | 2–3 orders | 18% |
| Order lifecycle | 4–5 orders | 6% |
| Order lifecycle | 6+ orders | 2% |
| Support tickets | 0 | 15% |
| Support tickets | 1 | 18% |
| Support tickets | 2 | 45% |
| Support tickets | 3+ | 82% |
| Signup channel | Social Media | 38% |
| Signup channel | Paid Ads | 24% |
| Signup channel | Organic Search | 12% |
| Signup channel | Referral | 8% |
| Age | 18–24 | 42% |
| Age | 25–34 | 20% |
| Age | 35–44 | 14% |
| Age | 45–65 | 8% |

Excluding wholesale accounts, median observed lifetime spend was $420 among active customers and $85 among churned customers.

## Interpretation

The strongest broad behavioral signal is failure to progress beyond the first purchase. Repeated support interactions form a second operational risk signal, particularly once a customer reaches two or more tickets. Social Media acquisition also shows substantially higher observed churn than Organic Search and Referral traffic.

These are associations in the simulated data. They are not presented as independently established causal effects. In particular, age, signup channel, and purchase frequency may overlap. Without joint cross-tabulation or customer-level modeling, their marginal churn rates cannot be combined into a defensible multivariate probability.

`days_since_last_purchase` is not treated as an explanatory churn driver because the field is used to define the churn outcome itself.

## Operationalization

The SQL monitor selects customers who have not yet reached official churn status but meet at least one intervention condition:

1. Two or more customer-support tickets; or
2. Age 18–24 + Social Media acquisition + exactly one lifetime order.

The first rule creates a service-recovery queue. The second creates a priority marketing target based on multiple observed risk indicators. The second rule is a targeting heuristic rather than a calculated combined churn score.

## Recommended interventions

- Build a first-to-second-purchase retention program and measure second-order conversion.
- Trigger service recovery when a customer reaches two support tickets rather than waiting for further escalation.
- Evaluate Social Media acquisition using 30/60/90-day retention, second-purchase rate, and downstream customer value rather than acquisition volume alone.

## Analytical limitations

This is a simulated portfolio case. The current monitor is rules-based. It does not claim causal inference, machine-learning prediction, or production real-time processing. Validation against customer-level joint distributions would be required before interpreting overlapping risk factors as a combined probability.
