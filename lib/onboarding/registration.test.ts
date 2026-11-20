import {describe,it,expect} from 'vitest';
import {parseRegistration} from './registration';
const valid={full_name:'Person',purpose:'company',company_name:'Business',country:'India',business_activity:'both'};
describe('public registration boundaries',()=>{
  it('keeps activity independent from access',()=>{expect(parseRegistration({...valid,role:'admin',status:'approved',user_id:'other'})).toEqual(valid);});
  it.each(['admin','manager','staff','owner'])('rejects privileged purpose %s',purpose=>{expect(()=>parseRegistration({...valid,purpose})).toThrow();});
  it('requires a business activity for companies',()=>{expect(()=>parseRegistration({...valid,business_activity:null})).toThrow();});
  it('does not require a company for learners',()=>{expect(parseRegistration({...valid,purpose:'learner',company_name:''}).business_activity).toBeNull();});
  it.each(['agency','recycler','referral'])('accepts %s without assigning a role',purpose=>{expect(parseRegistration({...valid,purpose})).not.toHaveProperty('role');});
});
