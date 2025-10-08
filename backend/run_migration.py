#!/usr/bin/env python3
"""
Database migration script to add new columns to signals table.
Run this script to update your database schema.

Usage:
    python run_migration.py
"""
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import engine
from app.core.config import settings


def run_migration():
    """Run the database migration."""
    print("=" * 60)
    print("SignalStack Database Migration")
    print("=" * 60)
    print(f"\nDatabase: {settings.database_url.split('@')[-1]}")
    print("\nThis will add new columns to the signals table:")
    print("  - quality_score")
    print("  - volume_score")
    print("  - technical_indicators")
    print("  - rationale")
    print("  - regime")
    print("  - market_conditions")
    print("  - latency_ms")
    print("  - bt_winrate")
    print("  - bt_pf")
    print("  - risk_pct")
    print("\nAnd create performance indexes.")

    response = input("\nProceed with migration? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Migration cancelled.")
        return

    print("\nRunning migration...")

    # Read SQL file
    sql_file = Path(__file__).parent / "migrations" / "001_add_signal_columns.sql"
    if not sql_file.exists():
        print(f"Error: Migration file not found at {sql_file}")
        sys.exit(1)

    with open(sql_file, 'r') as f:
        sql_script = f.read()

    # Execute migration
    try:
        with engine.connect() as conn:
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in sql_script.split(';') if s.strip()]

            for statement in statements:
                if statement and not statement.startswith('--'):
                    print(f"\nExecuting: {statement[:100]}...")
                    result = conn.execute(text(statement))
                    conn.commit()

                    # Print results for SELECT statements
                    if statement.strip().upper().startswith('SELECT'):
                        rows = result.fetchall()
                        for row in rows:
                            print(f"  {row}")

        print("\n" + "=" * 60)
        print("Migration completed successfully! ✅")
        print("=" * 60)
        print("\nYou can now restart your application.")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("\nPlease check your database connection and try again.")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
