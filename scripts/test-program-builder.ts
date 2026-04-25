import { generateProgram } from '../src/lib/programBuilder/programAssembler';
import type { UserProfile } from '../src/lib/programBuilder/types';

const profiles: { label: string; profile: UserProfile }[] = [
  {
    label: 'Beginner, 3 days, Full Body, Commercial Gym',
    profile: {
      experience: 'beginner',
      daysPerWeek: 3,
      minutesPerSession: 60,
      gymType: 'commercial',
      selectedSplit: 'full_body',
    },
  },
  {
    label: 'Advanced, 5 days, UL Rest Repeat, Weak Points',
    profile: {
      experience: 'advanced',
      daysPerWeek: 5,
      minutesPerSession: 75,
      gymType: 'commercial',
      selectedSplit: 'upper_lower',
      weakPoints: ['chest_upper', 'delts_lateral', 'biceps_long_short'],
    },
  },
  {
    label: 'Intermediate, 4 days, Upper/Lower, Home Gym',
    profile: {
      experience: 'intermediate',
      daysPerWeek: 4,
      minutesPerSession: 45,
      gymType: 'home',
      selectedSplit: 'upper_lower',
    },
  },
];

for (const { label, profile } of profiles) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PROFILE: ${label}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const program = generateProgram(profile);
    console.log(`Split: ${program.split.name} (${program.split.type})`);
    console.log(`Workouts: ${program.workouts.length} days\n`);

    for (const w of program.workouts) {
      if (w.exercises.length === 0) {
        console.log(`  ${w.dayName}: REST`);
        continue;
      }
      console.log(`  ${w.dayName}: ${w.exercises.length} exercises`);
      for (const e of w.exercises) {
        const alts = e.alternatives.map((a) => a.name).join(', ');
        console.log(
          `    - ${e.selectedExercise.name}  ${e.sets}x${e.repRange[0]}-${e.repRange[1]}  [${e.targetMuscle}]  alts: ${e.alternatives.length}`
        );
      }
    }
  } catch (err) {
    console.error(`ERROR: ${err}`);
  }
}
