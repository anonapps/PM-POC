/** Capitalise only the first character of human-readable text.
 * Technical identifiers, URLs, email addresses and file paths must not use this helper.
 * Call once when an edit is committed (blur), before dispatching the application command.
 */
export function capitaliseFirstLetter(value: string): string {
  const firstLetter = value.search(/\p{L}/u);
  if (firstLetter < 0) return value;
  const letter=String.fromCodePoint(value.codePointAt(firstLetter)!);
  return value.slice(0, firstLetter) + letter.toLocaleUpperCase() + value.slice(firstLetter + letter.length);
}

/** Only explicitly supplied human-readable fields; never normalise loaded records wholesale. */
export function normaliseHumanTextPatch<T extends object>(patch:T,current?:object):T {
  const textFields=new Set(["name","title","description","role","notes"]);
  return Object.fromEntries(Object.entries(patch).map(([key,value])=>[key,textFields.has(key)&&typeof value==="string"&&(!current||value!==(current as Record<string,unknown>)[key])?capitaliseFirstLetter(value):value])) as T;
}
export function patchMatchesEntity(current:object,patch:object):boolean {
  return Object.entries(patch).every(([key,value])=>JSON.stringify((current as Record<string,unknown>)[key])===JSON.stringify(value));
}
