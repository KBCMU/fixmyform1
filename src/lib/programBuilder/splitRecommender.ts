/**
 * Split Recommender
 * Returns appropriate training splits based on days per week
 */

import type { SplitDefinition } from './types';

/**
 * Get recommended training splits for a given number of days per week
 */
export function getRecommendedSplits(daysPerWeek: number): SplitDefinition[] {
  switch (daysPerWeek) {
    case 2:
    case 3:
      return getFullBodySplits();
    case 4:
      return getFourDaySplits();
    case 5:
      return getFiveDaySplits();
    case 6:
      return getSixDaySplits();
    default:
      return [];
  }
}

/**
 * Full Body splits (2-3 days per week)
 */
function getFullBodySplits(): SplitDefinition[] {
  return [
    {
      type: 'full_body',
      name: 'Full Body',
      description: 'Hit all muscle groups each session',
      daysPerWeek: 2,
      weekStructure: [
        {
          name: 'Full Body A',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
        {
          name: 'Full Body B',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
      ],
      recommended: true,
    },
    {
      type: 'full_body',
      name: 'Full Body (3x)',
      description: 'Three full-body sessions per week',
      daysPerWeek: 3,
      weekStructure: [
        {
          name: 'Full Body A',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
        {
          name: 'Full Body B',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
        {
          name: 'Full Body C',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
      ],
      recommended: true,
    },
  ];
}

/**
 * 4-day splits
 */
function getFourDaySplits(): SplitDefinition[] {
  return [
    {
      type: 'full_body',
      name: 'Full Body (4x)',
      description: 'Full-body every other day',
      daysPerWeek: 4,
      weekStructure: [
        {
          name: 'Full Body A',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
        {
          name: 'Full Body B',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
        {
          name: 'Full Body C',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
        {
          name: 'Full Body D',
          targetMuscles: [
            'chest',
            'back',
            'shoulders',
            'biceps',
            'triceps',
            'quads',
            'hamstrings',
            'glutes',
            'calves',
            'core',
          ],
        },
      ],
      recommended: true,
    },
    {
      type: 'upper_lower',
      name: 'Upper/Lower',
      description: 'Split upper and lower body across 4 days',
      daysPerWeek: 4,
      weekStructure: [
        {
          name: 'Upper A',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower A',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
        {
          name: 'Upper B',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower B',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
      ],
      recommended: true,
    },
    {
      type: 'anterior_posterior',
      name: 'Anterior/Posterior',
      description: 'Front and back body split',
      daysPerWeek: 4,
      weekStructure: [
        {
          name: 'Anterior A',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior A',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
        {
          name: 'Anterior B',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior B',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
      ],
      recommended: false,
    },
  ];
}

/**
 * 5-day splits
 */
function getFiveDaySplits(): SplitDefinition[] {
  return [
    {
      type: 'upper_lower',
      name: 'Upper/Lower (Rest)',
      description: 'Upper/Lower with rest day',
      daysPerWeek: 5,
      weekStructure: [
        {
          name: 'Upper A',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower A',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
        {
          name: 'Rest',
          targetMuscles: [],
        },
        {
          name: 'Upper B',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower B',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
      ],
      recommended: true,
    },
    {
      type: 'anterior_posterior',
      name: 'Anterior/Posterior (Rest)',
      description: 'Anterior/Posterior with rest day',
      daysPerWeek: 5,
      weekStructure: [
        {
          name: 'Anterior A',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior A',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
        {
          name: 'Rest',
          targetMuscles: [],
        },
        {
          name: 'Anterior B',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior B',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
      ],
      recommended: false,
    },
    {
      type: 'upper_lower_ppl',
      name: 'Upper/Lower + PPL',
      description: 'Two upper/lower sessions plus push/pull/legs',
      daysPerWeek: 5,
      weekStructure: [
        {
          name: 'Upper',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
        {
          name: 'Push',
          targetMuscles: ['chest', 'shoulders', 'triceps'],
        },
        {
          name: 'Pull',
          targetMuscles: ['back', 'biceps', 'forearms'],
        },
        {
          name: 'Legs',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
      ],
      recommended: true,
    },
  ];
}

/**
 * 6-day splits
 */
function getSixDaySplits(): SplitDefinition[] {
  return [
    {
      type: 'upper_lower',
      name: 'Upper/Lower (3x)',
      description: 'Upper/Lower trained 3x each per week',
      daysPerWeek: 6,
      weekStructure: [
        {
          name: 'Upper A',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower A',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
        {
          name: 'Upper B',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower B',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
        {
          name: 'Upper C',
          targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        },
        {
          name: 'Lower C',
          targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
        },
      ],
      recommended: true,
    },
    {
      type: 'anterior_posterior',
      name: 'Anterior/Posterior (3x)',
      description: 'Anterior/Posterior trained 3x each per week',
      daysPerWeek: 6,
      weekStructure: [
        {
          name: 'Anterior A',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior A',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
        {
          name: 'Anterior B',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior B',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
        {
          name: 'Anterior C',
          targetMuscles: ['chest', 'quads', 'biceps', 'shoulders', 'core'],
        },
        {
          name: 'Posterior C',
          targetMuscles: ['back', 'hamstrings', 'glutes', 'triceps', 'calves'],
        },
      ],
      recommended: false,
    },
  ];
}
