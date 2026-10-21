/** Capitalise only the first character of human-readable text.
 * Technical identifiers, URLs, email addresses and file paths must not use this helper.
 * Call once when an edit is committed (blur), before dispatching the application command.
 */
export function capitaliseFirstLetter(value: string): string {
  const firstLetter = value.search(/\p{L}/u);
  if (firstLetter < 0) return value;
  return value.slice(0, firstLetter) + value[firstLetter].toLocaleUpperCase() + value.slice(firstLetter + 1);
}
