# Customer Retention Diagnostics

Diagnostic analytics case studies for identifying customer-retention risk, isolating churn signals, and translating findings into operational interventions.

## Case Study: TrendVibe Apparel

TrendVibe Apparel is a simulated customer-retention diagnostic case built around a 10,000-customer retail scenario. The case demonstrates how business symptoms are translated into data-quality checks, defensible segmentation, diagnostic summaries, operational risk rules, and measurable retention interventions.

### Business context

- Overall churn in the case brief: 24%
- Retention declined from 78% in Q2 to 66% in Q4
- Wholesale accounts above $15,000 lifetime spend are isolated from consumer-retail analysis
- Churn is defined as 90+ days without a purchase
- Higher observed churn was concentrated among one-order customers, younger customers, Social Media acquisitions, and customers with repeated support tickets

### Analytical discipline

The project deliberately treats `days_since_last_purchase` as part of the churn definition rather than an explanatory churn driver. It also avoids assigning a combined churn probability to overlapping risk indicators when no joint cross-tabulation is available.

### Implementations

- **SQL retention alert monitor** — converts historical churn evidence into a rules-based intervention list of still-active customers meeting defined service-recovery or multi-indicator targeting conditions.
- **Python retention diagnostic engine** — validates the input schema, isolates wholesale accounts, handles missing acquisition attribution, reproduces business-defined order and support-ticket bands, summarizes observed churn by segment, and compares active versus churned median lifetime spend.
- **Deterministic mock-data generator** — creates 10,000 fictional customer records with a fixed random seed so the code path can be reproduced without distributing a client dataset.

### Quick reproducible demo

Requirements: Python 3 with `pandas` and `numpy` installed.

From `case-studies/trendvibe-apparel/` run:

```bash
python data/generate_mock_data.py
python python/retention_diagnostics.py
```

The first command writes `data/generated/trendvibe_customer_data.csv`. The second runs the diagnostic pipeline against that generated file.

> **Important:** the generated records are synthetic demonstration data. They reproduce the expected schema and plausible risk relationships; they are not the original dataset behind the aggregate case-study statistics and should not be treated as independent validation of those statistics.

### Repository structure

```text
customer-retention-diagnostics/
├── README.md
├── .gitignore
└── case-studies/
    └── trendvibe-apparel/
        ├── README.md
        ├── data/
        │   ├── README.md
        │   └── generate_mock_data.py
        ├── sql/
        │   └── retention_alert_monitor.sql
        └── python/
            └── retention_diagnostics.py
```

### Current capability demonstrated

This repository demonstrates a diagnostic workflow from business symptom to analytical controls and operational intervention. The SQL component is a rules-based retention alert layer; the Python component is a reproducible diagnostic summarization pipeline. Neither is represented as a machine-learning churn model or causal model.

## Status

Reproducible simulated portfolio case study. The original client-style dataset was not supplied; a deterministic synthetic generator is included solely to demonstrate execution of the pipeline.
