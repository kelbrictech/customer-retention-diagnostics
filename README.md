# Customer Retention Diagnostics

Diagnostic analytics case studies for identifying customer-retention risk, isolating churn signals, and translating findings into operational interventions.

## Case Study: TrendVibe Apparel

TrendVibe Apparel is a simulated customer-retention diagnostic case built around a 10,000-customer retail dataset. The case demonstrates how business symptoms are translated into data-quality checks, defensible segmentation, diagnostic summaries, operational risk rules, and measurable retention interventions.

### Business context

- Overall churn: 24%
- Retention declined from 78% in Q2 to 66% in Q4
- Wholesale accounts above $15,000 lifetime spend are isolated from consumer-retail analysis
- Churn is defined as 90+ days without a purchase
- Higher observed churn was concentrated among one-order customers, younger customers, Social Media acquisitions, and customers with repeated support tickets

### Analytical discipline

The project deliberately treats `days_since_last_purchase` as part of the churn definition rather than an explanatory churn driver. It also avoids assigning a combined churn probability to overlapping risk indicators when no joint cross-tabulation is available.

### Implementations

- **SQL retention alert monitor** — converts historical churn evidence into a rules-based intervention list of still-active customers meeting defined service-recovery or multi-indicator targeting conditions.
- **Python retention diagnostic engine** — validates the input schema, isolates wholesale accounts, handles missing acquisition attribution, reproduces business-defined order and support-ticket bands, summarizes observed churn by segment, and compares active versus churned median lifetime spend.

### Repository structure

```text
customer-retention-diagnostics/
├── README.md
├── .gitignore
└── case-studies/
    └── trendvibe-apparel/
        ├── README.md
        ├── data/
        │   └── README.md
        ├── sql/
        │   └── retention_alert_monitor.sql
        └── python/
            └── retention_diagnostics.py
```

### Current capability demonstrated

This repository demonstrates a diagnostic workflow from business symptom to analytical controls and operational intervention. The SQL component is a rules-based retention alert layer; the Python component is a reproducible diagnostic summarization pipeline. Neither is represented as a machine-learning churn model or causal model.

## Status

Portfolio case study in active development. The dataset is simulated and is not currently distributed with the repository.
