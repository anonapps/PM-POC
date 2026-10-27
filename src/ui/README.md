# Compatibility UI tokens

`tokens.json` is the canonical source for this first migration wave:

- regular/creation/embedded field heights36/34/30px;
- shared text band20px and horizontal inset8px;
- timeline footer minimum56px (defensive narrow layouts may grow);
- the distinct existing task and milestone status palettes.

These are existing approved values. This extraction does not round fonts, reduce densities, merge status meanings or introduce a user density setting. Other typography/surface/action/spacing tokens still belong to their current sources until subsequent scoped migrations.

## Editing and generated assets

1. Change `tokens.json` only within an authorized UI change.
2. Run `npm run ui:tokens`.
3. Commit both JSON and `src/app/ui-tokens.generated.css`.
4. Run `npm run ui:tokens:check`, relevant unit/layout checks and compare catalogue specimens.

`npm run build` checks freshness before compiling. The generator uses Node built-ins only and is not shipped as runtime code. The app and isolated catalogue import the generated stylesheet before their existing CSS. Existing `--field-height`, `--field-text-line` and `--field-text-inset` names remain compatibility aliases at their original cascade positions. The public TypeScript `TASK_STATUS_COLOURS` and `MILESTONE_STATUS_COLOURS` exports retain their keys and consumers while importing the same JSON.

Do not edit generated CSS, redeclare canonical token names in a page, or use a status color for an unrelated role because its hex matches. A56px header is not a timeline footer token. A30px action is not automatically an embedded field. Multiline sizes and derived padding remain explicit variants.

Not every matching literal elsewhere in legacy CSS has migrated. Remove or replace those declarations only after mapping their consumers and proving compatibility. Component ownership/selector cleanup is a later wave, not an invitation to change accepted rendering in this one.

[Contracts](../../docs/UI_COMPONENT_CONTRACTS.md) · [Catalogue](../../tools/ui-catalogue/README.md) · [Migration plan](../../docs/UI_STANDARD_MIGRATION_PLAN.md).
