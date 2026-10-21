"""
Script to:
1. Update/Clean rooms in database so ONLY the 28 target rooms exist.
2. Reassign any existing schedule referencing old non-target rooms to target rooms.
3. Delete all 40 non-target rooms.
4. Verify rooms count = 28.
"""

import sqlite3
import sys
from pathlib import Path

TARGET_ROOMS_SPEC = {
    # Lantai 2 (14 rooms)
    "C.II.01": {"name": "Lab. CBT 01", "room_type": "LABORATORY", "capacity": 40},
    "C.II.06": {"name": "Ruang Kuliah C.II.06", "room_type": "THEORY", "capacity": 20},
    "C.II.07": {"name": "Ruang Kuliah C.II.07", "room_type": "THEORY", "capacity": 40},
    "C.II.08": {"name": "Ruang Kuliah C.II.08", "room_type": "THEORY", "capacity": 30},
    "C.II.11": {"name": "Ruang Kuliah C.II.11", "room_type": "THEORY", "capacity": 55},
    "C.II.12": {"name": "Lab. CBT 02", "room_type": "LABORATORY", "capacity": 40},
    "D.II.01": {"name": "Ruang Kuliah D.II.01", "room_type": "THEORY", "capacity": 45},
    "D.II.02": {"name": "Ruang Kuliah D.II.02", "room_type": "THEORY", "capacity": 45},
    "D.II.03": {"name": "Ruang Kuliah D.II.03", "room_type": "THEORY", "capacity": 45},
    "D.II.04": {"name": "Ruang Kuliah D.II.04", "room_type": "THEORY", "capacity": 45},
    "D.II.05": {"name": "Ruang Kuliah D.II.05", "room_type": "THEORY", "capacity": 45},
    "D.II.06": {"name": "Ruang Kuliah D.II.06", "room_type": "THEORY", "capacity": 45},
    "D.II.07": {"name": "Ruang Kuliah D.II.07", "room_type": "THEORY", "capacity": 45},
    "D.II.09": {"name": "Ruang Kuliah D.II.09", "room_type": "THEORY", "capacity": 50},
    # Lantai 3 (13 rooms)
    "C.III.06": {"name": "Ruang Kuliah C.III.06", "room_type": "THEORY", "capacity": 30},
    "C.III.10": {"name": "Lab. Komputer 02", "room_type": "LABORATORY", "capacity": 30},
    "C.III.11": {"name": "Lab. Komputer 01", "room_type": "LABORATORY", "capacity": 50},
    "D.III.01": {"name": "Ruang Kuliah D.III.01", "room_type": "THEORY", "capacity": 45},
    "D.III.02": {"name": "Ruang Kuliah D.III.02", "room_type": "THEORY", "capacity": 45},
    "D.III.03": {"name": "Ruang Kuliah D.III.03", "room_type": "THEORY", "capacity": 45},
    "D.III.04": {"name": "Ruang Kuliah D.III.04", "room_type": "THEORY", "capacity": 45},
    "D.III.05": {"name": "Ruang Kuliah D.III.05", "room_type": "THEORY", "capacity": 45},
    "D.III.06": {"name": "Ruang Kuliah D.III.06", "room_type": "THEORY", "capacity": 45},
    "D.III.07": {"name": "Ruang Kuliah D.III.07", "room_type": "THEORY", "capacity": 45},
    "D.III.08": {"name": "Ruang Kuliah D.III.08", "room_type": "THEORY", "capacity": 55},
    "D.III.09": {"name": "Ruang Kuliah D.III.09", "room_type": "THEORY", "capacity": 50},
    "D.III.10": {"name": "Ruang Kuliah D.III.10", "room_type": "THEORY", "capacity": 50},
    # Lantai 4 (1 room)
    "D.IV.03": {"name": "Smart Room D.IV.03", "room_type": "THEORY", "capacity": 40},
}

def clean_and_sync_db():
    db_path = Path("backend/spk_ag.db")
    if not db_path.exists():
        db_path = Path("spk_ag.db")

    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()

    target_codes = list(TARGET_ROOMS_SPEC.keys())

    # 1. Update target rooms to ensure exact naming, capacity, and room_type
    for code, spec in TARGET_ROOMS_SPEC.items():
        c.execute("""
            UPDATE rooms 
            SET name = ?, room_type = ?, capacity = ?, is_active = 1
            WHERE code = ?
        """, (spec["name"], spec["room_type"], spec["capacity"], code))
    print(f"Updated metadata for all {len(target_codes)} target rooms.")

    # 2. Check any schedules pointing to non-target rooms
    c.execute(f"""
        SELECT s.id, s.time_slot_id, ac.class_name, r.code, c.course_type
        FROM schedules s
        JOIN rooms r ON s.room_id = r.id
        JOIN academic_classes ac ON s.class_id = ac.id
        JOIN courses c ON ac.course_id = c.id
        WHERE r.code NOT IN ({','.join(['?']*len(target_codes))})
    """, target_codes)
    bad_schedules = c.fetchall()

    if bad_schedules:
        print(f"Found {len(bad_schedules)} schedules using non-target rooms. Reassigning them...")
        # Get target room IDs
        c.execute(f"""
            SELECT id, code, room_type, capacity 
            FROM rooms 
            WHERE code IN ({','.join(['?']*len(target_codes))})
        """, target_codes)
        target_rooms = c.fetchall()

        for s_id, slot_id, class_name, old_code, c_type in bad_schedules:
            # Find rooms already used in this slot
            c.execute("SELECT room_id FROM schedules WHERE time_slot_id = ?", (slot_id,))
            used_ids = set(row[0] for row in c.fetchall())

            # Find a target room
            candidate = None
            # First try matching course type
            for r_id, r_code, r_type, r_cap in target_rooms:
                if r_id not in used_ids and r_type == c_type:
                    candidate = (r_id, r_code)
                    break
            # If not found, any free target room
            if not candidate:
                for r_id, r_code, r_type, r_cap in target_rooms:
                    if r_id not in used_ids:
                        candidate = (r_id, r_code)
                        break

            if candidate:
                c.execute("UPDATE schedules SET room_id = ? WHERE id = ?", (candidate[0], s_id))
                print(f"Reassigned {class_name} ({old_code}) -> {candidate[1]}")
            else:
                print(f"Warning: Could not reassign {class_name}")

    # 3. Delete non-target rooms
    c.execute(f"""
        DELETE FROM rooms 
        WHERE code NOT IN ({','.join(['?']*len(target_codes))})
    """, target_codes)
    deleted_count = c.rowcount
    print(f"Deleted {deleted_count} non-target rooms from database.")

    # 4. Verify final room count
    c.execute("SELECT COUNT(*) FROM rooms")
    total_rooms = c.fetchone()[0]
    print(f"Final total rooms in database: {total_rooms}")

    # 5. List rooms grouped by floor
    c.execute("SELECT code, name, room_type, capacity FROM rooms ORDER BY code")
    all_rooms = c.fetchall()
    print("\nVerified Remaining Database Rooms:")
    for r in all_rooms:
        print(f"  {r[0]:<10} | {r[1]:<25} | {r[2]:<12} | Kapasitas: {r[3]}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    clean_and_sync_db()
