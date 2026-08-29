-- ====================================================================
-- PROJECT: TRENDVIBE APPAREL RETENTION ALERT MONITORING PIPELINE
-- OBJECTIVE: ISOLATE WHOLESALE NOISE AND FLAG ACTIVE HIGH-RISK RETAIL COHORTS
-- AUTHOR: STRATEGIC DATA ANALYST PORTFOLIO
-- ====================================================================

-- DEVELOPMENT REVISION LOG
-- v1.0: Initial retention-monitoring query with wholesale filtering
--       and high-risk cohort identification.
--
-- v1.1: Fixed intermediate CTE projection issue causing churn_status
--       to be unavailable in the final filter.
--       Added NULL handling for total_spent.
--       Added explicit fallback handling for invalid or missing age values.

WITH retail_base_cleansed AS (
    SELECT 
        customer_id,
        age,
        COALESCE(signup_channel, 'Unknown') AS signup_channel_cleansed,
        total_orders,
        total_spent,
        customer_support_tickets,
        days_since_last_purchase,
        churn_status
    FROM trendvibe_customer_data
    WHERE total_spent <= 15000.00
       OR total_spent IS NULL
),

customer_risk_profile AS (
    SELECT 
        customer_id,
        age,
        signup_channel_cleansed,
        total_orders,
        total_spent,
        customer_support_tickets,
        days_since_last_purchase,
        churn_status,

        CASE 
            WHEN age BETWEEN 18 AND 24 THEN '18-24'
            WHEN age BETWEEN 25 AND 34 THEN '25-34'
            WHEN age BETWEEN 35 AND 44 THEN '35-44'
            WHEN age BETWEEN 45 AND 65 THEN '45-65'
            ELSE 'Unknown / Invalid'
        END AS age_cohort,

        CASE 
            WHEN total_orders = 1 THEN 1 
            ELSE 0 
        END AS is_one_and_done_risk

    FROM retail_base_cleansed
)

SELECT 
    customer_id,
    age_cohort,
    signup_channel_cleansed,
    total_orders,
    total_spent,
    customer_support_tickets,
    days_since_last_purchase,

    CASE 
        WHEN customer_support_tickets >= 3
            THEN 'MAXIMUM RISK: Immediate Service Escalation (82% Observed Churn Rate)'
        WHEN customer_support_tickets = 2
            THEN 'CRITICAL ALERT: Service Recovery Trigger (45% Observed Churn Rate)'
        ELSE 'Monitor Standard Lifecycle'
    END AS service_recovery_action,

    CASE 
        WHEN age BETWEEN 18 AND 24
             AND signup_channel_cleansed = 'Social Media'
             AND total_orders = 1
            THEN 'PRIORITY TARGET: Multiple Observed Risk Indicators'
        ELSE 'Standard Track'
    END AS risk_target_segment

FROM customer_risk_profile

WHERE churn_status = 0
  AND (
        customer_support_tickets >= 2
        OR (
            age BETWEEN 18 AND 24
            AND signup_channel_cleansed = 'Social Media'
            AND total_orders = 1
        )
      )

ORDER BY customer_support_tickets DESC, total_spent DESC;
