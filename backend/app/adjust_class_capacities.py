"""
Adjust class student counts to fit within the 28 campus room capacities:
- LAB max capacity: 50 (C.III.11), 40 (C.II.01, C.II.12), 30 (C.III.10)
- THEORY max capacity: 55 (C.II.11, D.III.08), 50 (D.II.09, D.III.09, D.III.10)
"""

import sqlite3
import sys
import os
from pathlib import Path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.database import SessionLocal
from app.api.conflicts import run_feasibility_check

def adjust_capacities():
    db_path = Path("backend/spk_ag.db")
    if not db_path.exists():
        db_path = Path("spk_ag.db")

    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()

    # Cap lab classes at max 40 so they fit in C.II.01, C.II.12, or C.III.11
    c.execute("""
        UPDATE academic_classes
        SET student_count = 40
        WHERE id IN (
            SELECT ac.id
            FROM academic_classes ac
            JOIN courses crs ON ac.course_id = crs.id
            WHERE crs.course_type = 'LABORATORY' AND ac.student_count > 50
        )
    """)
    lab_updated = c.rowcount

    # Cap theory classes at max 50 so they fit in C.II.11, D.III.08, D.II.09, D.III.09, D.III.10
    c.execute("""
        UPDATE academic_classes
        SET student_count = 50
        WHERE id IN (
            SELECT ac.id
            FROM academic_classes ac
            JOIN courses crs ON ac.course_id = crs.id
            WHERE crs.course_type = 'THEORY' AND ac.student_count > 55
        )
    """)
    theory_updated = c.rowcount

    conn.commit()
    conn.close()

    print(f"Updated {lab_updated} laboratory classes and {theory_updated} theory classes.")

    # Now verify with feasibility check
    db = SessionLocal()
    check = run_feasibility_check(db)
    db.close()

    print(f"Feasibility check result: is_feasible = {check['is_feasible']}")
    print(f"Capacity issues ({len(check['capacity_issues'])}): {check['capacity_issues']}")
    print(f"Lecturer workload issues ({len(check['lecturer_workload_issues'])}): {check['lecturer_workload_issues']}")

    return check['is_feasible']

if __name__ == "__main__":
    adjust_capacities()
