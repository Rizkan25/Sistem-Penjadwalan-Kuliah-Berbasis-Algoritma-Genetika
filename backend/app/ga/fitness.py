from typing import Tuple, Dict, List, Set
from collections import defaultdict
from uuid import UUID
from app.ga.chromosome import Chromosome, ProblemContext, Gene

W_HARD = 1000.0
W_SOFT = 1.0

def evaluate_fitness(chromosome: Chromosome, context: ProblemContext) -> Tuple[float, int, int]:
    """
    Evaluates chromosome against 6 Hard Constraints and 3 Soft Constraints.
    Returns (fitness, hard_conflicts, soft_conflicts).
    """
    hc1_lecturer_clash = 0
    hc2_room_clash = 0
    hc3_cohort_clash = 0
    hc4_capacity_deficit = 0
    hc5_room_type_mismatch = 0
    hc6_lecturer_unavailable = 0

    # Intermediate mappings
    lecturer_slot_usage: Dict[Tuple[UUID, UUID], int] = defaultdict(int)
    room_slot_usage: Dict[Tuple[UUID, UUID], int] = defaultdict(int)
    slot_to_genes: Dict[UUID, List[Gene]] = defaultdict(list)
    
    # Soft constraint mappings
    # Group by student group (semester, cohort, kbk) -> day_of_week -> list of period_orders
    cohort_day_periods: Dict[Tuple[int, str, str], Dict[int, List[int]]] = defaultdict(lambda: defaultdict(list))
    # Group by lecturer -> day_of_week -> count of sessions
    lecturer_day_sessions: Dict[UUID, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
    
    sc1_pref_penalty = 0

    for gene in chromosome.genes:
        c_info = context.classes.get(gene.class_id)
        r_info = context.rooms.get(gene.room_id)
        t_info = context.time_slots.get(gene.time_slot_id)

        if not c_info or not r_info or not t_info:
            continue

        # 1. Lecturer clash tracking
        lecturer_slot_usage[(c_info.lecturer_id, gene.time_slot_id)] += 1

        # 2. Room clash tracking
        room_slot_usage[(gene.room_id, gene.time_slot_id)] += 1

        # 3. Time slot gene index for cohort conflict
        slot_to_genes[gene.time_slot_id].append(gene)

        # 4. HC4: Room capacity
        if r_info.capacity < c_info.student_count:
            hc4_capacity_deficit += 1

        # 5. HC5: Room type match
        if r_info.room_type != c_info.course_type:
            hc5_room_type_mismatch += 1

        # 6. HC6: Lecturer unavailable preference
        pref = context.preferences.get((c_info.lecturer_id, gene.time_slot_id))
        if pref == "UNAVAILABLE":
            hc6_lecturer_unavailable += 1

        # SC1: Lecturer preferred time
        # If lecturer has defined preferred slots, check if this slot is one of them
        if c_info.lecturer_id in context.lecturers_with_preferred:
            preferred_slots = context.preferred_slots_by_lecturer.get(c_info.lecturer_id, set())
            if gene.time_slot_id not in preferred_slots:
                sc1_pref_penalty += 1

        # Mappings for SC2 (Gap hours)
        cohort_day_periods[(c_info.semester, c_info.cohort, c_info.kbk)][t_info.day_of_week].append(t_info.period_order)

        # Mappings for SC3 (Lecturer max 3 sessions per day)
        lecturer_day_sessions[c_info.lecturer_id][t_info.day_of_week] += 1

    # Sum HC1: (count - 1) for duplicate bookings
    for count in lecturer_slot_usage.values():
        if count > 1:
            hc1_lecturer_clash += (count - 1)

    # Sum HC2: (count - 1) for duplicate bookings
    for count in room_slot_usage.values():
        if count > 1:
            hc2_room_clash += (count - 1)

    # Calculate HC3: Cohort & KBK parallel rules per slot
    for slot_id, genes in slot_to_genes.items():
        n = len(genes)
        if n < 2:
            continue
        for i in range(n):
            for j in range(i + 1, n):
                c1 = context.classes[genes[i].class_id]
                c2 = context.classes[genes[j].class_id]

                # Check if same semester and same cohort (e.g. '3' and 'A')
                if c1.semester == c2.semester and c1.cohort == c2.cohort:
                    # Clash if:
                    # a) Both have same KBK (e.g. both 'GENERAL' or both 'PEMROGRAMAN')
                    # b) One is 'GENERAL' and the other is a specific KBK
                    if c1.kbk == c2.kbk or c1.kbk == "GENERAL" or c2.kbk == "GENERAL":
                        hc3_cohort_clash += 1
                    # Note: If c1.kbk != c2.kbk and neither is 'GENERAL' (e.g. PEMROGRAMAN vs MULTIMEDIA),
                    # they are permitted to run in parallel! No clash added.

    # Total Hard Conflicts
    total_hard = (
        hc1_lecturer_clash
        + hc2_room_clash
        + hc3_cohort_clash
        + hc4_capacity_deficit
        + hc5_room_type_mismatch
        + hc6_lecturer_unavailable
    )

    # Calculate SC2: Gap hours for students on the same day
    sc2_gap_penalty = 0
    for group_key, days_dict in cohort_day_periods.items():
        for day, periods in days_dict.items():
            if len(periods) > 1:
                sorted_periods = sorted(periods)
                for idx in range(len(sorted_periods) - 1):
                    gap = sorted_periods[idx + 1] - sorted_periods[idx] - 1
                    if gap > 0:
                        sc2_gap_penalty += gap

    # Calculate SC3: Lecturer workload > 3 sessions per day
    sc3_overload_penalty = 0
    for lec_id, days_dict in lecturer_day_sessions.items():
        for day, sessions_count in days_dict.items():
            if sessions_count > 3:
                sc3_overload_penalty += (sessions_count - 3)

    # Total Soft Conflicts
    total_soft = sc1_pref_penalty + sc2_gap_penalty + sc3_overload_penalty

    # Total Penalty and Fitness
    total_penalty = (W_HARD * total_hard) + (W_SOFT * total_soft)
    fitness = 1.0 / (1.0 + total_penalty)

    chromosome.fitness = fitness
    chromosome.hard_conflicts = total_hard
    chromosome.soft_conflicts = total_soft
    chromosome.total_penalty = total_penalty

    return fitness, total_hard, total_soft
