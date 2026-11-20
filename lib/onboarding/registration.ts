import { isBusinessActivity } from './clientSetup';
export const PURPOSES = [
  { value:'company', label:'Manage my company compliance' },
  { value:'agency', label:'Manage compliance for clients' },
  { value:'recycler', label:'Offer recycling services' },
  { value:'referral', label:'Refer businesses' },
  { value:'learner', label:'Learn or get certified' },
] as const;
export function parseRegistration(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Enter your registration details');
  const b=value as Record<string,unknown>;
  if (!PURPOSES.some(p=>p.value===b.purpose)) throw new Error('Select your purpose');
  const text=(key:string,max:number,required=true)=> {
    if (typeof b[key]!=='string' || (required && !b[key].trim()) || b[key].length>max) throw new Error(`Enter a valid ${key.replaceAll('_',' ')}`);
    return b[key].trim();
  };
  if (b.purpose==='company' && !isBusinessActivity(b.business_activity)) throw new Error('Select Importer, Manufacturer, or Both');
  return { full_name:text('full_name',160),purpose:b.purpose as string,company_name:text('company_name',160,b.purpose!=='learner'),country:text('country',100),business_activity:b.purpose==='company' ? b.business_activity as string : null };
}
