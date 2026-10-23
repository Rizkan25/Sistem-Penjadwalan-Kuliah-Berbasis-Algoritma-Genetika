import pytest
from app.database import SessionLocal
from app.tasks import build_problem_context
from app.ga.chromosome import Chromosome, Gene
from app.ga.fitness import evaluate_fitness
from app.ga.repair import repair

def test_repair_operator_resolves_all_hard_conflicts():
    """
    Test repair: kromosom yang sengaja dibuat bentrok harus turun ke 0 HC setelah repair()
    """
    db = SessionLocal()
    context = build_problem_context(db, "2026/2027", "ODD")
    db.close()

    assert len(context.class_list) == 122
    assert len(context.room_list) == 28
    assert len(context.time_slot_list) == 24

    # Deliberately construct a heavily conflicted chromosome:
    # Assign every single class to the very first slot and first room!
    single_slot = context.time_slot_list[0].time_slot_id
    single_room = context.room_list[0].room_id

    conflicted_genes = [
        Gene(class_id=c.class_id, room_id=single_room, time_slot_id=single_slot)
        for c in context.class_list
    ]

    chromosome = Chromosome(conflicted_genes)
    evaluate_fitness(chromosome, context)

    # Verify that initial chromosome has massive conflicts
    assert chromosome.hard_conflicts > 100, f"Expected >100 hard conflicts initially, got {chromosome.hard_conflicts}"

    # Run repair operator
    repaired_chromosome = repair(chromosome, context, max_rounds=20)
    evaluate_fitness(repaired_chromosome, context)

    # Assert that all hard conflicts are successfully eliminated
    assert repaired_chromosome.hard_conflicts == 0, (
        f"Expected hard_conflicts = 0 after repair, but got {repaired_chromosome.hard_conflicts}"
    )

def test_repair_on_heuristic_chromosome():
    """
    Test repair on a standard heuristic chromosome:
    Must consistently eliminate all remaining hard conflicts to 0.
    """
    db = SessionLocal()
    context = build_problem_context(db, "2026/2027", "ODD")
    db.close()

    heuristic_ind = Chromosome.create_heuristic(context)
    evaluate_fitness(heuristic_ind, context)

    # Run repair
    repair(heuristic_ind, context, max_rounds=20)
    evaluate_fitness(heuristic_ind, context)

    assert heuristic_ind.hard_conflicts == 0, (
        f"Expected 0 hard conflicts on repaired heuristic, got {heuristic_ind.hard_conflicts}"
    )
