export function computeSessionEnergyKwh(
  startedAt: Date,
  endedAt: Date,
  powerKw: number,
): number {
  const durationHours = (endedAt.getTime() - startedAt.getTime()) / 3_600_000;
  return durationHours * powerKw;
}
