export const STAT_MAX = 99;
export const STAT_FIELDS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"] as const;
export type StatField = typeof STAT_FIELDS[number];
