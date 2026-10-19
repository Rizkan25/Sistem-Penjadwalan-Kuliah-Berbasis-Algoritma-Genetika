import random
from typing import List, Tuple
from app.ga.chromosome import Chromosome, ProblemContext, Gene

def tournament_selection(population: List[Chromosome], k: int = 3) -> Chromosome:
    """
    Tournament selection: picks k random candidates from the population
    and returns the one with the highest fitness.
    """
    sample = random.sample(population, min(k, len(population)))
    return max(sample, key=lambda ind: ind.fitness)

def uniform_crossover(
    parent1: Chromosome, 
    parent2: Chromosome, 
    crossover_rate: float = 0.85
) -> Tuple[Chromosome, Chromosome]:
    """
    Uniform Crossover:
    With probability crossover_rate, creates two children by randomly inheriting
    genes from either parent 1 or parent 2 at each position.
    """
    if random.random() > crossover_rate:
        return parent1.copy(), parent2.copy()

    child1_genes: List[Gene] = []
    child2_genes: List[Gene] = []

    for g1, g2 in zip(parent1.genes, parent2.genes):
        if random.random() < 0.5:
            child1_genes.append(g1.copy())
            child2_genes.append(g2.copy())
        else:
            child1_genes.append(g2.copy())
            child2_genes.append(g1.copy())

    return Chromosome(child1_genes), Chromosome(child2_genes)

def mutate(
    chromosome: Chromosome, 
    context: ProblemContext, 
    mutation_rate: float = 0.08
) -> Chromosome:
    """
    Mutation Operator:
    1. Swap Mutation: swaps time slots between two random genes.
    2. Valid-Room / Time-Slot Resetting: reassigns a gene to another valid room or time slot.
    """
    num_genes = len(chromosome.genes)
    if num_genes == 0:
        return chromosome

    # Swap Mutation
    if random.random() < mutation_rate and num_genes > 1:
        idx1, idx2 = random.sample(range(num_genes), 2)
        # Swap time slots
        chromosome.genes[idx1].time_slot_id, chromosome.genes[idx2].time_slot_id = (
            chromosome.genes[idx2].time_slot_id,
            chromosome.genes[idx1].time_slot_id,
        )

    # Gene-level Resetting Mutation
    for gene in chromosome.genes:
        if random.random() < mutation_rate:
            choice_type = random.random()
            if choice_type < 0.5:
                # Reassign time slot
                new_slot = random.choice(context.time_slot_list)
                gene.time_slot_id = new_slot.time_slot_id
            else:
                # Reassign valid room (preserves HC4 and HC5)
                valid_rooms = context.valid_rooms_by_class.get(gene.class_id, context.room_list)
                new_room = random.choice(valid_rooms)
                gene.room_id = new_room.room_id

    return chromosome
