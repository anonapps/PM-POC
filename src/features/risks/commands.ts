import { capitaliseFirstLetter } from "../shared/text-normalisation";
import { calculateRiskLevel, issueHumanId, type Risk, type RiskAction, type RiskRating, type RiskStatus } from "../../domain";
import type { ProjectCommand, ProjectState } from "../../application";
export interface RiskDraft { title: string; description?: string; status: RiskStatus; probability: RiskRating; impact: RiskRating; ownerId: string | null; dueDate?: string; projectWide: boolean; relatedStreamIds: readonly string[]; relatedTaskIds: readonly string[]; relatedMilestoneIds: readonly string[] }
const active = (items: readonly { id: string; deletion: { isDeleted: boolean } }[], id: string) => items.some((item) => item.id === id && !item.deletion.isDeleted);
export function validateRisk(state: ProjectState, draft: RiskDraft) { const errors: string[] = []; if (!draft.title.trim()) errors.push("Risk title is required."); if (draft.ownerId && !active(state.people, draft.ownerId)) errors.push("Owner must be active."); if (draft.relatedStreamIds.some((id) => !active(state.streams, id)) || draft.relatedTaskIds.some((id) => !active(state.tasks, id)) || draft.relatedMilestoneIds.some((id) => !active(state.milestones, id))) errors.push("Relationships must target active entities."); return errors; }
export function createRisk(draft: RiskDraft): ProjectCommand { return { type: "create-risk", apply(state, context) { if (validateRisk(state, draft).length) return state; const issued = issueHumanId(state.identifierSequences, "risk"); const risk: Risk = { ...draft, description: draft.description ? capitaliseFirstLetter(draft.description.trim()) : draft.description, title: capitaliseFirstLetter(draft.title.trim()), id: context.createId(), projectId: state.project.id, humanId: issued.humanId, riskLevel: calculateRiskLevel(draft.probability, draft.impact), actions: [], deletion: { isDeleted: false } }; return { ...state, risks: [...state.risks, risk], identifierSequences: issued.sequences }; } }; }
export function editRisk(id: string, patch: Partial<RiskDraft>): ProjectCommand { return { type: "edit-risk", apply(state) { const current = state.risks.find((risk) => risk.id === id && !risk.deletion.isDeleted); if (!current) return state; const draft = { ...current, ...patch }; if (validateRisk(state, draft).length) return state; if (Object.entries(patch).every(([key, value]) => (key === "title" || (key === "description" && value !== undefined) ? capitaliseFirstLetter(String(value ?? "").trim()) : Array.isArray(value) && Array.isArray(current[key as keyof Risk]) ? JSON.stringify(value) : value) === (Array.isArray(current[key as keyof Risk]) ? JSON.stringify(current[key as keyof Risk]) : current[key as keyof Risk]))) return state; return { ...state, risks: state.risks.map((risk) => risk.id === id ? { ...risk, ...patch, description: draft.description ? capitaliseFirstLetter(draft.description.trim()) : draft.description, title: capitaliseFirstLetter(draft.title.trim()), riskLevel: calculateRiskLevel(draft.probability, draft.impact) } : risk) }; } }; }
export function addRiskAction(riskId: string, description: string, dueDate?: string): ProjectCommand { return { type: "add-risk-action", apply(state, context) { if (!description.trim() || !state.risks.some(risk => risk.id === riskId && !risk.deletion.isDeleted)) return state; const action: RiskAction = { id: context.createId(), description: capitaliseFirstLetter(description.trim()), status: "Open", dueDate: dueDate || undefined }; return { ...state, risks: state.risks.map((risk) => risk.id === riskId ? { ...risk, actions: [...risk.actions, action] } : risk) }; } }; }
export function editRiskAction(riskId: string, actionId: string, patch: Partial<Omit<RiskAction, "id">>): ProjectCommand { return { type: "edit-risk-action", apply(state) { if (patch.description !== undefined && !patch.description.trim()) return state; const risk = state.risks.find(item => item.id === riskId && !item.deletion.isDeleted); const action = risk?.actions.find(item => item.id === actionId); if (!action) return state; const changes = { ...patch, ...(patch.description === undefined ? {} : { description: capitaliseFirstLetter(patch.description.trim()) }) }; if (Object.entries(changes).every(([key, value]) => action[key as keyof RiskAction] === value)) return state; return { ...state, risks: state.risks.map((item) => item.id === riskId ? { ...item, actions: item.actions.map((entry) => entry.id === actionId ? { ...entry, ...changes } : entry) } : item) }; } }; }
export const isRiskActionOverdue = (action: RiskAction, today: string) => action.status === "Open" && Boolean(action.dueDate && action.dueDate < today);
export const selectOpenRisks = (state: ProjectState) => state.risks.filter((risk) => !risk.deletion.isDeleted && risk.status !== "Closed");

export function deleteRiskAction(riskId: string, actionId: string): ProjectCommand {
  return { type: "delete-risk-action", apply(state) {
    const risk = state.risks.find(item => item.id === riskId && !item.deletion.isDeleted);
    if (!risk?.actions.some(action => action.id === actionId)) return state;
    return { ...state, risks: state.risks.map(item => item.id === riskId
      ? { ...item, actions: item.actions.filter(action => action.id !== actionId) } : item) };
  } };
}
export function restoreRiskAction(riskId: string, action: RiskAction, index: number): ProjectCommand {
  return { type: "restore-risk-action", apply(state) {
    const risk = state.risks.find(item => item.id === riskId && !item.deletion.isDeleted);
    if (!risk || risk.actions.some(existing => existing.id === action.id)) return state;
    const position = Number.isFinite(index) ? Math.max(0, Math.min(Math.trunc(index), risk.actions.length)) : risk.actions.length;
    return { ...state, risks: state.risks.map(item => item.id === riskId
      ? { ...item, actions: [...item.actions.slice(0,position), action, ...item.actions.slice(position)] } : item) };
  } };
}
