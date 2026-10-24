"use client";
import { useEffect, useState } from "react";

export function useCreationFeedback(firstFieldId: string) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return {
    error,
    notice: notice?.text,
    validate(name: string) {
      setError(name.trim() ? "" : "Name is required.");
      return Boolean(name.trim());
    },
    created(kind: string) {
      setError("");
      setNotice({ text: `${kind} created.` });
      document.getElementById(firstFieldId)?.focus();
    },
    reset() { setError(""); setNotice(null); },
  };
}
