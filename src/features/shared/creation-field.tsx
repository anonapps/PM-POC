import { capitaliseFirstLetter } from "./text-normalisation";
export function CreationField({id,label,value,onChange,error,date=false,autoFocus=false}:{id:string;label:string;value:string;onChange:(value:string)=>void;error?:string;date?:boolean;autoFocus?:boolean}) {
  return <label>{label} *<input id={id} type={date?"date":"text"} autoFocus={autoFocus} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error?`${id}-error`:undefined} value={value} onChange={event=>onChange(event.target.value)} onBlur={()=>{if(!date)onChange(capitaliseFirstLetter(value));}}/>{error&&<small id={`${id}-error`} role="alert" className="field-error">{error}</small>}</label>;
}
