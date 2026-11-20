import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const {getUser,maybeSingle,clientQuery,membershipQuery,from,eq}=vi.hoisted(()=>({getUser:vi.fn(),maybeSingle:vi.fn(),clientQuery:vi.fn(),membershipQuery:vi.fn(),from:vi.fn(),eq:vi.fn()}));
vi.mock('@/lib/supabase/createServerComponentClient',()=>({createServerComponentClient:async()=>({auth:{getUser},from})}));
import {GET} from '../../app/api/auth/destination/route';
beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv('SUPER_ADMIN_EMAILS','');
  vi.stubEnv('NEXT_PUBLIC_SUPER_ADMIN_EMAILS','');
  getUser.mockResolvedValue({data:{user:{id:'user',user_metadata:{role:'admin'}}}});
  maybeSingle.mockResolvedValue({data:null,error:null});
  clientQuery.mockResolvedValue({data:{id:'company'},error:null});
  membershipQuery.mockResolvedValue({data:null,error:null});
  from.mockImplementation((table:string)=>{
    const chain={select:vi.fn(),eq:vi.fn(),maybeSingle:table==='profiles'?maybeSingle:table==='clients'?clientQuery:membershipQuery};
    chain.select.mockReturnValue(chain);
    chain.eq.mockImplementation((...args)=>{eq(table,...args);return chain;});
    return chain;
  });
});
afterEach(()=>{vi.unstubAllEnvs();});
describe('shared login routing',()=>{
  it('requires authentication before profile access',async()=>{getUser.mockResolvedValue({data:{user:null}});expect((await GET()).status).toBe(401);expect(from).not.toHaveBeenCalled();});
  it('routes a new identity to onboarding, ignoring editable role metadata',async()=>{expect(await (await GET()).json()).toEqual({destination:'/welcome'});});
  it('routes provisioned partners automatically',async()=>{maybeSingle.mockResolvedValue({data:{role:'partner'},error:null});expect(await(await GET()).json()).toEqual({destination:'/partner/dashboard'});});
  it('routes client accounts to the client dashboard',async()=>{maybeSingle.mockResolvedValue({data:{role:'client'},error:null});expect(await(await GET()).json()).toEqual({destination:'/portal/dashboard'});});
  it('routes recycler accounts to the recycler dashboard',async()=>{maybeSingle.mockResolvedValue({data:{role:'recycler'},error:null});expect(await(await GET()).json()).toEqual({destination:'/recycler-portal/dashboard'});});
  it('routes standalone viewers to workspace selection without a client login loop',async()=>{maybeSingle.mockResolvedValue({data:{role:'viewer'},error:null});expect(await(await GET()).json()).toEqual({destination:'/account/workspaces'});});
  it('routes viewer password changes to an existing generic password form',async()=>{maybeSingle.mockResolvedValue({data:{role:'viewer',force_password_change:true},error:null});expect(await(await GET()).json()).toEqual({destination:'/portal/change-password'});});
  it('routes clients without a workspace to account setup',async()=>{maybeSingle.mockResolvedValue({data:{role:'client'},error:null});clientQuery.mockResolvedValue({data:null,error:null});expect(await(await GET()).json()).toEqual({destination:'/welcome'});});
  it('accepts active team membership even when owner-only RLS hides the embedded company',async()=>{maybeSingle.mockResolvedValue({data:{role:'client'},error:null});clientQuery.mockResolvedValue({data:null,error:null});membershipQuery.mockResolvedValue({data:{client_id:'team-company'},error:null});expect(await(await GET()).json()).toEqual({destination:'/portal/dashboard'});expect(eq).toHaveBeenCalledWith('client_team_members','user_id','user');expect(eq).toHaveBeenCalledWith('client_team_members','status','ACTIVE');});
  it('does not accept a membership without a company',async()=>{maybeSingle.mockResolvedValue({data:{role:'client'},error:null});clientQuery.mockResolvedValue({data:null,error:null});membershipQuery.mockResolvedValue({data:{client:null},error:null});expect(await(await GET()).json()).toEqual({destination:'/welcome'});});
  it.each(['clients','client_team_members'])('fails closed on %s query errors',async(table)=>{maybeSingle.mockResolvedValue({data:{role:'client'},error:null});clientQuery.mockResolvedValue({data:null,error:null});(table==='clients'?clientQuery:membershipQuery).mockResolvedValue({data:null,error:{message:'unavailable'}});expect((await GET()).status).toBe(503);});
  it('requires client password changes before workspace lookup',async()=>{maybeSingle.mockResolvedValue({data:{role:'client',force_password_change:true},error:null});expect(await(await GET()).json()).toEqual({destination:'/portal/change-password'});expect(clientQuery).not.toHaveBeenCalled();});
  it('honors the configured super-admin email override',async()=>{vi.stubEnv('NEXT_PUBLIC_SUPER_ADMIN_EMAILS','person@example.com');getUser.mockResolvedValue({data:{user:{id:'user',email:'person@example.com'}}});maybeSingle.mockResolvedValue({data:{role:'client'},error:null});expect(await(await GET()).json()).toEqual({destination:'/admin/dashboard'});});
  it('blocks banned accounts',async()=>{maybeSingle.mockResolvedValue({data:{role:'partner',is_banned:true},error:null});expect((await GET()).status).toBe(403);});
  it('routes required password changes before dashboard access',async()=>{maybeSingle.mockResolvedValue({data:{role:'recycler',force_password_change:true},error:null});expect(await(await GET()).json()).toEqual({destination:'/recycler-portal/change-password'});});
  it('fails closed on profile query errors',async()=>{maybeSingle.mockResolvedValue({data:null,error:{message:'unavailable'}});expect((await GET()).status).toBe(503);});
});
