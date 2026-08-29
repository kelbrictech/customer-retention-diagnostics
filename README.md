# Customer Retention Diagnostics

Diagnostic analytics case studies for identifying customer-retention risk, isolating churn signals, and translating findings into operational interventions.

## Case Study: TrendVibe Apparel

TrendVibe Apparel is a simulated customer-retention diagnostic case built around a 10,000-customer retail dataset. The case demonstrates how business symptoms are translated into data checks, defensible segmentation, operational risk rules, and measurable retention interventions.

### Business context

- Overall churn: 24%
- Retention declined from 78% in Q2 to 66% in Q4
- Wholesale accounts above $15,000 lifetime spend are isolated from consumer-retail analysis
- Churn is defined as 90+ days without a purchase
- Higher observed churn was concentrated among one-order customers, younger customers, Social Media acquisitions, and customers with repeated support tickets

### Analytical discipline

The project deliberately treats `days_since_last_purchase` as part of the churn definition rather than an explanatory churn driver. It also avoids assigning a combined churn probability to overlapping risk indicators when no joint cross-tabulation is available.

### Repository structure

```text
customer-retention-diagnostics/
├── README.md
├── case-studies/
│   └── trendvibe-apparel/
│       ├── README.md
│       ├── sql/
│       │   └── retention_alert_monitor.sql
│       └── data/
│           └── README.md
└── .gitignore
```

### Current capability demonstrated

The SQL monitor converts historical churn evidence into an operational list of still-active customers who meet defined intervention rules. It is a rules-based retention alert layer, not a machine-learning churn model and not a causal model.

## Status

Portfolio case study in active development. Dataset is simulated and is not included in the repository yet.
