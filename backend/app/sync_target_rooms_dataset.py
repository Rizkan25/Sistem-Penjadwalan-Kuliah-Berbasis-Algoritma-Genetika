"""
Script to scrape ruang.bbg.ac.id strictly for the 28 target rooms whitelist,
and generate clean datasets for SPK-AG.
"""

import re
import json
from pathlib import Path
import httpx
from bs4 import BeautifulSoup

TARGET_ROOMS_SPEC = {
    # Lantai 2 (14 rooms)
    "C.II.01": {"name": "Lab. CBT 01", "type": "LABORATORY", "capacity": 40, "floor": 2},
    "C.II.06": {"name": "Ruang Kuliah C.II.06", "type": "THEORY", "capacity": 20, "floor": 2},
    "C.II.07": {"name": "Ruang Kuliah C.II.07", "type": "THEORY", "capacity": 40, "floor": 2},
    "C.II.08": {"name": "Ruang Kuliah C.II.08", "type": "THEORY", "capacity": 30, "floor": 2},
    "C.II.11": {"name": "Ruang Kuliah C.II.11", "type": "THEORY", "capacity": 55, "floor": 2},
    "C.II.12": {"name": "Lab. CBT 02", "type": "LABORATORY", "capacity": 40, "floor": 2},
    "D.II.01": {"name": "Ruang Kuliah D.II.01", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.02": {"name": "Ruang Kuliah D.II.02", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.03": {"name": "Ruang Kuliah D.II.03", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.04": {"name": "Ruang Kuliah D.II.04", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.05": {"name": "Ruang Kuliah D.II.05", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.06": {"name": "Ruang Kuliah D.II.06", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.07": {"name": "Ruang Kuliah D.II.07", "type": "THEORY", "capacity": 45, "floor": 2},
    "D.II.09": {"name": "Ruang Kuliah D.II.09", "type": "THEORY", "capacity": 50, "floor": 2},
    # Lantai 3 (13 rooms)
    "C.III.06": {"name": "Ruang Kuliah C.III.06", "type": "THEORY", "capacity": 30, "floor": 3},
    "C.III.10": {"name": "Lab. Komputer 02", "type": "LABORATORY", "capacity": 30, "floor": 3},
    "C.III.11": {"name": "Lab. Komputer 01", "type": "LABORATORY", "capacity": 50, "floor": 3},
    "D.III.01": {"name": "Ruang Kuliah D.III.01", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.02": {"name": "Ruang Kuliah D.III.02", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.03": {"name": "Ruang Kuliah D.III.03", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.04": {"name": "Ruang Kuliah D.III.04", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.05": {"name": "Ruang Kuliah D.III.05", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.06": {"name": "Ruang Kuliah D.III.06", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.07": {"name": "Ruang Kuliah D.III.07", "type": "THEORY", "capacity": 45, "floor": 3},
    "D.III.08": {"name": "Ruang Kuliah D.III.08", "type": "THEORY", "capacity": 55, "floor": 3},
    "D.III.09": {"name": "Ruang Kuliah D.III.09", "type": "THEORY", "capacity": 50, "floor": 3},
    "D.III.10": {"name": "Ruang Kuliah D.III.10", "type": "THEORY", "capacity": 50, "floor": 3},
    # Lantai 4 (1 room)
    "D.IV.03": {"name": "Smart Room D.IV.03", "type": "THEORY", "capacity": 40, "floor": 4},
}

DAY_MAP = {
    1: "Senin",
    2: "Selasa",
    3: "Rabu",
    4: "Kamis",
    5: "Jumat",
    6: "Sabtu",
}

def scrape_target_rooms_and_schedules():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    all_target_bookings = []
    ilkom_classes = {}
    found_rooms_on_web = set()

    for day_num in range(1, 7):
        url = f"https://ruang.bbg.ac.id/day/{day_num}/20261"
        print(f"Scraping {DAY_MAP[day_num]} ({url})...")
        try:
            r = httpx.get(url, headers=headers, verify=False, timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            tables = soup.find_all("table")
            if len(tables) < 2:
                print(f"Warning: Day {day_num} table not found.")
                continue

            table1 = tables[1]
            rows = table1.find_all("tr")

            current_target_room = None
            for row in rows:
                tds = row.find_all(["td", "th"])
                # Header row for a room
                if len(tds) == 1 and tds[0].has_attr("colspan"):
                    header_text = tds[0].get_text(strip=True)
                    current_target_room = None
                    for code in TARGET_ROOMS_SPEC:
                        if code in header_text:
                            current_target_room = code
                            found_rooms_on_web.add(code)
                            break
                elif current_target_room and len(tds) >= 8:
                    hari = tds[0].get_text(strip=True) or DAY_MAP[day_num]
                    jam = tds[1].get_text(strip=True)
                    spada = tds[2].get_text(strip=True)
                    mk = tds[3].get_text(strip=True)
                    prodi = tds[4].get_text(strip=True)
                    dosen = tds[5].get_text(strip=True)
                    estimasi = tds[6].get_text(strip=True)
                    dibooking = tds[7].get_text(strip=True)

                    if mk:
                        m = re.search(r"\d+", dibooking)
                        student_count = int(m.group()) if m else 0

                        booking_entry = {
                            "dayNum": day_num,
                            "dayName": hari,
                            "period": jam,
                            "roomCode": current_target_room,
                            "roomName": TARGET_ROOMS_SPEC[current_target_room]["name"],
                            "roomType": TARGET_ROOMS_SPEC[current_target_room]["type"],
                            "roomCapacity": TARGET_ROOMS_SPEC[current_target_room]["capacity"],
                            "floor": TARGET_ROOMS_SPEC[current_target_room]["floor"],
                            "spadaCode": spada,
                            "courseName": mk,
                            "prodi": prodi,
                            "lecturer": dosen,
                            "studentCount": student_count,
                            "bookingStatus": dibooking,
                        }
                        all_target_bookings.append(booking_entry)

                        # If ILKOM, also aggregate into class meeting block
                        if "ILKOM" in prodi:
                            key = (day_num, current_target_room, spada, mk, dosen)
                            if key not in ilkom_classes:
                                # Extract cohort and clean course name
                                cohort = "A"
                                if "Rombel" in mk:
                                    m_coh = re.search(r"Rombel\s*([A-Za-z0-9]+)", mk, re.IGNORECASE)
                                    if m_coh:
                                        cohort = m_coh.group(1).upper()
                                clean_name = re.sub(r"\s*-\s*Rombel.*$", "", mk)
                                clean_name = re.sub(r"\(\*\)", "", clean_name).strip()

                                # Parse lecturer names
                                lec_list = [l.strip() for l in dosen.split("/") if l.strip()]

                                ilkom_classes[key] = {
                                    "spadaCode": spada,
                                    "rawCourseName": mk,
                                    "cleanCourseName": clean_name,
                                    "cohort": cohort,
                                    "prodi": prodi,
                                    "lecturerRaw": dosen,
                                    "lecturers": lec_list,
                                    "studentCount": student_count or 35,
                                    "dayNum": day_num,
                                    "dayName": hari,
                                    "roomCode": current_target_room,
                                    "roomName": TARGET_ROOMS_SPEC[current_target_room]["name"],
                                    "roomType": TARGET_ROOMS_SPEC[current_target_room]["type"],
                                    "periods": [],
                                    "sks": 0,
                                }
                            ilkom_classes[key]["periods"].append(jam)
                            ilkom_classes[key]["sks"] = len(ilkom_classes[key]["periods"])
                            if student_count > ilkom_classes[key]["studentCount"]:
                                ilkom_classes[key]["studentCount"] = student_count

        except Exception as e:
            print(f"Error scraping day {day_num}: {e}")

    # Format rooms output (strictly the 28 rooms)
    rooms_output = []
    for code, spec in TARGET_ROOMS_SPEC.items():
        rooms_output.append({
            "code": code,
            "name": spec["name"],
            "capacity": spec["capacity"],
            "room_type": spec["type"],
            "floor": spec["floor"],
            "is_active": True,
            "present_on_web": code in found_rooms_on_web
        })

    # Prepare datasets to save
    output_dir = Path("backend/app/data")
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Update ruang_bbg_scraped.json
    ilkom_classes_list = list(ilkom_classes.values())
    scraped_payload = {
        "metadata": {
            "source": "https://ruang.bbg.ac.id/",
            "academic_year": "2026/2027",
            "semester_type": "ODD",
            "total_target_rooms": len(rooms_output),
            "total_ilkom_classes": len(ilkom_classes_list),
            "total_target_bookings": len(all_target_bookings),
            "filter_applied": "Strict 28 Target Rooms Whitelist (Lantai 2, 3, 4)"
        },
        "rooms": rooms_output,
        "classes": ilkom_classes_list,
    }

    scraped_json_path = output_dir / "ruang_bbg_scraped.json"
    with open(scraped_json_path, "w", encoding="utf-8") as f:
        json.dump(scraped_payload, f, indent=2, ensure_ascii=False)
    print(f"Saved {scraped_json_path} ({len(rooms_output)} rooms, {len(ilkom_classes_list)} ILKOM classes)")

    # 2. Save full schedule booking dataset for all target rooms
    full_schedule_payload = {
        "metadata": {
            "source": "https://ruang.bbg.ac.id/",
            "total_bookings": len(all_target_bookings),
            "target_rooms_count": len(rooms_output),
        },
        "target_rooms": rooms_output,
        "bookings": all_target_bookings,
    }
    full_schedule_path = output_dir / "ruang_bbg_target_rooms_schedule.json"
    with open(full_schedule_path, "w", encoding="utf-8") as f:
        json.dump(full_schedule_payload, f, indent=2, ensure_ascii=False)
    print(f"Saved {full_schedule_path} ({len(all_target_bookings)} total bookings)")

    return rooms_output, ilkom_classes_list, all_target_bookings

if __name__ == "__main__":
    scrape_target_rooms_and_schedules()
