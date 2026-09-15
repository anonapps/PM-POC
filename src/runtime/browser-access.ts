import type { BrowserFileAccess, BrowserFileHandle } from "../persistence/project-file-service/browser";

interface PickerWindow extends Window {
  showOpenFilePicker?: (options: object) => Promise<BrowserFileHandle[]>;
  showSaveFilePicker?: (options: object) => Promise<BrowserFileHandle>;
}
export function createBrowserFileAccess(): BrowserFileAccess {
  const picker = globalThis.window as PickerWindow | undefined;
  return {
    supported: () => Boolean(picker?.showOpenFilePicker && picker.showSaveFilePicker),
    async openPmp() {
      try { return (await picker!.showOpenFilePicker!({ multiple: false, types: [{ description: "Project Manager project", accept: { "application/octet-stream": [".pmp"] } }] }))[0] ?? null; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return null; throw error; }
    },
    async savePmp(suggestedName) {
      try { return await picker!.showSaveFilePicker!({ suggestedName, types: [{ description: "Project Manager project", accept: { "application/octet-stream": [".pmp"] } }] }); }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return null; throw error; }
    },
  };
}
