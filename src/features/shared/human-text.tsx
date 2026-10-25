"use client";
import type { ComponentPropsWithoutRef } from "react";
import { capitaliseFirstLetter } from "./text-normalisation";

/** Normalise the completed UI edit before its existing blur/commit callback.
 * Draft onChange callbacks update local state only; persistence remains in commands.
 * Search, dates, numbers and technical inputs must continue using ordinary inputs.
 */
export function HumanTextInput({onBlur,onChange,...props}:ComponentPropsWithoutRef<"input">) {
  return <input {...props} onChange={onChange} onBlur={event=>{
    if(!props.type||props.type==="text"){
      const normalized=capitaliseFirstLetter(event.currentTarget.value);
      if(normalized!==event.currentTarget.value){event.currentTarget.value=normalized;onChange?.(event);}
    }
    onBlur?.(event);
  }}/>;
}
export function HumanTextArea({onBlur,onChange,...props}:ComponentPropsWithoutRef<"textarea">) {
  return <textarea {...props} onChange={onChange} onBlur={event=>{
    const normalized=capitaliseFirstLetter(event.currentTarget.value);
    if(normalized!==event.currentTarget.value){event.currentTarget.value=normalized;onChange?.(event);}
    onBlur?.(event);
  }}/>;
}
