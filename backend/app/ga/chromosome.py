from typing import List, Dict, Any, Optional
import random
from uuid import UUID

class Gene:
    def __init__(self, class_id: UUID, room_id: UUID, time_slot_id: UUID):
        self.class_id = class_id
        self.room_id = room_id
        self.time_slot_id = time_slot_id

    def copy(self) -> 'Gene':
        return Gene(self.class_id, self.room_id, self.time_slot_id)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_id": str(self.class_id),
            "room_id": str(self.room_id),
            "time_slot_id": str(self.time_slot_id),
        }

class ClassInfo:
    def __init__(
        self,
        class_id: UUID,
        class_name: str,
        course_id: UUID,
        course_code: str,
        course_name: str,
        credits: int,
        semester: int,
        cohort: str,
        kbk: str,
        student_count: int,
        course_type: str,
        lecturer_id: UUID,
        lecturer_name: str,
        lecturer_nidn: str
    ):
        self.class_id = class_id
        self.class_name = class_name
        self.course_id = course_id
        self.course_code = course_code
        self.course_name = course_name
        self.credits = credits
        self.semester = semester
        self.cohort = cohort
        self.kbk = kbk
        self.student_count = student_count
        self.course_type = course_type
        self.lecturer_id = lecturer_id
        self.lecturer_name = lecturer_name
        self.lecturer_nidn = lecturer_nidn

class RoomInfo:
    def __init__(self, room_id: UUID, code: str, name: str, capacity: int, room_type: str):
        self.room_id = room_id
        self.code = code
        self.name = name
        self.capacity = capacity
        self.room_type = room_type

class TimeSlotInfo:
    def __init__(self, time_slot_id: UUID, day_of_week: int, period_order: int, start_time: Any, end_time: Any):
        self.time_slot_id = time_slot_id
        self.day_of_week = day_of_week
        self.period_order = period_order
        self.start_time = start_time
        self.end_time = end_time

class ProblemContext:
    """Holds all relational data in memory for rapid fitness and genetic calculations"""
    def __init__(
        self,
        classes: List[ClassInfo],
        rooms: List[RoomInfo],
        time_slots: List[TimeSlotInfo],
        preferences: Dict[tuple, str] # (lecturer_id, time_slot_id) -> 'UNAVAILABLE' | 'PREFERRED'
    ):
        self.classes = {c.class_id: c for c in classes}
        self.class_list = classes
        self.rooms = {r.room_id: r for r in rooms}
        self.room_list = rooms
        self.time_slots = {t.time_slot_id: t for t in time_slots}
        self.time_slot_list = time_slots
        self.preferences = preferences # key: (lecturer_id, time_slot_id) -> UNAVAILABLE or PREFERRED

        # Precompute lecturers who have at least one PREFERRED slot
        self.lecturers_with_preferred = set()
        self.preferred_slots_by_lecturer: Dict[UUID, set] = {}
        for (lec_id, slot_id), pref_type in preferences.items():
            if pref_type == "PREFERRED":
                self.lecturers_with_preferred.add(lec_id)
                if lec_id not in self.preferred_slots_by_lecturer:
                    self.preferred_slots_by_lecturer[lec_id] = set()
                self.preferred_slots_by_lecturer[lec_id].add(slot_id)

        # Precompute candidate valid rooms for each class:
        # HC5: room_type must match class course_type
        # HC4: room capacity >= class student_count
        self.valid_rooms_by_class: Dict[UUID, List[RoomInfo]] = {}
        for c in classes:
            valid = [
                r for r in rooms 
                if r.room_type == c.course_type and r.capacity >= c.student_count
            ]
            # Fallback if no exact room fits (prevents crash, soft degradation)
            if not valid:
                valid = [r for r in rooms if r.room_type == c.course_type]
            if not valid:
                valid = rooms
            self.valid_rooms_by_class[c.class_id] = valid

class Chromosome:
    def __init__(self, genes: List[Gene]):
        self.genes = genes
        self.fitness: float = 0.0
        self.hard_conflicts: int = 0
        self.soft_conflicts: int = 0
        self.total_penalty: float = 0.0

    def copy(self) -> 'Chromosome':
        new_c = Chromosome([g.copy() for g in self.genes])
        new_c.fitness = self.fitness
        new_c.hard_conflicts = self.hard_conflicts
        new_c.soft_conflicts = self.soft_conflicts
        new_c.total_penalty = self.total_penalty
        return new_c

    @classmethod
    def create_heuristic(cls, context: ProblemContext) -> 'Chromosome':
        """
        Heuristic Room-Type & Capacity Matching:
        Assigns each class to a room that satisfies HC4 and HC5,
        and assigns a random time slot.
        """
        genes = []
        for c in context.class_list:
            candidate_rooms = context.valid_rooms_by_class[c.class_id]
            chosen_room = random.choice(candidate_rooms)
            chosen_slot = random.choice(context.time_slot_list)
            genes.append(Gene(c.class_id, chosen_room.room_id, chosen_slot.time_slot_id))
        return cls(genes)
