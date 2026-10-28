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

## First shared composition adopters

Use [ActionButton](../features/shared/action-button.tsx) for new native primary/secondary/danger action controls. Pass native attributes, accessible labels, handlers and refs normally. Set `type="button"` for non-submit actions; the facade intentionally preserves native default-submit behavior when type is omitted. Current adoption covers shared module Search, both timeline footers, record creation, Risk context and Baselines management. It preserves existing contextual sizes and is not a blanket replacement for HeroUI, sort/disclosure or icon controls.

Use [FormField and FieldMessage](../features/shared/form-field.tsx) for the existing label/required-marker/reserved-error composition. Pass the child native/human-text control with its current ID, describedby, invalid state and callbacks. Project forms and all record creation panels now use this composition. Preserve `announceError={false}` / `announce={false}` where the existing slot is not a live alert. Do not move validation, text normalization or command dispatch into the composition.

These components add no wrapper DOM or CSS. Existing context rules and the compatibility tokens still set geometry. Wider control-style ownership and redundant-rule cleanup require consumer-by-consumer verification; no source rule has been deleted in this wave.

## Native option rows

Use [ChoiceRow](../features/shared/choice-row.tsx) for a native checkbox/radio wrapped by its clickable label. Pass native input props through `input`, label attributes through `labelProps` and the visible content as children. Keep state, grouping, selection commands and close/refocus policy in the consuming selector. Current consumers are PredictiveSelect (single radio choice), RelationshipPicker (multiple checkboxes) and FilterChoices.

This composition adds no default class, size, input state or keyboard model. It preserves existing context styles and native semantics. It is not a replacement for table select-all/indeterminate cells or disclosure triggers. Reuse it without converting multi-selection to single-selection or assigning a status color to a choice state.
