import { AUGMENTS, AUGMENT_TIER_WEIGHTS } from "./augmentData";
import type {
  AugmentDefinition,
  AugmentGameState,
  AugmentId,
  AugmentSelection,
  AugmentSelectionPhase,
  AugmentTier,
} from "./types";

export const AUGMENT_OPTION_COUNT = 3;
export const INITIAL_REROLLS = 3;
export const FIRST_LOSS_TRIGGER = 8;
export const SECOND_LOSS_TRIGGER = 16;

const phases: Exclude<AugmentSelectionPhase, "complete">[] = [
  "start",
  "losses_8",
  "losses_16",
];

function weightedTier(): AugmentTier {
  const entries = Object.entries(AUGMENT_TIER_WEIGHTS) as [AugmentTier, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [tier, weight] of entries) {
    roll -= weight;
    if (roll < 0) return tier;
  }

  return "silver";
}

function drawOne(tier: AugmentTier, excluded: Set<AugmentId>): AugmentId | null {
  const candidates = AUGMENTS.filter(
    (augment) => augment.tier === tier && !excluded.has(augment.id),
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

function drawOptions(excluded: Set<AugmentId>, tier: AugmentTier): AugmentId[] {
  const result: AugmentId[] = [];

  for (let index = 0; index < AUGMENT_OPTION_COUNT; index += 1) {
    const picked = drawOne(tier, excluded);

    if (picked) {
      result.push(picked);
      excluded.add(picked);
      continue;
    }

    // If a tier runs out of unused augments, keep the tier rule by allowing
    // an already-seen card as the final fallback.
    const tierCandidates = AUGMENTS.filter((augment) => augment.tier === tier);
    if (tierCandidates.length === 0) break;

    const fallback = tierCandidates[Math.floor(Math.random() * tierCandidates.length)];
    result.push(fallback.id);
    excluded.add(fallback.id);
  }

  return result;
}

function tierForPhase(
  phase: Exclude<AugmentSelectionPhase, "complete">,
  selectionTiers: AugmentTier[],
): AugmentTier {
  const index = phases.indexOf(phase);
  return selectionTiers[index] ?? weightedTier();
}

export function createAugmentGameState(
  selectionTiers?: AugmentTier[],
): AugmentGameState {
  const sharedTiers = [
    selectionTiers?.[0] ?? weightedTier(),
    selectionTiers?.[1] ?? weightedTier(),
    selectionTiers?.[2] ?? weightedTier(),
  ];

  const selection = createSelection("start", [], [], sharedTiers[0]);

  return {
    piecesLost: 0,
    rerollsRemaining: INITIAL_REROLLS,
    selectionTiers: sharedTiers,
    ownedAugments: [],
    selections: [selection],
    nextSelection: "start",
  };
}

function createSelection(
  phase: Exclude<AugmentSelectionPhase, "complete">,
  ownedAugments: AugmentId[],
  previousOptions: AugmentId[],
  tier: AugmentTier,
): AugmentSelection {
  const excluded = new Set([...ownedAugments, ...previousOptions]);
  return {
    phase,
    options: drawOptions(excluded, tier),
    selected: null,
    rerollsUsed: 0,
  };
}

export function getCurrentSelection(state: AugmentGameState) {
  return state.selections[state.selections.length - 1] ?? null;
}

/**
 * Reroll exactly one card. The replacement always has the same tier.
 * The other two cards remain untouched and one shared reroll is consumed.
 */
export function rerollCurrentSelection(
  state: AugmentGameState,
  optionIndex: number,
): AugmentGameState {
  const current = getCurrentSelection(state);

  if (
    !current ||
    current.selected ||
    state.rerollsRemaining <= 0 ||
    optionIndex < 0 ||
    optionIndex >= current.options.length
  ) {
    return state;
  }

  const oldId = current.options[optionIndex];
  const oldDefinition = getAugmentDefinition(oldId);
  if (!oldDefinition) return state;

  const excluded = new Set<AugmentId>([
    ...state.ownedAugments,
    ...current.options,
  ]);
  excluded.delete(oldId);

  const replacement = drawOne(oldDefinition.tier, excluded);
  if (!replacement) return state;

  const options = [...current.options];
  options[optionIndex] = replacement;

  return {
    ...state,
    rerollsRemaining: state.rerollsRemaining - 1,
    selections: [
      ...state.selections.slice(0, -1),
      {
        ...current,
        options,
        rerollsUsed: current.rerollsUsed + 1,
      },
    ],
  };
}

export function chooseAugment(
  state: AugmentGameState,
  augmentId: AugmentId,
): AugmentGameState {
  const current = getCurrentSelection(state);
  if (!current || current.selected || !current.options.includes(augmentId)) return state;

  const ownedAugments = [...state.ownedAugments, augmentId];
  const selections = [
    ...state.selections.slice(0, -1),
    { ...current, selected: augmentId },
  ];

  const nextPhaseIndex = phases.indexOf(current.phase) + 1;
  const nextPhase = phases[nextPhaseIndex];

  if (!nextPhase) {
    return {
      ...state,
      ownedAugments,
      selections,
      nextSelection: null,
    };
  }

  return {
    ...state,
    ownedAugments,
    selections,
    nextSelection: nextPhase,
  };
}

export function recordPiecesLost(
  state: AugmentGameState,
  count = 1,
): AugmentGameState {
  if (count <= 0 || state.nextSelection === null) return state;

  const piecesLost = state.piecesLost + count;
  const reached = phaseReached(piecesLost);

  if (
    reached === null ||
    reached === "start" ||
    state.selections.some((selection) => selection.phase === reached)
  ) {
    return { ...state, piecesLost };
  }

  const current = getCurrentSelection(state);
  if (!current?.selected) return { ...state, piecesLost };

  const selection = createSelection(
    reached,
    [...state.ownedAugments],
    state.selections.flatMap((item) => item.options),
    tierForPhase(reached, state.selectionTiers),
  );

  return {
    ...state,
    piecesLost,
    selections: [...state.selections, selection],
    nextSelection: reached,
  };
}

function phaseReached(piecesLost: number): Exclude<AugmentSelectionPhase, "complete"> | null {
  if (piecesLost >= SECOND_LOSS_TRIGGER) return "losses_16";
  if (piecesLost >= FIRST_LOSS_TRIGGER) return "losses_8";
  return null;
}

export function getAugmentDefinition(id: AugmentId): AugmentDefinition | undefined {
  return AUGMENTS.find((augment) => augment.id === id);
}
