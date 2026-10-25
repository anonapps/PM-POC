import { HumanTextInput } from "./human-text";
export function CreationField({id,label,value,onChange,error,date=false,autoFocus=false}:{id:string;label:string;value:string;onChange:(value:string)=>void;error?:string;date?:boolean;autoFocus?:boolean}) {
  return <label>{label} *<HumanTextInput id={id} type={date?"date":"text"} autoFocus={autoFocus} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error?`${id}-error`:undefined} value={value} onChange={event=>onChange(event.target.value)}/>{error&&<small id={`${id}-error`} role="alert" className="field-error">{error}</small>}</label>;
}
