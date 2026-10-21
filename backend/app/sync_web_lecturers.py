"""
Sync Web Lecturers Script
Mengambil dan menyinkronkan data dosen dari website resmi prodi S1 Ilmu Komputer UBBG:
URL: https://ilkom.bbg.ac.id/dosen/

Mendukung argumen:
  --clean-dummy : Hapus data dosen dummy lama yang tidak cocok dengan data web resmi,
                  dan alihkan relasi kelas/foreign keys secara aman ke dosen aktif.
  --url         : Kustomisasi URL sumber (default: https://ilkom.bbg.ac.id/dosen/)
"""

import sys
import os
import re
import uuid
import argparse
import unicodedata
from typing import List, Dict, Any, Set

# Konfigurasi stdout/stderr ke UTF-8 agar kompatibel dengan terminal Windows (PowerShell/CMD)
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Tambahkan direktori root backend ke sys.path jika dijalankan langsung
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models.master import Lecturer, AcademicClass, LecturerTimePreference


def ensure_schema(db):
    """
    Memastikan kolom jabatan, is_guest, dan nullable nidn tersedia di tabel basis data.
    Kompatibel untuk SQLite maupun PostgreSQL / AlloyDB.
    """
    dialect_name = engine.dialect.name
    
    if dialect_name == "sqlite":
        # Jalankan migrasi mandiri SQLite
        with engine.connect() as conn:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(lecturers)")
            cols_info = {r[1]: r for r in cursor.fetchall()}
            
            # Jika nidn masih NOT NULL, migrasikan tabel agar nullable
            if cols_info.get("nidn") and cols_info["nidn"][3] == 1:
                cursor.execute("PRAGMA foreign_keys=OFF;")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS lecturers_migrated (
                        id CHAR(36) PRIMARY KEY,
                        nidn VARCHAR(30) UNIQUE,
                        name VARCHAR(150) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        jabatan VARCHAR(150),
                        is_guest BOOLEAN DEFAULT 0,
                        created_at DATETIME
                    );
                """)
                cursor.execute("""
                    INSERT INTO lecturers_migrated (id, nidn, name, email, created_at)
                    SELECT id, nidn, name, email, created_at FROM lecturers;
                """)
                cursor.execute("DROP TABLE lecturers;")
                cursor.execute("ALTER TABLE lecturers_migrated RENAME TO lecturers;")
                cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_lecturers_nidn ON lecturers (nidn);")
                cursor.execute("PRAGMA foreign_keys=ON;")
                conn.connection.commit()
            else:
                # Tambahkan kolom baru jika belum ada
                if "jabatan" not in cols_info:
                    cursor.execute("ALTER TABLE lecturers ADD COLUMN jabatan VARCHAR(150);")
                if "is_guest" not in cols_info:
                    cursor.execute("ALTER TABLE lecturers ADD COLUMN is_guest BOOLEAN DEFAULT 0;")
                conn.connection.commit()

    elif dialect_name == "postgresql":
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE lecturers ALTER COLUMN nidn DROP NOT NULL;"))
            conn.execute(text("ALTER TABLE lecturers ADD COLUMN IF NOT EXISTS jabatan VARCHAR(150);"))
            conn.execute(text("ALTER TABLE lecturers ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;"))
            conn.commit()


def normalize_name(name: str) -> str:
    """Normalisasi nama dosen untuk pencocokan yang akurat tanpa terganggu spasi atau gelar."""
    if not name:
        return ""
    clean = unicodedata.normalize("NFKD", name).replace("\xa0", " ")
    # Hapus gelar kehormatan di depan
    clean = re.sub(r'^(prof\.|dr\.|ir\.|dra\.)\s*', '', clean, flags=re.IGNORECASE)
    # Ambil bagian sebelum koma (nama pokok)
    clean = clean.split(',')[0].strip()
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', clean).lower()
    return ' '.join(clean.split())


def scrape_lecturers_from_web(url: str = "https://ilkom.bbg.ac.id/dosen/") -> List[Dict[str, Any]]:
    """Mengikis data dosen dari tabel di halaman web prodi S1 Ilmu Komputer."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    
    html_content = ""
    try:
        response = httpx.get(url, headers=headers, timeout=25.0, follow_redirects=True)
        response.raise_for_status()
        html_content = response.text
    except Exception as e:
        print(f"[WARN] httpx gagal mengunduh ({e}), mencoba fallback via urllib...")
        import urllib.request
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=25) as resp:
            html_content = resp.read().decode("utf-8", errors="ignore")

    soup = BeautifulSoup(html_content, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError(f"Tidak dapat menemukan elemen <table> pada URL: {url}")

    lecturers = []
    rows = table.find_all("tr")

    for row in rows:
        cols = [c.get_text("\n", strip=True) for c in row.find_all(["td", "th"])]
        if len(cols) < 4:
            continue

        col_name, col_jabatan, col_nidn = cols[1], cols[2], cols[3]

        # Lewati baris header tabel
        if "nama dosen" in col_name.lower():
            continue

        # 1. Parsing Nama Lengkap
        raw_name_lines = [line.strip() for line in col_name.split("\n") if line.strip()]
        if not raw_name_lines:
            continue
        full_name = raw_name_lines[0].replace("\xa0", " ").strip()

        # 2. Parsing NIDN
        nidn_match = re.search(r'NIDN\s*:\s*([0-9]+)', col_nidn)
        nidn = nidn_match.group(1).strip() if nidn_match else None

        # 3. Deteksi Dosen Tamu & Jabatan
        combined_text = f"{col_name} {col_jabatan}".lower()
        is_guest = "dosen tamu" in combined_text or "tamu" in col_jabatan.lower()

        # Bersihkan teks (Dosen Tamu) dari string jabatan
        jabatan = re.sub(r'\(?\s*dosen\s+tamu\s*\)?', '', col_jabatan, flags=re.IGNORECASE).strip()
        jabatan = ' '.join(jabatan.split())
        if not jabatan or jabatan == "-":
            jabatan = "Dosen Tamu" if is_guest else "Dosen Prodi S1 ILKOM"

        lecturers.append({
            "name": full_name,
            "nidn": nidn,
            "jabatan": jabatan,
            "is_guest": is_guest,
        })

    return lecturers


def generate_email_for_lecturer(name: str, existing_emails: Set[str]) -> str:
    """Menghasilkan email institusi unik berbasis nama dosen."""
    clean = unicodedata.normalize("NFKD", name).replace("\xa0", " ")
    clean = re.sub(r'^(prof\.|dr\.|ir\.|dra\.)\s*', '', clean, flags=re.IGNORECASE)
    clean = clean.split(',')[0].strip()
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', clean).lower()
    parts = clean.split()

    if len(parts) >= 2:
        base_username = f"{parts[0]}.{parts[-1]}"
    elif len(parts) == 1:
        base_username = parts[0]
    else:
        base_username = "dosen"

    domain = "bbg.ac.id"
    candidate = f"{base_username}@{domain}"
    counter = 1
    while candidate in existing_emails:
        candidate = f"{base_username}{counter}@{domain}"
        counter += 1

    existing_emails.add(candidate)
    return candidate


def sync_lecturers(clean_dummy: bool = False, url: str = "https://ilkom.bbg.ac.id/dosen/"):
    """
    Proses utama sinkronisasi dosen:
    1. Pastikan skema basis data siap
    2. Unduh & ekstrak data dosen dari website
    3. Jalankan logika Upsert (insert dosen baru, update dosen yang sudah ada)
    4. Jika --clean-dummy aktif: hapus dosen dummy & amankan relasi foreign key kelas
    """
    db = SessionLocal()
    try:
        print(f"[INFO] Memeriksa & memigrasikan skema tabel lecturers...")
        ensure_schema(db)

        print(f"[INFO] Mengambil data dosen dari: {url} ...")
        scraped_list = scrape_lecturers_from_web(url)
        print(f"[OK] Berhasil mengekstrak {len(scraped_list)} data dosen dari web prodi.")

        existing_lecturers = db.query(Lecturer).all()
        existing_emails = {l.email.lower() for l in existing_lecturers if l.email}

        existing_by_nidn = {l.nidn: l for l in existing_lecturers if l.nidn}
        existing_by_norm_name = {normalize_name(l.name): l for l in existing_lecturers}

        new_count = 0
        updated_count = 0
        cleaned_count = 0

        synced_lecturer_ids = set()
        synced_lecturers = []

        # 1. Jalankan proses Upsert untuk data hasil scraping
        for data in scraped_list:
            matched_lec = None
            if data["nidn"] and data["nidn"] in existing_by_nidn:
                matched_lec = existing_by_nidn[data["nidn"]]
            else:
                norm = normalize_name(data["name"])
                if norm in existing_by_norm_name:
                    matched_lec = existing_by_norm_name[norm]

            if matched_lec:
                # Update data yang sudah ada
                matched_lec.name = data["name"]
                if data["nidn"]:
                    matched_lec.nidn = data["nidn"]
                matched_lec.jabatan = data["jabatan"]
                matched_lec.is_guest = data["is_guest"]
                synced_lecturer_ids.add(matched_lec.id)
                synced_lecturers.append(matched_lec)
                updated_count += 1
            else:
                # Insert data dosen baru
                new_email = generate_email_for_lecturer(data["name"], existing_emails)
                new_lec = Lecturer(
                    id=uuid.uuid4(),
                    nidn=data["nidn"],
                    name=data["name"],
                    email=new_email,
                    jabatan=data["jabatan"],
                    is_guest=data["is_guest"]
                )
                db.add(new_lec)
                db.flush()
                synced_lecturer_ids.add(new_lec.id)
                synced_lecturers.append(new_lec)
                existing_by_norm_name[normalize_name(new_lec.name)] = new_lec
                if new_lec.nidn:
                    existing_by_nidn[new_lec.nidn] = new_lec
                new_count += 1

        # 2. Tangani opsi pembersihan dosen dummy jika flag --clean-dummy aktif
        if clean_dummy:
            dummy_lecturers = [l for l in existing_lecturers if l.id not in synced_lecturer_ids]

            if dummy_lecturers:
                print(f"[INFO] Menemukan {len(dummy_lecturers)} dosen dummy lama yang akan dibersihkan...")

                # Pilih dosen tetap hasil sinkronisasi sebagai target pengalihan kelas
                active_target_lecturers = [l for l in synced_lecturers if not l.is_guest]
                if not active_target_lecturers:
                    active_target_lecturers = synced_lecturers

                target_ids = [str(l.id) for l in active_target_lecturers]

                for idx, dummy in enumerate(dummy_lecturers):
                    dummy_id_str = str(dummy.id)
                    reassigned_id_str = target_ids[idx % len(target_ids)]

                    # Amankan foreign key: Alihkan kelas yang terikat ke dosen aktif baru via SQL
                    db.execute(
                        text("UPDATE academic_classes SET lecturer_id = :new_id WHERE lecturer_id = :old_id"),
                        {"new_id": reassigned_id_str, "old_id": dummy_id_str}
                    )

                    # Hapus data preferensi waktu dosen dummy
                    db.execute(
                        text("DELETE FROM lecturer_time_preferences WHERE lecturer_id = :old_id"),
                        {"old_id": dummy_id_str}
                    )

                    # Hapus entitas dosen dummy dari basis data
                    db.execute(
                        text("DELETE FROM lecturers WHERE id = :old_id"),
                        {"old_id": dummy_id_str}
                    )
                    cleaned_count += 1

                # Expire session cache agar sinkron dengan database
                db.expire_all()

        db.commit()

        # Statistik akhir
        total_active = db.query(Lecturer).count()
        total_guest = db.query(Lecturer).filter(Lecturer.is_guest == True).count()
        total_permanent = total_active - total_guest

        print("\n" + "=" * 70)
        print("🎓 HASIL SINKRONISASI DATA DOSEN PRODI S1 ILMU KOMPUTER UBBG")
        print("=" * 70)
        print(f"🌐 Sumber Web              : {url}")
        print(f"📊 Total Dosen di Web      : {len(scraped_list)} orang")
        print(f"✨ Dosen Baru Ditambahkan  : {new_count}")
        print(f"🔄 Dosen Diperbarui        : {updated_count}")
        if clean_dummy:
            print(f"🧹 Dosen Dummy Dibersihkan : {cleaned_count} (Mode: --clean-dummy AKTIF)")
        else:
            print(f"ℹ️  Pembersihan Dummy       : Dilewati (Gunakan --clean-dummy untuk menghapus)")
        print("-" * 70)
        print(f"👥 Total Dosen di Database : {total_active} orang")
        print(f"   ├─ Dosen Tetap Prodi    : {total_permanent} orang")
        print(f"   └─ Dosen Tamu           : {total_guest} orang")
        print("=" * 70 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Proses sinkronisasi gagal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Sinkronisasi Data Dosen dari Website Prodi S1 Ilmu Komputer UBBG ke Database SPK-AG"
    )
    parser.add_argument(
        "--clean-dummy",
        action="store_true",
        help="Hapus data dosen lama yang tidak cocok dengan data scraping dan alihkan relasi kelas secara aman"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="https://ilkom.bbg.ac.id/dosen/",
        help="URL halaman website dosen prodi (default: https://ilkom.bbg.ac.id/dosen/)"
    )

    args = parser.parse_args()
    sync_lecturers(clean_dummy=args.clean_dummy, url=args.url)


if __name__ == "__main__":
    main()
