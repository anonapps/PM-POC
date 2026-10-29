import { HumanTextInput,HumanTextArea } from './human-text';
import { FormField } from './form-field';
import { LIFECYCLE_STATUSES } from '../../domain';
import type { ProjectFormDraft } from '../overview/project';
export function ProjectFormFields({draft,onChange,errors,onValidate,prefix}:{draft:ProjectFormDraft;onChange:(draft:ProjectFormDraft)=>void;errors:Record<string,string>;onValidate:()=>void;prefix:string}){
 const field=(key:'name'|'description'|'startDate'|'endDate'|'status',label:string,required=false)=>{
  const props={id:`${prefix}-${key}`,'aria-label':label,'aria-required':required||undefined,'aria-invalid':Boolean(errors[key]),'aria-describedby':`${prefix}-${key}-error`,value:draft[key]??'',onBlur:onValidate};
  return <FormField label={label} required={required} className={`form-field ${key==='description'?'wide-field':''}`} errorId={`${prefix}-${key}-error`} error={errors[key]}>{key==='status'?<select {...props} onChange={e=>onChange({...draft,status:e.target.value as ProjectFormDraft['status']})}><option value="">Choose status</option>{LIFECYCLE_STATUSES.map(value=><option key={value}>{value}</option>)}</select>:key==='description'?<HumanTextArea {...props} onChange={e=>onChange({...draft,description:e.target.value})}/>:key==='name'?<HumanTextInput {...props} autoFocus={prefix==='new-project'} onChange={e=>onChange({...draft,name:e.target.value})}/>:<input {...props} type="date" onChange={e=>onChange({...draft,[key]:e.target.value})}/>}</FormField>;
 };
 return <div className="form-grid project-form-fields">{field('name','Project name',true)}{field('description','Description')}{field('startDate','Start date',true)}{field('endDate','End date')}{field('status','Status',true)}</div>;
}
