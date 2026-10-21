import json
from app.database import SessionLocal
from app.models.master import Course

with open(r'C:\Users\WorkPlus\.gemini\antigravity-ide\brain\b323c373-b485-41f0-8a69-72db9ffe0df1\.system_generated\steps\1939\output.txt', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('[')
end = text.rfind(']') + 1
courses = json.loads(text[start:end])

db = SessionLocal()
existing_codes = {c.code for c in db.query(Course).all()}

new_courses = [c for c in courses if c['code'] not in existing_codes]

def infer_kbk_and_type(code, name, semester, jenis, is_elective):
    nl = name.lower()
    kbk = 'GENERAL'
    ctype = 'THEORY'

    if any(k in nl for k in ['pemrograman', 'basis data', 'laboratorium', 'animasi', 'audio', 'desain grafis', 'videografi', 'fotografi', 'ilustrasi', 'citra', 'mobile', 'sensor', 'embedded', 'robotik', 'spasial', 'geografis', 'jaringan']):
        ctype = 'LABORATORY'
    
    if semester <= 2:
        if 'pemrograman web' in nl:
            kbk = 'PEMROGRAMAN'
            ctype = 'LABORATORY'
        else:
            kbk = 'GENERAL'
    else:
        if any(k in nl for k in ['grafis', 'game', 'audio', 'augmented', 'konten', 'animasi', 'grafika', 'videografi', 'fotografi', 'multimedia', 'ilustrasi', 'storyboard', 'video art', 'media sosial', 'digital marketing']):
            kbk = 'MULTIMEDIA'
        elif any(k in nl for k in ['iot', 'sensor', 'embedded', 'jaringan', 'fog', 'komunikasi data', 'spasial', 'geografis', 'wireless', 'kluster']):
            kbk = 'IOT'
        elif any(k in nl for k in ['algoritma', 'basis data', 'rekayasa perangkat', 'ai', 'kecerdasan', 'pola', 'komputasional', 'saraf', 'data mining', 'machine learning', 'deep learning', 'pemrograman', 'perangkat lunak', 'requirement', 'paralel']):
            kbk = 'PEMROGRAMAN'
        else:
            kbk = 'GENERAL'

    return kbk, ctype

print(f"=== 32 NEW COURSES TO BE ADDED ===")
for c in new_courses:
    kbk, ctype = infer_kbk_and_type(c['code'], c['name'], c['semester'], c['jenis_mk'], c['is_elective'])
    print(f"Sem {c['semester']}: [{c['code']}] {c['name']} | SKS: {c['sks']} | KBK: {kbk} | Type: {ctype} | Jenis: {c['jenis_mk']} | Prasyarat: {c['prasyarat']}")
