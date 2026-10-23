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
    hc0_boundary_violation = 0
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
    cohort_day_periods: Dict[Tuple[int, str, str], Dict[int, List[Tuple[int, int]]]] = defaultdict(lambda: defaultdict(list))
    lecturer_day_sessions: Dict[UUID, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
    
    sc1_pref_penalty = 0

    for gene in chromosome.genes:
        c_info = context.classes.get(gene.class_id)
        r_info = context.rooms.get(gene.room_id)
        t_info = context.time_slots.get(gene.time_slot_id)

        if not c_info or not r_info or not t_info:
            continue

        spanned_slots = context.get_spanned_slots(gene.class_id, gene.time_slot_id)
        k = max(1, c_info.credits)

        # Check boundary integrity (class must not cross lunch break or overflow the day)
        if len(spanned_slots) < k:
            hc0_boundary_violation += (k - len(spanned_slots))

        # Check slots occupied by this class
        for ts in spanned_slots:
            lecturer_slot_usage[(c_info.lecturer_id, ts.time_slot_id)] += 1
            room_slot_usage[(gene.room_id, ts.time_slot_id)] += 1
            slot_to_genes[ts.time_slot_id].append(gene)

            # HC6: Lecturer unavailable preference
            pref = context.preferences.get((c_info.lecturer_id, ts.time_slot_id))
            if pref == "UNAVAILABLE":
                hc6_lecturer_unavailable += 1

            # SC1: Lecturer preferred time
            if c_info.lecturer_id in context.lecturers_with_preferred:
                preferred_slots = context.preferred_slots_by_lecturer.get(c_info.lecturer_id, set())
                if ts.time_slot_id not in preferred_slots:
                    sc1_pref_penalty += 1

        # HC4: Room capacity
        if r_info.capacity < c_info.student_count:
            hc4_capacity_deficit += 1

        # HC5: Room type match
        if r_info.room_type != c_info.course_type:
            hc5_room_type_mismatch += 1

        # Mappings for SC2 (Gap hours between sessions)
        if spanned_slots:
            cohort_day_periods[(c_info.semester, c_info.cohort, c_info.kbk)][t_info.day_of_week].append(
                (spanned_slots[0].period_order, spanned_slots[-1].period_order)
            )

        # Mappings for SC3 (Lecturer max 3 sessions per day)
        lecturer_day_sessions[c_info.lecturer_id][t_info.day_of_week] += 1

    # Sum HC1: (count - 1) for duplicate lecturer bookings
    for count in lecturer_slot_usage.values():
        if count > 1:
            hc1_lecturer_clash += (count - 1)

    # Sum HC2: (count - 1) for duplicate room bookings
    for count in room_slot_usage.values():
        if count > 1:
            hc2_room_clash += (count - 1)

    # Calculate HC3: Cohort & KBK parallel rules per slot
    for slot_id, genes in slot_to_genes.items():
        n = len(genes)
        if n < 2:
            continue
        # Avoid double-counting if the same two classes share multiple slots
        seen_pairs = set()
        for i in range(n):
            for j in range(i + 1, n):
                pair_key = (min(genes[i].class_id, genes[j].class_id), max(genes[i].class_id, genes[j].class_id))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                c1 = context.classes[genes[i].class_id]
                c2 = context.classes[genes[j].class_id]

                if c1.semester == c2.semester and c1.cohort == c2.cohort:
                    if c1.kbk == c2.kbk or c1.kbk == "GENERAL" or c2.kbk == "GENERAL":
                        hc3_cohort_clash += 1

    # Total Hard Conflicts
    total_hard = (
        hc0_boundary_violation
        + hc1_lecturer_clash
        + hc2_room_clash
        + hc3_cohort_clash
        + hc4_capacity_deficit
        + hc5_room_type_mismatch
        + hc6_lecturer_unavailable
    )

    # Calculate SC2: Gap hours for students on the same day
    sc2_gap_penalty = 0
    for group_key, days_dict in cohort_day_periods.items():
        for day, sessions in days_dict.items():
            if len(sessions) > 1:
                # Sort by start period
                sorted_sessions = sorted(sessions, key=lambda x: x[0])
                for idx in range(len(sorted_sessions) - 1):
                    # Gap between end of session idx and start of session idx+1
                    gap = sorted_sessions[idx + 1][0] - sorted_sessions[idx][1] - 1
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
