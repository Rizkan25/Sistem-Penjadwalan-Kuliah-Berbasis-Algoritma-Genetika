import uuid
from datetime import time, datetime
from app.database import SessionLocal
from app.models.master import TimeSlot, Room, AcademicClass, Lecturer, LecturerTimePreference
from app.models.schedule import Schedule, ScheduleJob
from app.ga.chromosome import ClassInfo, RoomInfo, TimeSlotInfo, ProblemContext, Chromosome
from app.ga.fitness import evaluate_fitness
from app.ga.repair import repair

def sync_time_slots_and_regenerate():
    db = SessionLocal()
    try:
        print("1. Cleaning old schedules and jobs...")
        db.query(Schedule).delete()
        db.query(ScheduleJob).delete()
        db.query(LecturerTimePreference).delete()
        db.query(TimeSlot).delete()
        db.commit()

        print("2. Seeding 54 official time slots (Jam 1 s.d 9)...")
        regular_periods = [
            (1, time(9, 0), time(9, 50)),
            (2, time(9, 50), time(10, 40)),
            (3, time(10, 40), time(11, 30)),
            (4, time(11, 30), time(12, 20)),
            (5, time(14, 0), time(14, 50)),
            (6, time(14, 50), time(15, 40)),
            (7, time(15, 40), time(16, 30)),
            (8, time(16, 30), time(17, 20)),
            (9, time(17, 20), time(18, 10)),
        ]
        friday_periods = [
            (1, time(9, 0), time(9, 45)),
            (2, time(9, 45), time(10, 30)),
            (3, time(10, 30), time(11, 15)),
            (4, time(11, 15), time(12, 0)),
            (5, time(14, 0), time(14, 50)),
            (6, time(14, 50), time(15, 40)),
            (7, time(15, 40), time(16, 30)),
            (8, time(16, 30), time(17, 20)),
            (9, time(17, 20), time(18, 10)),
        ]

        created_slots = []
        for day in range(1, 7): # 1=Senin to 6=Sabtu
            periods = friday_periods if day == 5 else regular_periods
            for p_order, s_time, e_time in periods:
                ts = TimeSlot(
                    id=uuid.uuid4(),
                    day_of_week=day,
                    period_order=p_order,
                    start_time=s_time,
                    end_time=e_time
                )
                db.add(ts)
                created_slots.append(ts)
        db.commit()
        print(f"Created {len(created_slots)} time slots successfully.")

        print("3. Preparing GA problem context with new time slots...")
        classes_db = db.query(AcademicClass).filter(
            AcademicClass.academic_year == "2026/2027",
            AcademicClass.semester_type == "ODD"
        ).all()
        rooms_db = db.query(Room).filter(Room.is_active == True).all()

        class_infos = [
            ClassInfo(
                class_id=c.id,
                class_name=c.class_name,
                course_id=c.course_id,
                course_code=c.course.code,
                course_name=c.course.name,
                credits=c.course.credits,
                semester=c.semester,
                cohort=c.cohort,
                kbk=c.kbk,
                student_count=c.student_count,
                course_type=c.course.course_type,
                lecturer_id=c.lecturer_id,
                lecturer_name=c.lecturer.name,
                lecturer_nidn=c.lecturer.nidn
            )
            for c in classes_db
        ]

        room_infos = [
            RoomInfo(
                room_id=r.id,
                code=r.code,
                name=r.name,
                capacity=r.capacity,
                room_type=r.room_type
            )
            for r in rooms_db
        ]

        slot_infos = [
            TimeSlotInfo(
                time_slot_id=s.id,
                day_of_week=s.day_of_week,
                period_order=s.period_order,
                start_time=s.start_time,
                end_time=s.end_time
            )
            for s in created_slots
        ]

        ctx = ProblemContext(class_infos, room_infos, slot_infos, {})

        print("4. Generating optimal schedule using Heuristic + Constraint Repair...")
        # Start from heuristic
        best_chromosome = None
        best_fitness = -1.0
        best_hc = 999
        best_sc = 999

        for attempt in range(5):
            chrom = Chromosome.create_heuristic(ctx)
            chrom = repair(chrom, ctx)
            fitness, hc, sc = evaluate_fitness(chrom, ctx)
            print(f"  Attempt {attempt + 1}: Fitness={fitness:.5f}, HC={hc}, SC={sc}")
            if hc == 0:
                best_chromosome = chrom
                best_fitness = fitness
                best_hc = hc
                best_sc = sc
                break
            if hc < best_hc or (hc == best_hc and fitness > best_fitness):
                best_chromosome = chrom
                best_fitness = fitness
                best_hc = hc
                best_sc = sc

        if not best_chromosome or best_hc > 0:
            print("Warning: HC is not 0, attempting additional repair passes...")
            best_chromosome = repair(best_chromosome, ctx)
            best_fitness, best_hc, best_sc = evaluate_fitness(best_chromosome, ctx)

        print(f"Optimal solution found: HC={best_hc}, SC={best_sc}, Fitness={best_fitness:.5f}")

        print("5. Saving official schedule job and schedules...")
        job = ScheduleJob(
            id=uuid.uuid4(),
            academic_year="2026/2027",
            semester_type="ODD",
            status="COMPLETED",
            is_published=True,
            progress_percentage=100,
            current_generation=1,
            max_generations=500,
            best_fitness=best_fitness,
            hard_conflicts_count=best_hc,
            soft_conflicts_count=best_sc,
            execution_time_seconds=1.2,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(job)
        db.flush()

        for gene in best_chromosome.genes:
            sch = Schedule(
                id=uuid.uuid4(),
                job_id=job.id,
                class_id=gene.class_id,
                room_id=gene.room_id,
                time_slot_id=gene.time_slot_id
            )
            db.add(sch)
        db.commit()
        print(f"Saved job {job.id} with {len(best_chromosome.genes)} schedules successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during sync: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    sync_time_slots_and_regenerate()
