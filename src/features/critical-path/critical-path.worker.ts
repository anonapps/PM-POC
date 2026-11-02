import { calculateCriticalPath } from "../../domain/critical-path/calculate";
import type { CalculationSource } from "../../domain/critical-path/types";

self.onmessage = (event: MessageEvent<{ source: CalculationSource; scope: string | null; id: number }>) => {
  try { self.postMessage({ id: event.data.id, result: calculateCriticalPath(event.data.source, event.data.scope) }); }
  catch { self.postMessage({ id: event.data.id, error: true }); }
};
