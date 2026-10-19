import time
from typing import List, Callable, Optional, Dict, Any
from app.ga.chromosome import Chromosome, ProblemContext
from app.ga.fitness import evaluate_fitness
from app.ga.operators import tournament_selection, uniform_crossover, mutate

class GAEngine:
    def __init__(
        self,
        context: ProblemContext,
        population_size: int = 100,
        max_generations: int = 500,
        crossover_rate: float = 0.85,
        mutation_rate: float = 0.08,
        elitism_count: int = 2,
        progress_callback: Optional[Callable[[int, int, float, int, int], None]] = None
    ):
        self.context = context
        self.population_size = max(20, population_size)
        self.max_generations = max(10, max_generations)
        self.crossover_rate = crossover_rate
        self.base_mutation_rate = mutation_rate
        self.current_mutation_rate = mutation_rate
        self.elitism_count = max(1, elitism_count)
        self.progress_callback = progress_callback
        
        # Adaptive tracking
        self.stagnant_generations = 0
        self.adaptive_boost_countdown = 0
        self.best_ever_fitness = -1.0
        self.history: List[Dict[str, Any]] = []

    def run(self) -> Dict[str, Any]:
        start_time = time.time()

        # 1. Heuristic Initialization
        population: List[Chromosome] = []
        for _ in range(self.population_size):
            ind = Chromosome.create_heuristic(self.context)
            evaluate_fitness(ind, self.context)
            population.append(ind)

        # Sort descending by fitness
        population.sort(key=lambda x: x.fitness, reverse=True)
        best = population[0].copy()
        self.best_ever_fitness = best.fitness

        # Initial progress
        if self.progress_callback:
            self.progress_callback(
                0, 
                self.max_generations, 
                best.fitness, 
                best.hard_conflicts, 
                best.soft_conflicts
            )

        # 2. Evolution Loop
        for generation in range(1, self.max_generations + 1):
            # Adaptive Mutation Check (PRD 7.2)
            if self.adaptive_boost_countdown > 0:
                self.adaptive_boost_countdown -= 1
                if self.adaptive_boost_countdown == 0:
                    self.current_mutation_rate = self.base_mutation_rate
            elif self.stagnant_generations >= 15:
                # Diversity injection: raise mutation rate to 0.25 for 5 generations
                self.current_mutation_rate = 0.25
                self.adaptive_boost_countdown = 5
                self.stagnant_generations = 0

            # Elitism: retain top N best
            new_population: List[Chromosome] = [ind.copy() for ind in population[:self.elitism_count]]

            # Reproduction
            while len(new_population) < self.population_size:
                p1 = tournament_selection(population, k=3)
                p2 = tournament_selection(population, k=3)

                c1, c2 = uniform_crossover(p1, p2, self.crossover_rate)

                c1 = mutate(c1, self.context, self.current_mutation_rate)
                c2 = mutate(c2, self.context, self.current_mutation_rate)

                evaluate_fitness(c1, self.context)
                evaluate_fitness(c2, self.context)

                new_population.append(c1)
                if len(new_population) < self.population_size:
                    new_population.append(c2)

            # Sort new generation
            new_population.sort(key=lambda x: x.fitness, reverse=True)
            population = new_population

            current_best = population[0]
            if current_best.fitness > self.best_ever_fitness:
                best = current_best.copy()
                self.best_ever_fitness = best.fitness
                self.stagnant_generations = 0
            else:
                self.stagnant_generations += 1

            # Log history (sample every generation or 5 generations)
            if generation % 5 == 0 or generation == 1 or generation == self.max_generations:
                self.history.append({
                    "generation": generation,
                    "fitness": round(best.fitness, 4),
                    "hard_conflicts": best.hard_conflicts,
                    "soft_conflicts": best.soft_conflicts
                })

                # Throttled update to database / frontend
                if self.progress_callback:
                    self.progress_callback(
                        generation,
                        self.max_generations,
                        best.fitness,
                        best.hard_conflicts,
                        best.soft_conflicts
                    )

            # Termination Criteria
            # a) Zero hard conflicts and zero soft conflicts (ideal perfection)
            if best.hard_conflicts == 0 and best.soft_conflicts == 0:
                break

            # b) Zero hard conflicts and long convergence plateau (at least 50 stagnant generations)
            if best.hard_conflicts == 0 and self.stagnant_generations >= 50:
                break

        execution_time = time.time() - start_time

        # Final progress update
        if self.progress_callback:
            self.progress_callback(
                generation,
                self.max_generations,
                best.fitness,
                best.hard_conflicts,
                best.soft_conflicts
            )

        return {
            "best_chromosome": best,
            "final_generation": generation,
            "best_fitness": best.fitness,
            "hard_conflicts": best.hard_conflicts,
            "soft_conflicts": best.soft_conflicts,
            "execution_time_seconds": execution_time,
            "history": self.history
        }
