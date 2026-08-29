import pandas as pd
import numpy as np


REQUIRED_COLUMNS = {
    'customer_id',
    'age',
    'signup_channel',
    'total_orders',
    'total_spent',
    'customer_support_tickets',
    'days_since_last_purchase',
    'churn_status',
}


def validate_schema(df):
    """Validate the minimum dataset contract required by the diagnostic pipeline."""
    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise ValueError(
            f"Dataset missing required columns: {sorted(missing_columns)}"
        )


def format_churn_summary(frame, group_column, volume_label):
    """Return customer volume and observed churn rate for a defined business segment."""
    summary = (
        frame.groupby(group_column, observed=True, dropna=False)['churn_status']
        .agg(['count', 'mean'])
        .rename(columns={'count': volume_label, 'mean': 'Observed Churn Rate'})
    )
    summary['Observed Churn Rate'] = (
        summary['Observed Churn Rate'] * 100
    ).round(1).astype(str) + '%'
    return summary


def run_retention_diagnostics(file_path):
    print("====================================================================")
    print("RUNNING RETENTION & CHURN DIAGNOSTIC ENGINE")
    print("====================================================================\n")

    # 1. Ingest and validate raw dataset.
    df = pd.read_csv(file_path)
    validate_schema(df)

    # 2. Separate structural wholesale outliers from consumer-retail analysis.
    wholesale_mask = df['total_spent'].gt(15000).fillna(False)
    df_wholesale = df.loc[wholesale_mask].copy()
    df_retail = df.loc[~wholesale_mask].copy()

    print(f"Dataset loaded: {len(df)} total accounts identified.")
    print(
        f"Isolated {len(df_wholesale)} wholesale profiles "
        "from core retail-consumer metrics.\n"
    )

    # 3. Clean categorical acquisition gaps while retaining missing-spend records.
    df_retail['signup_channel'] = df_retail['signup_channel'].fillna('Unknown')

    # 4. Reproduce the business-defined order lifecycle bands used in the case study.
    df_retail['order_band'] = pd.cut(
        df_retail['total_orders'],
        bins=[0, 1, 3, 5, np.inf],
        labels=['1 order', '2-3 orders', '4-5 orders', '6+ orders'],
        include_lowest=True,
    )

    print("--- DIAGNOSTIC POINT #1: CHURN BY ORDER LIFECYCLE ---")
    print(format_churn_summary(df_retail, 'order_band', 'Customer Volume'))
    print()

    # 5. Reproduce the support-friction bands used in the diagnostic evidence.
    df_retail['ticket_band'] = np.select(
        [
            df_retail['customer_support_tickets'].eq(0),
            df_retail['customer_support_tickets'].eq(1),
            df_retail['customer_support_tickets'].eq(2),
            df_retail['customer_support_tickets'].ge(3),
        ],
        ['0 tickets', '1 ticket', '2 tickets', '3+ tickets'],
        default='Unknown',
    )

    ticket_order = ['0 tickets', '1 ticket', '2 tickets', '3+ tickets', 'Unknown']
    df_retail['ticket_band'] = pd.Categorical(
        df_retail['ticket_band'], categories=ticket_order, ordered=True
    )

    print("--- DIAGNOSTIC POINT #2: REPEATED SERVICE-FRICTION CURVE ---")
    print(format_churn_summary(df_retail, 'ticket_band', 'Customer Volume'))
    print()

    # 6. Evaluate acquisition-channel retention quality.
    print("--- DIAGNOSTIC POINT #3: ACQUISITION CHANNEL RETENTION PROFILE ---")
    print(format_churn_summary(df_retail, 'signup_channel', 'Acquisition Volume'))
    print()

    # 7. Compare observed lifetime spend without mislabeling it as modeled CLV.
    median_active = df_retail.loc[
        df_retail['churn_status'].eq(0), 'total_spent'
    ].median()
    median_churned = df_retail.loc[
        df_retail['churn_status'].eq(1), 'total_spent'
    ].median()

    print("--- OBSERVED FINANCIAL FOOTPRINT ---")
    print(f"Active consumer median lifetime spend: ${median_active:.2f}")
    print(f"Churned consumer median lifetime spend: ${median_churned:.2f}")
    print("====================================================================")


if __name__ == "__main__":
    run_retention_diagnostics('generated/trendvibe_customer_data.csv')
