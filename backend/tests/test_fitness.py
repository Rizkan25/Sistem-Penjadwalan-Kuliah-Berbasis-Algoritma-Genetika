import uuid
from app.ga.chromosome import Chromosome, Gene, ProblemContext, ClassInfo, RoomInfo, TimeSlotInfo
from app.ga.fitness import evaluate_fitness

def create_mock_context(classes, rooms, slots, preferences=None):
    return ProblemContext(
        classes=classes,
        rooms=rooms,
        time_slots=slots,
        preferences=preferences or {}
    )

def test_hc1_lecturer_clash():
    """
    Test: Dua kelas dengan dosen dan slot waktu yang sama -> HC1 = 1
    """
    lec1_id = uuid.uuid4()
    c1_id = uuid.uuid4()
    c2_id = uuid.uuid4()
    r1_id = uuid.uuid4()
    r2_id = uuid.uuid4()
    slot1_id = uuid.uuid4()

    c1 = ClassInfo(
        class_id=c1_id, class_name="IK-1A (Pemrograman 1)", course_id=uuid.uuid4(),
        course_code="IK101", course_name="Pemrograman 1", credits=3,
        semester=1, cohort="A", kbk="GENERAL", student_count=30, course_type="THEORY",
        lecturer_id=lec1_id, lecturer_name="Dosen A", lecturer_nidn="111"
    )
    c2 = ClassInfo(
        class_id=c2_id, class_name="IK-1B (Aljabar Linier)", course_id=uuid.uuid4(),
        course_code="IK102", course_name="Aljabar Linier", credits=3,
        semester=1, cohort="B", kbk="GENERAL", student_count=30, course_type="THEORY",
        lecturer_id=lec1_id, lecturer_name="Dosen A", lecturer_nidn="111"
    )

    r1 = RoomInfo(room_id=r1_id, code="R101", name="Ruang 101", capacity=40, room_type="THEORY")
    r2 = RoomInfo(room_id=r2_id, code="R102", name="Ruang 102", capacity=40, room_type="THEORY")

    slot1 = TimeSlotInfo(time_slot_id=slot1_id, day_of_week=1, period_order=1, start_time="08:00", end_time="10:00")

    context = create_mock_context([c1, c2], [r1, r2], [slot1])

    # Both classes taught by same lecturer placed at slot1 in different rooms
    chromosome = Chromosome([
        Gene(class_id=c1_id, room_id=r1_id, time_slot_id=slot1_id),
        Gene(class_id=c2_id, room_id=r2_id, time_slot_id=slot1_id),
    ])

    fitness, hard_conflicts, soft_conflicts = evaluate_fitness(chromosome, context)
    assert hard_conflicts == 1, f"Expected 1 hard conflict for lecturer clash, got {hard_conflicts}"

def test_hc3_kbk_parallel_allowed():
    """
    Test: Dua kelas KBK berbeda pada semester/cohort sama -> diizinkan paralel, BUKAN HC3 (HC3 = 0)
    """
    lec1_id = uuid.uuid4()
    lec2_id = uuid.uuid4()
    c1_id = uuid.uuid4()
    c2_id = uuid.uuid4()
    r1_id = uuid.uuid4()
    r2_id = uuid.uuid4()
    slot1_id = uuid.uuid4()

    # Both are Semester 3, Cohort A, but different KBK: PEMROGRAMAN vs MULTIMEDIA
    c1 = ClassInfo(
        class_id=c1_id, class_name="IK-3A (Pemrograman Web)", course_id=uuid.uuid4(),
        course_code="IK301", course_name="Pemrograman Web", credits=3,
        semester=3, cohort="A", kbk="PEMROGRAMAN", student_count=25, course_type="LABORATORY",
        lecturer_id=lec1_id, lecturer_name="Dosen Web", lecturer_nidn="101"
    )
    c2 = ClassInfo(
        class_id=c2_id, class_name="IK-3A (Animasi 2D)", course_id=uuid.uuid4(),
        course_code="IK302", course_name="Animasi 2D", credits=3,
        semester=3, cohort="A", kbk="MULTIMEDIA", student_count=20, course_type="LABORATORY",
        lecturer_id=lec2_id, lecturer_name="Dosen Multimedia", lecturer_nidn="102"
    )

    r1 = RoomInfo(room_id=r1_id, code="LAB01", name="Lab Komputer 1", capacity=30, room_type="LABORATORY")
    r2 = RoomInfo(room_id=r2_id, code="LAB02", name="Lab Komputer 2", capacity=30, room_type="LABORATORY")

    slot1 = TimeSlotInfo(time_slot_id=slot1_id, day_of_week=1, period_order=1, start_time="08:00", end_time="10:00")

    context = create_mock_context([c1, c2], [r1, r2], [slot1])

    # Parallel placement in different rooms and different lecturers
    chromosome = Chromosome([
        Gene(class_id=c1_id, room_id=r1_id, time_slot_id=slot1_id),
        Gene(class_id=c2_id, room_id=r2_id, time_slot_id=slot1_id),
    ])

    fitness, hard_conflicts, soft_conflicts = evaluate_fitness(chromosome, context)
    assert hard_conflicts == 0, f"Expected 0 hard conflicts for parallel different KBK, got {hard_conflicts}"

def test_hc3_general_vs_kbk_clash():
    """
    Test: Kelas GENERAL vs KBK pada slot sama (semester & cohort sama) -> HC3 = 1
    """
    lec1_id = uuid.uuid4()
    lec2_id = uuid.uuid4()
    c1_id = uuid.uuid4()
    c2_id = uuid.uuid4()
    r1_id = uuid.uuid4()
    r2_id = uuid.uuid4()
    slot1_id = uuid.uuid4()

    # Semester 3, Cohort A: GENERAL vs PEMROGRAMAN
    c1_gen = ClassInfo(
        class_id=c1_id, class_name="IK-3A (Kewarganegaraan)", course_id=uuid.uuid4(),
        course_code="UNI301", course_name="Kewarganegaraan", credits=2,
        semester=3, cohort="A", kbk="GENERAL", student_count=35, course_type="THEORY",
        lecturer_id=lec1_id, lecturer_name="Dosen Umum", lecturer_nidn="201"
    )
    c2_kbk = ClassInfo(
        class_id=c2_id, class_name="IK-3A (Pemrograman Web)", course_id=uuid.uuid4(),
        course_code="IK301", course_name="Pemrograman Web", credits=3,
        semester=3, cohort="A", kbk="PEMROGRAMAN", student_count=25, course_type="THEORY",
        lecturer_id=lec2_id, lecturer_name="Dosen Web", lecturer_nidn="202"
    )

    r1 = RoomInfo(room_id=r1_id, code="R201", name="Ruang 201", capacity=40, room_type="THEORY")
    r2 = RoomInfo(room_id=r2_id, code="R202", name="Ruang 202", capacity=40, room_type="THEORY")

    slot1 = TimeSlotInfo(time_slot_id=slot1_id, day_of_week=2, period_order=1, start_time="08:00", end_time="10:00")

    context = create_mock_context([c1_gen, c2_kbk], [r1, r2], [slot1])

    # Both placed at slot1
    chromosome = Chromosome([
        Gene(class_id=c1_id, room_id=r1_id, time_slot_id=slot1_id),
        Gene(class_id=c2_id, room_id=r2_id, time_slot_id=slot1_id),
    ])

    fitness, hard_conflicts, soft_conflicts = evaluate_fitness(chromosome, context)
    assert hard_conflicts == 1, f"Expected 1 hard conflict for GENERAL vs KBK clash, got {hard_conflicts}"
