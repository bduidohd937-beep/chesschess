export type AugmentTier = "silver" | "gold" | "prism" | "transcendent";
export type AugmentCategory = "piece" | "field" | "utility";

export type AugmentId =
  | "S001" | "S002" | "S003" | "S004" | "S005" | "S006"
  | "G001" | "G002" | "G003" | "G004" | "G005" | "G006" | "G007"
  | "P001" | "P002" | "P003" | "P004" | "P005" | "P006"
  | "T001" | "T002" | "T003" | "T004" | "T005" | "T006" | "T007";

export type AugmentSelectionPhase = "start" | "losses_8" | "losses_16" | "complete";

export type AugmentDefinition = {
  id: AugmentId;
  tier: AugmentTier;
  category: AugmentCategory;
  name: string;
  description: string;
};

export type AugmentSelection = {
  phase: Exclude<AugmentSelectionPhase, "complete">;
  options: AugmentId[];
  selected: AugmentId | null;
  rerollsUsed: number;
};

export type AugmentGameState = {
  piecesLost: number;
  rerollsRemaining: number;
  selectionTiers: AugmentTier[];
  ownedAugments: AugmentId[];
  selections: AugmentSelection[];
  nextSelection: Exclude<AugmentSelectionPhase, "complete"> | null;
};

export type AugmentTierWeights = Record<AugmentTier, number>;
