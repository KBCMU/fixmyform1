/**
 * Agent Tool: getTrainingAdvice
 *
 * Returns hardcoded evidence-based training guidelines for a given topic.
 * Curated from modern hypertrophy science — Beardsley, TNF, Mundy, etc.
 */

const KNOWLEDGE_BASE: Record<string, string> = {
  volume: `## Volume Guidelines for Hypertrophy

- **Maintenance volume (MV):** ~6 sets per muscle per week is typically enough to maintain muscle.
- **Minimum effective volume (MEV):** ~8-10 sets per muscle per week for most people to start growing.
- **Maximum adaptive volume (MAV):** ~12-20 sets per muscle per week — the productive range for most trainees.
- **Maximum recoverable volume (MRV):** The ceiling beyond which you accumulate more fatigue than adaptation. Highly individual (often 20-25+ sets).
- Volume should be periodised: start a mesocycle near MEV and ramp toward MRV over 4-6 weeks.
- Count only hard sets (within 0-4 RIR) — junk volume doesn't count.
- Larger muscles (quads, back) can generally tolerate more volume than smaller ones (biceps, side delts).
- If soreness or performance declines week-over-week, volume is likely too high.

Sources: Beardsley volume landmarks, Israetel volume framework, Schoenfeld meta-analyses.`,

  frequency: `## Training Frequency for Hypertrophy

- Hitting each muscle 2x/week is generally superior to 1x/week at the same total volume.
- Beyond 2x/week, returns diminish unless total volume is very high.
- Frequency is a tool to distribute volume — if you need 20 sets/week for quads, spreading over 3 sessions beats cramming into 1.
- Recovery between sessions matters: 48-72 hours between training the same muscle group.
- Higher frequency works well for muscles that recover quickly (biceps, side delts, calves).
- Lower frequency may be needed for muscles that are highly fatiguing to train (quads, back, hamstrings).
- Split choice should match frequency needs: PPL for 2x/week, Full Body for 3x, Upper/Lower for 2x.

Sources: Schoenfeld 2016 meta-analysis, practical recommendations from TNF, Greg Nuckols.`,

  rep_ranges: `## Rep Ranges for Hypertrophy

- The hypertrophy rep range is broader than traditionally thought: **6-30 reps** can all build muscle effectively when taken close to failure.
- However, **8-15 reps** remains the practical sweet spot — balances mechanical tension, metabolic stress, and joint-friendliness.
- Lower reps (5-8): better for compound movements, builds strength alongside size, higher injury risk at failure.
- Moderate reps (8-15): the bread and butter — efficient time under tension with manageable fatigue.
- Higher reps (15-30): useful for isolation work, joint-friendly, good for accumulating volume with less systemic fatigue.
- Using a variety of rep ranges across exercises is beneficial — don't lock into one range.
- The key factor is proximity to failure, not the rep range itself.

Sources: Schoenfeld et al. 2017, Lasevicius et al. 2018, Chris Beardsley's work on effective reps.`,

  progressive_overload: `## Progressive Overload for Hypertrophy

- Progressive overload is THE primary driver of long-term hypertrophy.
- Overload doesn't only mean adding weight — it includes: more reps, more sets, better technique (more effective reps), slower eccentrics, increased range of motion.
- Double progression is the simplest approach: hit the top of your rep range, then add weight and drop to the bottom.
- Aim for small, consistent increases — 2.5-5 lbs on upper body lifts, 5-10 lbs on lower body per mesocycle.
- Track your lifts religiously. If weights aren't going up over months, something needs to change (volume, nutrition, recovery).
- Rate of progression slows with training age: beginners can add weight weekly, intermediates monthly, advanced trainees per mesocycle.
- When you can no longer add weight or reps, consider technique refinement, exercise variation, or a deload.

Sources: Beardsley force-velocity principles, Helms/Morgan strength progressions, TNF practical overload.`,

  exercise_selection: `## Exercise Selection for Hypertrophy

- Choose exercises based on the **length-tension relationship**: exercises that challenge a muscle most at its stretched position tend to produce more hypertrophy.
- Examples of stretch-biased exercises: Romanian deadlifts (hamstrings), incline curls (biceps), overhead tricep extensions, deep squats.
- Machine and cable exercises offer consistent tension throughout the range of motion — excellent for hypertrophy.
- Free-weight compounds are great for progressive overload but create variable resistance curves.
- Match exercises to equipment availability and your injury history.
- Prioritise exercises where you feel the target muscle working (mind-muscle connection matters for isolation work).
- Rotate exercises every 2-3 mesocycles to prevent staleness, but keep core movements for tracking progression.
- Each workout should have 3-5 exercises per muscle: one primary compound, 1-2 secondary movements, 1-2 isolations.

Sources: Beardsley length-tension research, Elijah Mundy's exercise selection principles, King Deltoids biomechanics.`,

  deload: `## Deloading for Hypertrophy

- A deload is a planned reduction in training stress to allow recovery and sensitise the body to future training.
- Standard deload: reduce volume by 50% (halve the sets) while keeping intensity (weight) the same for 1 week.
- Alternative deload: reduce intensity by 10-15% while keeping volume, or simply take 3-4 rest days.
- Deload every 4-6 weeks, or when performance markers decline (can't hit previous numbers, excessive soreness, poor sleep, lack of motivation).
- Proactive deloads are better than reactive ones — plan them into your mesocycle structure.
- During a deload, focus on technique refinement, mobility work, and recovery strategies.
- Don't skip deloads thinking you'll grow faster — accumulated fatigue masks fitness and limits future gains.
- After a deload, you should feel refreshed and typically see a performance jump in week 1 of the next mesocycle.

Sources: Israetel mesocycle structure, Helms periodisation framework, TNF fatigue management.`,

  nutrition: `## Nutrition Basics for Hypertrophy

- A caloric surplus of 200-400 kcal/day is generally optimal for building muscle with minimal fat gain.
- Protein intake: 1.6-2.2 g/kg bodyweight per day — the most critical macronutrient for hypertrophy.
- Distribute protein across 3-5 meals/day with 30-50g per meal for optimal muscle protein synthesis.
- Carbohydrates fuel training performance — don't neglect them. Higher carbs around training can improve session quality.
- Fats: minimum 0.5-0.7 g/kg bodyweight for hormonal health, remainder of calories from personal preference.
- Sleep 7-9 hours/night — this is when most recovery and muscle protein synthesis occurs.
- Stay hydrated: dehydration impairs strength and recovery.
- Creatine monohydrate (3-5 g/day) is the most evidence-based supplement for hypertrophy.

Sources: Schoenfeld & Aragon protein research, Helms nutrition recommendations, Trexler flexible dieting.`,

  technique: `## Technique Principles for Hypertrophy

- Good technique is the foundation that enables safe progressive overload over years.
- Control the eccentric (lowering) phase — 2-3 seconds minimum. This is where much of the muscle damage and mechanical tension occurs.
- Full range of motion generally produces more hypertrophy than partial reps (Schoenfeld 2020 meta).
- Exception: partial reps in the stretched position can be useful as an intensification technique.
- Mind-muscle connection: actively think about squeezing the target muscle, especially on isolations.
- Avoid excessive momentum (cheating) on hypertrophy-focused work — save it for strength-focused sets.
- Breathing: brace your core on compounds (Valsalva for heavy sets), exhale on the concentric for isolations.
- Film your working sets to identify technique breakdown — this is exactly what FixMyForm helps with.

Sources: Schoenfeld ROM meta-analysis, Calatayud mind-muscle connection study, Keegan Mallory technique principles.`,
};

/** List of all available topics for suggestion. */
const AVAILABLE_TOPICS = Object.keys(KNOWLEDGE_BASE);

/** Fuzzy match a topic query to the knowledge base keys. */
function matchTopic(query: string): string | null {
  const q = query.toLowerCase().trim();

  // Direct match
  if (KNOWLEDGE_BASE[q]) return q;

  // Alias map for common variations
  const aliases: Record<string, string> = {
    sets: 'volume',
    'sets per week': 'volume',
    reps: 'rep_ranges',
    'rep range': 'rep_ranges',
    'rep ranges': 'rep_ranges',
    overload: 'progressive_overload',
    progression: 'progressive_overload',
    exercises: 'exercise_selection',
    'exercise choice': 'exercise_selection',
    rest: 'deload',
    recovery: 'deload',
    food: 'nutrition',
    diet: 'nutrition',
    protein: 'nutrition',
    macros: 'nutrition',
    form: 'technique',
    'mind muscle': 'technique',
    tempo: 'technique',
    'how many times': 'frequency',
    split: 'frequency',
  };

  if (aliases[q]) return aliases[q];

  // Substring match
  for (const key of AVAILABLE_TOPICS) {
    if (q.includes(key) || key.includes(q)) return key;
  }

  return null;
}

export async function getTrainingAdvice(
  args: { topic: string },
): Promise<string> {
  const matched = matchTopic(args.topic);

  if (matched) {
    return KNOWLEDGE_BASE[matched];
  }

  return `No specific guidelines found for "${args.topic}". Available topics: ${AVAILABLE_TOPICS.join(', ')}. Try one of these, or ask your question directly and I'll answer from my training knowledge.`;
}
