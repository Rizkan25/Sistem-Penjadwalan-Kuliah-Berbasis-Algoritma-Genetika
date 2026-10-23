import random
from typing import Set, Tuple, List, Dict
from collections import defaultdict
from uuid import UUID
from app.ga.chromosome import Chromosome, ProblemContext
from app.ga.fitness import evaluate_fitness

def find_conflicted_gene_indices(chromosome: Chromosome, context: ProblemContext) -> Set[int]:
    """
    Identifies all gene indices involved in any hard constraint violation:
    - HC1: Lecturer clash (lecturer has > 1 class at the same time slot)
    - HC2: Room clash (room has > 1 class at the same time slot)
    - HC3: Cohort & KBK clash (same semester, same cohort, and same KBK or one is GENERAL)
    - HC4: Room capacity deficit (capacity < student_count)
    - HC5: Room type mismatch (room_type != course_type)
    - HC6: Lecturer unavailable preference (preference_type == 'UNAVAILABLE')
    """
    lec_slots: Dict[Tuple[UUID, UUID], List[int]] = defaultdict(list)
    room_slots: Dict[Tuple[UUID, UUID], List[int]] = defaultdict(list)
    slot_cohorts: Dict[Tuple[UUID, int, str], List[Tuple[int, str]]] = defaultdict(list)
    conflicted: Set[int] = set()

    for idx, gene in enumerate(chromosome.genes):
        c = context.classes.get(gene.class_id)
        r = context.rooms.get(gene.room_id)
        if not c or not r:
            continue

        lec_slots[(c.lecturer_id, gene.time_slot_id)].append(idx)
        room_slots[(gene.room_id, gene.time_slot_id)].append(idx)
        slot_cohorts[(gene.time_slot_id, c.semester, c.cohort)].append((idx, c.kbk))

        # HC4: Capacity
        if r.capacity < c.student_count:
            conflicted.add(idx)

        # HC5: Room type
        if r.room_type != c.course_type:
            conflicted.add(idx)

        # HC6: Lecturer unavailable
        if context.preferences.get((c.lecturer_id, gene.time_slot_id)) == "UNAVAILABLE":
            conflicted.add(idx)

    # HC1: Lecturer clash (duplicate bookings at same slot)
    for (lec, slot), idxs in lec_slots.items():
        if len(idxs) > 1:
            conflicted.update(idxs)

    # HC2: Room clash (duplicate bookings at same slot)
    for (room, slot), idxs in room_slots.items():
        if len(idxs) > 1:
            conflicted.update(idxs)

    # HC3: Cohort & KBK parallel rules (exact match with fitness.py)
    for (slot, sem, coh), items in slot_cohorts.items():
        n = len(items)
        if n > 1:
            for i in range(n):
                for j in range(i + 1, n):
                    idx_i, kbk_i = items[i]
                    idx_j, kbk_j = items[j]
                    if kbk_i == kbk_j or kbk_i == "GENERAL" or kbk_j == "GENERAL":
                        conflicted.add(idx_i)
                        conflicted.add(idx_j)

    return conflicted

def get_conflicted_class_ids(chromosome: Chromosome, context: ProblemContext) -> Set[UUID]:
    """
    Returns set of class_ids that are involved in any hard constraint violation.
    """
    conflicted_indices = find_conflicted_gene_indices(chromosome, context)
    return {chromosome.genes[i].class_id for i in conflicted_indices}

def repair(chromosome: Chromosome, context: ProblemContext, max_rounds: int = 20) -> Chromosome:
    """
    Repair operator for genetic algorithm:
    1. Identifies all genes involved in hard conflicts (HC1, HC2, HC3, HC6).
    2. In randomized order for problematic genes, tests all combinations of
       slot waktu x ruangan from context.valid_rooms_by_class[class_id].
    3. Moves the gene to the combination with minimal conflicts, breaking early as soon as 0 conflicts is found.
    4. Repeats for up to max_rounds (default 20) or until zero hard conflicts remain.
    5. Re-evaluates chromosome fitness and returns the repaired chromosome.
    """
    slots = list(context.time_slot_list)

    for _ in range(max_rounds):
        conflicted_indices = find_conflicted_gene_indices(chromosome, context)
        if not conflicted_indices:
            break

        # Randomized order of problematic genes
        conflicted_list = list(conflicted_indices)
        random.shuffle(conflicted_list)

        # Build state counters for fast candidate conflict evaluation
        lec_count: Dict[Tuple[UUID, UUID], int] = defaultdict(int)
        room_count: Dict[Tuple[UUID, UUID], int] = defaultdict(int)
        cohort_map: Dict[Tuple[UUID, int, str], List[Tuple[int, str]]] = defaultdict(list)

        for idx, gene in enumerate(chromosome.genes):
            c = context.classes.get(gene.class_id)
            if not c:
                continue
            lec_count[(c.lecturer_id, gene.time_slot_id)] += 1
            room_count[(gene.room_id, gene.time_slot_id)] += 1
            cohort_map[(gene.time_slot_id, c.semester, c.cohort)].append((idx, c.kbk))

        for idx in conflicted_list:
            gene = chromosome.genes[idx]
            c = context.classes.get(gene.class_id)
            if not c:
                continue

            # Remove current gene temporarily from state counters
            lec_count[(c.lecturer_id, gene.time_slot_id)] -= 1
            room_count[(gene.room_id, gene.time_slot_id)] -= 1
            cohort_map[(gene.time_slot_id, c.semester, c.cohort)] = [
                item for item in cohort_map[(gene.time_slot_id, c.semester, c.cohort)]
                if item[0] != idx
            ]

            valid_rooms = context.valid_rooms_by_class.get(c.class_id, context.room_list)
            candidates = [(s.time_slot_id, r.room_id) for s in slots for r in valid_rooms]
            random.shuffle(candidates)

            best_comb = (gene.time_slot_id, gene.room_id)
            best_conflicts = 999999

            for cand_slot, cand_room in candidates:
                conf = 0
                # HC1: Lecturer clash
                conf += lec_count[(c.lecturer_id, cand_slot)]

                # HC2: Room clash
                conf += room_count[(cand_room, cand_slot)]

                # HC3: Cohort & KBK clash (exact rule as fitness.py)
                coh_items = cohort_map.get((cand_slot, c.semester, c.cohort), [])
                for _, other_kbk in coh_items:
                    if other_kbk == c.kbk or other_kbk == "GENERAL" or c.kbk == "GENERAL":
                        conf += 1

                # HC6: Lecturer unavailable preference
                if context.preferences.get((c.lecturer_id, cand_slot)) == "UNAVAILABLE":
                    conf += 1

                if conf < best_conflicts:
                    best_conflicts = conf
                    best_comb = (cand_slot, cand_room)
                    if conf == 0:
                        # Early exit as soon as a 0-conflict combination is encountered
                        break

            # Assign best combination found
            gene.time_slot_id, gene.room_id = best_comb

            # Add back to state counters
            lec_count[(c.lecturer_id, gene.time_slot_id)] += 1
            room_count[(gene.room_id, gene.time_slot_id)] += 1
            cohort_map[(gene.time_slot_id, c.semester, c.cohort)].append((idx, c.kbk))

    evaluate_fitness(chromosome, context)
    return chromosome
