# Case Study: TrendVibe Apparel — Customer Churn Diagnosis

This folder contains the technical implementation and strategic playbook for diagnosing a simulated customer-retention decline at TrendVibe Apparel. It is written so business stakeholders can understand the findings, intervention logic, and measurable next steps without needing to inspect the source code.

## 📊 Business Problem Recap

TrendVibe experienced a **12-percentage-point decline** in customer retention over two quarters, falling from a Q2 baseline of 78% to 66% in Q4. Overall churn in the simulated 10,000-customer case was 24%.

The diagnostic objective was to identify the strongest behavioral, operational, and acquisition signals associated with this deterioration and translate those signals into practical retention interventions.

Churn is defined as 90 or more days without a purchase as of December 31, 2025. Because `days_since_last_purchase` defines the outcome, it is deliberately not treated as an explanatory churn driver.

The source population also includes 45 wholesale accounts with lifetime spending above $15,000. These accounts are separated from consumer-retail analysis so they do not distort standard retail spending metrics.

## 🎯 Executive Findings Summary

### The “One-and-Done” Structural Cliff

Customer churn is heavily concentrated at the first-purchase threshold. Single-order customers show a **68% observed churn rate**, compared with **18% among customers reaching 2–3 orders**, 6% at 4–5 orders, and 2% at 6+ orders.

This makes failure to reach a second purchase the strongest broad behavioral signal in the case. Excluding wholesale accounts, churned customers also show median observed lifetime spend of only **$85**, compared with **$420 among active customers**.

### Operational Friction Window

Repeated customer-support interactions are associated with sharply higher churn. Customers with no support tickets show 15% observed churn and customers with one ticket show 18%. At **two tickets, observed churn rises to 45%**, reaching **82% among customers with three or more tickets**.

This identifies two support tickets as a practical intervention threshold for proactive service recovery. The Q4 logistics bottleneck and shipping delays provide a plausible operational mechanism for the late-stage acceleration, while the earlier Q2-to-Q3 retention decline indicates that logistics alone cannot explain the full deterioration.

### Social Media Acquisition Quality

Social Media-acquired customers show a **38% observed churn rate**, compared with Paid Ads at 24%, Organic Search at 12%, and Referral at 8%. TrendVibe also aggressively expanded TikTok and Instagram partnerships during Q3/Q4 while overall retention was deteriorating.

This makes acquisition quality a meaningful investigation and optimization target, but not an independently established cause of the retention decline. Age, acquisition channel, purchase frequency, and service experience may overlap, and the available marginal rates cannot establish their independent effects.

## 🛠️ Implemented Solutions & Frameworks

### 1. Diagnostic Summary Engine — `python/retention_diagnostics.py`

A reproducible Python diagnostic pipeline that:

- validates the required CRM dataset schema before analysis;
- isolates wholesale accounts spending above $15,000 from consumer-retail metrics;
- retains missing-spend records rather than silently discarding them;
- handles missing acquisition attribution by assigning an `Unknown` cohort;
- aggregates customers into the business-defined 1 / 2–3 / 4–5 / 6+ order lifecycle bands;
- aggregates support interactions into 0 / 1 / 2 / 3+ ticket bands;
- summarizes observed churn across lifecycle, support-friction, and acquisition cohorts; and
- compares median observed lifetime spend between active and churned retail customers.

The financial metric is intentionally described as observed **lifetime spend**, not Customer Lifetime Value (CLV), because no forward-looking CLV model was constructed.

### 2. Rules-Based Retention Intervention Monitor — `sql/retention_alert_monitor.sql`

The SQL monitor converts historical diagnostic evidence into an actionable list of customers who are still active but meet defined intervention conditions.

- **Service Recovery Flag:** surfaces active customers with exactly two support tickets, corresponding to the observed 45% churn cohort.
- **Escalation Flag:** prioritizes active customers with three or more support tickets, corresponding to the observed 82% churn cohort.
- **Persona Targeting Flag:** identifies active customers aged 18–24, acquired through Social Media, with exactly one lifetime order.

The persona rule combines multiple observed risk indicators for targeting purposes. It is a heuristic intervention rule, **not a calculated combined churn probability**.

The SQL implementation also includes a concise development revision log documenting the corrected intermediate CTE projection issue, NULL-spend handling, and demographic fallback handling.

## 📈 Strategic Recommendations & KPIs

1. **First-to-Second Purchase Lifecycle Program** — Build tailored post-purchase email, offer, or lifecycle flows focused on converting single-purchase customers into repeat buyers.  
   **Primary KPI:** First-to-Second Purchase Conversion Rate.

2. **Two-Ticket Customer Service Recovery Trigger** — Route customers reaching a second support ticket into a priority service-recovery workflow before further escalation.  
   **Primary KPI:** Post-Complaint Churn Rate, tracked against customers receiving the intervention.

3. **Retention-Adjusted Acquisition Evaluation** — Evaluate Social Media campaigns using downstream customer quality rather than acquisition volume alone. Compare campaigns using 30/60/90-day retention, second-purchase behavior, and observed downstream customer value.  
   **Primary KPI:** 90-Day Retention Rate by Campaign Cohort.

## 🔄 Reproducible Demonstration

The original client-style exercise supplied aggregate statistics rather than a physical customer-level CSV. To make the technical pipeline runnable, this repository includes `data/generate_mock_data.py`, which generates **10,000 fictional customer records using a fixed random seed**.

From this case-study directory:

```bash
python data/generate_mock_data.py
python python/retention_diagnostics.py
```

The generated dataset reproduces the expected schema and plausible relationships required to demonstrate the pipeline. It does **not** reconstruct the unseen original customer-level data and should not be treated as independent validation of the aggregate case-study statistics.

## ⚖️ Analytical Discipline & Limitations

This project deliberately separates **observation, inference, and causation**.

- `days_since_last_purchase` defines churn and therefore is not presented as a causal driver of churn.
- The observed segment rates are marginal statistics. Rates for age, signup channel, purchase frequency, and support tickets cannot simply be multiplied or combined into a defensible customer-level churn probability.
- Social Media expansion, logistics friction, and retention deterioration overlap in time, but temporal association alone does not establish causation.
- The SQL intervention monitor is rules-based; it is not represented as a machine-learning model, causal model, production deployment, or real-time system.
- Validation against customer-level joint distributions and post-intervention outcomes would be required before estimating independent effects or recovered business value.

The purpose of the case is to demonstrate the complete diagnostic workflow:

**Business symptom → data-quality controls → evidence → interpretation → operational intervention → measurable KPI.**
