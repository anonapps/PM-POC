/** AND between categories, OR between selected values in each category. */
export function matchesFilters(values: Readonly<Record<string, readonly string[]>>, selected: Readonly<Record<string, readonly string[]>>): boolean {
  return Object.entries(selected).every(([category, choices]) => !choices.length || choices.some(choice => values[category]?.includes(choice)));
}
export function toggleFilter(current: readonly string[], value: string): string[] {
  return current.includes(value) ? current.filter(item => item !== value) : [...current, value];
}
