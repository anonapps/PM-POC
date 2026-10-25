"use client";
import { validateCreationFields } from "./creation-validation";
import { useEffect, useState } from "react";

export function useCreationFeedback(firstFieldId: string) {
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [notice, setNotice] = useState<{ text: string } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return {
    error:errors.name,
    errors,
    validateFields(fields:Parameters<typeof validateCreationFields>[0]) {
      const result=validateCreationFields(fields);setErrors(result);return Object.keys(result).length===0;
    },
    notice: notice?.text,
    validate(name: string) {
      setErrors(name.trim()?{}:{name:"Name is required."});
      return Boolean(name.trim());
    },
    created(kind: string) {
      setErrors({});
      setNotice({ text: `${kind} created.` });
      document.getElementById(firstFieldId)?.focus();
    },
    reset() { setErrors({}); setNotice(null); },
  };
}
