/**
 * Parses a value as a positive integer.
 * Returns `fallback` if the value is not a finite positive integer.
 */
export const parsePositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
