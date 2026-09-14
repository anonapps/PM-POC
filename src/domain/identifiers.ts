import type {
  HumanId,
  HumanIdPrefix,
  SequencedEntityKind,
} from "./types";

export type IdentifierSequences = Readonly<Record<SequencedEntityKind, number>>;

export const HUMAN_ID_PREFIXES: Readonly<
  Record<SequencedEntityKind, HumanIdPrefix>
> = Object.freeze({
  stream: "STREAM",
  task: "TASK",
  milestone: "MILESTONE",
  person: "PERSON",
  risk: "RISK",
  decision: "DECISION",
});

export const EMPTY_IDENTIFIER_SEQUENCES: IdentifierSequences = Object.freeze({
  stream: 0,
  task: 0,
  milestone: 0,
  person: 0,
  risk: 0,
  decision: 0,
});

export interface IssuedHumanId {
  readonly humanId: HumanId;
  readonly sequences: IdentifierSequences;
}

/**
 * Issues monotonically increasing project-local IDs. The counter records the
 * highest value ever issued, so deleting an entity cannot make its ID reusable.
 */
export function issueHumanId(
  sequences: IdentifierSequences,
  kind: SequencedEntityKind,
): IssuedHumanId {
  const nextValue = sequences[kind] + 1;
  const humanId = `${HUMAN_ID_PREFIXES[kind]}-${String(nextValue).padStart(3, "0")}` as HumanId;

  return {
    humanId,
    sequences: { ...sequences, [kind]: nextValue },
  };
}

export function sequencesFromHumanIds(
  humanIds: readonly HumanId[],
): IdentifierSequences {
  return humanIds.reduce<IdentifierSequences>((sequences, humanId) => {
    const match = /^(STREAM|TASK|MILESTONE|PERSON|RISK|DECISION)-(\d+)$/.exec(
      humanId,
    );
    if (!match) return sequences;

    const prefix = match[1] as HumanIdPrefix;
    const kind = (Object.entries(HUMAN_ID_PREFIXES).find(
      ([, value]) => value === prefix,
    )?.[0] ?? null) as SequencedEntityKind | null;
    if (!kind) return sequences;

    const value = Number(match[2]);
    return value > sequences[kind]
      ? { ...sequences, [kind]: value }
      : sequences;
  }, EMPTY_IDENTIFIER_SEQUENCES);
}
