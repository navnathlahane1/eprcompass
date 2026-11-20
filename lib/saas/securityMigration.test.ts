import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import launchPlans from './launchPlans.json';

const owner = '00000000-0000-0000-0000-000000000001';
const member = '00000000-0000-0000-0000-000000000002';
const org = '00000000-0000-0000-0000-000000000003';
const db = new PGlite();

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      'SELECT nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
    GRANT USAGE ON SCHEMA auth, public TO authenticated, anon, service_role;
    CREATE TYPE public.user_role AS ENUM ('admin','client','user_manager','recycler','cepc','partner','viewer');
    CREATE TABLE profiles(id uuid PRIMARY KEY, role user_role NOT NULL, full_name text, is_banned boolean DEFAULT false);
    INSERT INTO profiles VALUES ('${owner}','client','Owner',false), ('${member}','client','Member',false);
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY self_read ON profiles FOR SELECT USING(id=auth.uid());
    CREATE POLICY self_update ON profiles FOR UPDATE USING(id=auth.uid()) WITH CHECK(id=auth.uid());
    CREATE POLICY profiles_self_insert ON profiles FOR INSERT WITH CHECK(id=auth.uid());
    GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
    CREATE TABLE iam_audit_log(id uuid DEFAULT gen_random_uuid(), action text);
    ALTER TABLE iam_audit_log ENABLE ROW LEVEL SECURITY;
    CREATE POLICY iam_audit_log_insert ON iam_audit_log FOR INSERT WITH CHECK(true);
    GRANT ALL ON iam_audit_log TO authenticated, anon;
    CREATE TABLE payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), razorpay_order_id text UNIQUE,
      razorpay_payment_id text, amount_inr integer, status text DEFAULT 'created', updated_at timestamptz);
    INSERT INTO payments(razorpay_order_id,amount_inr) VALUES ('order_test',100);
    GRANT ALL ON payments TO service_role;
    CREATE TABLE partners(id uuid PRIMARY KEY, profile_id uuid);
    CREATE TABLE clients(id uuid PRIMARY KEY, profile_id uuid);
    CREATE TABLE recyclers(id uuid PRIMARY KEY, user_id uuid);
  `);
  for (const type of ['partner','client','cepc','recycler']) {
    const key = type === 'cepc' ? 'cepc_profile_id' : `${type}_id`;
    await db.exec(`
      CREATE TABLE ${type}_team_members(${key} uuid, user_id uuid, status text, member_role text DEFAULT 'VIEWER');
      CREATE TABLE ${type}_activity_log(${key} uuid, detail text);
      ALTER TABLE ${type}_activity_log ENABLE ROW LEVEL SECURITY;
      CREATE POLICY ${type === 'recycler' ? 'activity_log_read' : `${type}_activity_read`}
        ON ${type}_activity_log FOR SELECT USING(true);
      GRANT SELECT ON ${type}_team_members, ${type}_activity_log TO authenticated;
      INSERT INTO ${type}_team_members(${key},user_id,status) VALUES ('${org}','${member}','ACTIVE');
      INSERT INTO ${type}_activity_log VALUES ('${org}','private event');
    `);
  }
  await db.exec('GRANT SELECT ON partners, clients, recyclers TO authenticated;');
  await db.exec(readFileSync(resolve('../supabase/migrations/20260911102603_saas_security_foundation.sql'), 'utf8'));
  await db.exec(`INSERT INTO clients VALUES ('${org}','${owner}')`);
  await db.exec(readFileSync(resolve('../supabase/migrations/20260911103317_workspace_accounts.sql'), 'utf8'));
  await db.exec(readFileSync(resolve('../supabase/migrations/20260911103850_subscription_catalog.sql'), 'utf8'));
  await db.exec('CREATE TABLE epr_notification_queue(id uuid DEFAULT gen_random_uuid(),payload jsonb)');
  await db.exec(readFileSync(resolve('../supabase/migrations/20260911104454_sla_queue_deduplication.sql'), 'utf8'));
  await db.exec(readFileSync(resolve('../supabase/migrations/20260912043025_client_business_onboarding.sql'), 'utf8'));
  await db.exec(readFileSync(resolve('../supabase/migrations/20260912045527_enterprise_client_workspace.sql'), 'utf8'));
  await db.exec(`CREATE TABLE auth.users(id uuid PRIMARY KEY); INSERT INTO auth.users VALUES('${owner}'),('${member}')`);
  await db.exec(readFileSync(resolve('../supabase/migrations/20260912051220_unified_registration.sql'), 'utf8'));
  await db.exec(readFileSync(resolve('../supabase/migrations/20260912063524_registration_review.sql'), 'utf8'));
  await db.exec(`
    ALTER TABLE auth.users ADD COLUMN email text, ADD COLUMN email_confirmed_at timestamptz;
    ALTER TABLE profiles ADD COLUMN force_password_change boolean DEFAULT false;
    UPDATE auth.users SET email=CASE WHEN id='${owner}' THEN 'owner@example.com' ELSE 'member@example.com' END,email_confirmed_at=now();
    ALTER TABLE client_team_members ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ADD COLUMN email text, ADD COLUMN full_name text, ADD COLUMN invited_by uuid;
    ALTER TABLE client_activity_log ADD COLUMN actor_user_id uuid, ADD COLUMN action text;
    CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),profile_id uuid,message text);
  `);
  await db.exec(readFileSync(resolve('../supabase/migrations/20260912094818_assisted_growth_safeguards.sql'), 'utf8'));
}, 30000);
beforeEach(async () => { await db.exec('BEGIN'); });
afterEach(async () => { await db.exec('ROLLBACK'); });
afterAll(async () => { await db.close(); });

async function asMember() {
  await db.exec(`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = '${member}'`);
}

describe('assisted growth safeguards', () => {
  const token = 'a'.repeat(64);
  async function invite() {
    await db.query(`INSERT INTO client_team_invitations(client_id,email,full_name,member_role,token_hash,invited_by) VALUES($1,'member@example.com','Member','VIEWER',$2,$3)`, [org,token,owner]);
  }
  async function capacity(limit = 3) {
    await db.query(`INSERT INTO workspace_entitlements(workspace_id,resource,limit_value) SELECT id,'seats',$1 FROM workspace_accounts`, [limit]);
  }
  it('accepts an existing staff-provisioned identity without issuing another login', async () => {
    await db.exec('DELETE FROM client_team_members'); await capacity(); await invite(); await asMember();
    expect((await db.query('SELECT accept_client_team_invitation($1) AS client', [token])).rows[0]).toEqual({client:org});
    expect((await db.query('SELECT accept_client_team_invitation($1) AS client', [token])).rows[0]).toEqual({client:org});
    await db.exec('RESET ROLE');
    expect((await db.query('SELECT count(*)::int AS count FROM client_team_members')).rows[0]).toEqual({count:1});
    expect((await db.query("SELECT used_value FROM workspace_entitlements WHERE resource='seats'")).rows[0]).toEqual({used_value:2});
    expect((await db.query("SELECT count(*)::int AS count FROM service_journey_events WHERE event_name='invitation_accepted'")).rows[0]).toEqual({count:1});
  });
  it('requires staff provisioning rather than promoting a signup profile', async () => {
    await invite(); await db.query("UPDATE profiles SET role='viewer' WHERE id=$1", [member]); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/Staff must validate/);
  });
  it('rejects a different verified email', async () => {
    await invite(); await db.query("UPDATE auth.users SET email='other@example.com' WHERE id=$1", [member]); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/unavailable for this account/);
  });
  it('rejects expired invitations', async () => {
    await invite(); await db.exec("UPDATE client_team_invitations SET expires_at=now()-interval '1 hour'"); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/expired/);
  });
  it('rejects revoked invitations', async () => {
    await invite(); await db.exec("UPDATE client_team_invitations SET status='revoked'"); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/revoked/);
  });
  it('rejects a suspended inviter', async () => {
    await invite(); await db.query('UPDATE profiles SET is_banned=true WHERE id=$1',[owner]); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/Inviting account/);
  });
  it('does not bypass existing membership or suspension with a new invitation', async () => {
    await invite(); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/staff-assisted reassignment/);
  });
  it('enforces staff-assigned capacity including the owner seat', async () => {
    await db.exec('DELETE FROM client_team_members'); await capacity(1); await invite(); await asMember();
    await expect(db.query('SELECT accept_client_team_invitation($1)', [token])).rejects.toThrow(/Seat capacity exceeded/);
  });
  it('does not permit clients to write membership directly', async () => {
    await asMember(); await expect(db.query("INSERT INTO client_team_members(client_id,user_id,status) VALUES($1,$2,'ACTIVE')",[org,member])).rejects.toThrow(/permission denied/);
  });
  it('deduplicates scheduled notification retries at the database boundary', async () => {
    await db.exec("INSERT INTO notifications(message,delivery_key) VALUES('Reminder','key') ON CONFLICT(delivery_key) DO NOTHING; INSERT INTO notifications(message,delivery_key) VALUES('Reminder','key') ON CONFLICT(delivery_key) DO NOTHING");
    expect((await db.query('SELECT count(*)::int AS count FROM notifications')).rows[0]).toEqual({count:1});
  });
  it('keeps operational journey data private to reviewers', async () => {
    await db.query("INSERT INTO service_journey_events(user_id,event_name,entity_id) VALUES($1,'registration_submitted','sample')",[owner]); await asMember();
    expect((await db.query('SELECT * FROM service_journey_events')).rows).toEqual([]);
    await expect(db.query("INSERT INTO service_journey_events(user_id,event_name,entity_id) VALUES($1,'registration_submitted','forged')",[member])).rejects.toThrow(/permission denied/);
  });
  it('allows only the recipient to change reminder preferences', async () => {
    await asMember();
    await db.query("INSERT INTO service_reminder_preferences(user_id,cadence) VALUES($1,'weekly')",[member]);
    expect((await db.query('SELECT cadence FROM service_reminder_preferences')).rows).toEqual([{cadence:'weekly'}]);
    await expect(db.query("INSERT INTO service_reminder_preferences(user_id,cadence) VALUES($1,'off')",[owner])).rejects.toThrow(/row-level security/);
  });
  it('rejects invalid preference values', async () => {
    await asMember();
    await expect(db.query("INSERT INTO service_reminder_preferences(user_id,cadence) VALUES($1,'unbounded')",[member])).rejects.toThrow(/check constraint/);
  });
  it('does not expose aggregate journey metrics to customers', async () => {
    await asMember();
    await expect(db.query('SELECT service_journey_summary()')).rejects.toThrow(/Reviewer access required/);
  });
  it('prevents duplicate pending invitations to the same email', async () => {
    await invite();
    await expect(db.query(`INSERT INTO client_team_invitations(client_id,email,full_name,member_role,token_hash,invited_by) VALUES($1,'member@example.com','Member','VIEWER',$2,$3)`,[org,'b'.repeat(64),owner])).rejects.toThrow(/Revoke the existing invitation/);
  });
});

describe('enterprise authorization and workflows', () => {
  const entity = '00000000-0000-0000-0000-000000000010';
  let workspace: string;
  beforeEach(async () => {
    workspace = (await db.query<{ id:string }>('SELECT id FROM workspace_accounts')).rows[0].id;
    await db.query(`INSERT INTO enterprise_entities(id,workspace_id,kind,name,country_code,business_activity) VALUES($1,$2,'legal_entity','Company','IN','both')`, [entity,workspace]);
    await db.query(`INSERT INTO enterprise_entity_access VALUES($1,$2,'reviewer')`, [entity,member]);
  });
  async function command(action: string, data: Record<string,unknown> = {}) {
    return (await db.query<{ id:string }>('SELECT enterprise_command($1,$2::jsonb) AS id',[action, JSON.stringify({ entity_id:entity, ...data })])).rows[0].id;
  }
  async function ownerSession() {
    await db.exec(`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='${owner}'`);
  }
  async function draft() {
    await ownerSession();
    return command('create_submission',{ title:'Annual quantities',reporting_period:'2026-03-31',details:'Submitted quantities for internal review' });
  }
  it('supports independent review with an append-only activity record', async () => {
    const id = await draft();
    await command('submit',{ submission_id:id });
    await asMember();
    await command('approve',{ submission_id:id, comment:'Checked against source records' });
    expect((await db.query('SELECT status,reviewed_by FROM enterprise_submissions')).rows).toEqual([{ status:'approved', reviewed_by:member }]);
    expect((await db.query('SELECT action FROM enterprise_audit_events ORDER BY id')).rows).toEqual([{ action:'create_submission' },{ action:'submit' },{ action:'approve' }]);
  });
  it('versions products and retains the exact referenced version after later changes', async () => {
    await ownerSession();
    const input = { sku:'SKU-1',name:'Container',material:'Plastic',weight_grams:'12.5',effective_date:'2026-01-01' };
    const first = await command('create_product', input);
    const record = await command('create_submission',{ title:'Product review',reporting_period:'2026-03-31',details:'Source quantities',product_id:first });
    await command('create_product',{ ...input,weight_grams:'13',effective_date:'2026-04-01' });
    expect((await db.query('SELECT version FROM enterprise_products ORDER BY version')).rows).toEqual([{ version:1 },{ version:2 }]);
    expect((await db.query('SELECT product_id FROM enterprise_submissions WHERE id=$1',[record])).rows).toEqual([{ product_id:first }]);
  });
  it('prevents mutation of a referenced product version', async () => {
    await ownerSession();
    await expect(db.exec('UPDATE enterprise_products SET weight_grams=1')).rejects.toThrow(/permission denied/);
  });
  it('rejects self approval even by the organisation owner', async () => {
    const id = await draft(); await command('submit',{ submission_id:id });
    await expect(command('approve',{ submission_id:id,comment:'Self approved' })).rejects.toThrow(/Independent reviewer/);
  });
  it('does not expose entities without an explicit grant to members', async () => {
    await db.exec('DELETE FROM enterprise_entity_access');
    await asMember();
    expect((await db.query('SELECT * FROM enterprise_entities')).rows).toHaveLength(0);
  });
  it('revokes entity reads immediately on workspace suspension', async () => {
    await db.exec("UPDATE client_team_members SET status='SUSPENDED'");
    await asMember();
    expect((await db.query('SELECT * FROM enterprise_entities')).rows).toHaveLength(0);
  });
  it('rejects direct status updates outside the approval command', async () => {
    await draft();
    await expect(db.exec("UPDATE enterprise_submissions SET status='approved'")).rejects.toThrow(/permission denied/);
  });
  it('rejects forged audit records', async () => {
    await ownerSession();
    await expect(db.query('INSERT INTO enterprise_audit_events(entity_id,actor_id,action) VALUES($1,$2,$3)',[entity,owner,'approved'])).rejects.toThrow(/permission denied/);
  });
  it('does not let reviewers grant themselves preparer access', async () => {
    await asMember();
    await expect(command('grant_access',{ user_id:member,role:'preparer' })).rejects.toThrow(/Owner required/);
  });
  it('rejects a review of a draft', async () => {
    const id=await draft(); await asMember();
    await expect(command('reject',{ submission_id:id,comment:'Too early' })).rejects.toThrow(/Independent reviewer/);
  });
  it('does not allow another organisation to read or mutate an entity', async () => {
    await db.exec(`INSERT INTO profiles(id,role) VALUES('00000000-0000-0000-0000-000000000099','client');
      SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000099'`);
    expect((await db.query('SELECT * FROM enterprise_entities')).rows).toHaveLength(0);
    await expect(command('create_submission',{ title:'Forged',reporting_period:'2026-03-31',details:'test' })).rejects.toThrow(/Entity access required/);
  });
  it('atomically meters new legal entities and countries', async () => {
    await db.query(`INSERT INTO workspace_subscriptions(workspace_id,plan_name,status,current_period_end) VALUES($1,'Enterprise test','active',now()+interval '1 month')`,[workspace]);
    await db.query(`INSERT INTO workspace_entitlements(workspace_id,resource,limit_value) VALUES($1,'companies',2),($1,'countries',2)`,[workspace]);
    await ownerSession();
    await command('create_entity',{ workspace_id:workspace,kind:'legal_entity',name:'New company',country_code:'DE',business_activity:'manufacturer' });
    expect((await db.query('SELECT resource,used_value FROM workspace_entitlements ORDER BY resource')).rows).toEqual([{ resource:'companies',used_value:1 },{ resource:'countries',used_value:1 }]);
  });
  it('blocks entity creation when no subscription capacity is configured', async () => {
    await ownerSession();
    await expect(command('create_entity',{ workspace_id:workspace,kind:'legal_entity',name:'Company',country_code:'DE',business_activity:'manufacturer' })).rejects.toThrow(/Entitlement not configured/);
  });
});

describe('database security regression tests', () => {
  it('reviews a pending registration atomically without granting a role',async()=>{
    await db.exec(`INSERT INTO profiles(id,role) VALUES('00000000-0000-0000-0000-000000000088','admin');
      INSERT INTO registration_profiles(user_id,full_name,purpose,company_name,country) VALUES('${member}','Member','agency','Agency','India');
      SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000088'`);
    await db.query("SELECT review_registration($1,'approved','Business details checked')",[member]);
    expect((await db.query('SELECT status FROM registration_profiles')).rows).toEqual([{status:'approved'}]);
    expect((await db.query('SELECT decision FROM registration_review_events')).rows).toEqual([{decision:'approved'}]);
    await db.exec('RESET ROLE');
    expect((await db.query('SELECT role FROM profiles WHERE id=$1',[member])).rows).toEqual([{role:'client'}]);
  });
  it('blocks ordinary users from reviewing their registration',async()=>{
    await asMember();
    await expect(db.query("SELECT review_registration($1,'approved','Self approval')",[member])).rejects.toThrow(/Independent reviewer/);
  });
  it('blocks suspended administrators from reviewing',async()=>{
    await db.exec(`INSERT INTO profiles(id,role,is_banned) VALUES('00000000-0000-0000-0000-000000000088','admin',true);
      SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000088'`);
    await expect(db.query("SELECT review_registration($1,'approved','Review')",[member])).rejects.toThrow(/Independent reviewer/);
  });
  it('cannot overwrite an existing review',async()=>{
    await db.exec(`INSERT INTO profiles(id,role) VALUES('00000000-0000-0000-0000-000000000088','admin');
      INSERT INTO registration_profiles(user_id,full_name,purpose,company_name,country,status) VALUES('${member}','Member','agency','Agency','India','approved');
      SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000088'`);
    await expect(db.query("SELECT review_registration($1,'rejected','Changed mind')",[member])).rejects.toThrow(/no longer pending/);
  });
  it('allows a registration without granting any portal role',async()=>{
    await asMember();
    await db.query(`INSERT INTO registration_profiles(user_id,full_name,purpose,company_name,country) VALUES($1,'Member','agency','Agency','India')`,[member]);
    expect((await db.query('SELECT status FROM registration_profiles')).rows).toEqual([{status:'pending'}]);
  });
  it('blocks self-approval of registration',async()=>{
    await asMember();
    await expect(db.query(`INSERT INTO registration_profiles(user_id,full_name,purpose,company_name,country,status) VALUES($1,'Member','agency','Agency','India','approved')`,[member])).rejects.toThrow(/permission denied/);
  });
  it('blocks registration on behalf of another user',async()=>{
    await asMember();
    await expect(db.query(`INSERT INTO registration_profiles(user_id,full_name,purpose,company_name,country) VALUES($1,'Owner','agency','Agency','India')`,[owner])).rejects.toThrow(/row-level security/);
  });
  it('keeps existing company activity unset and enforces allowed activity values', async () => {
    const { rows } = await db.query(`SELECT business_activity, onboarding_details FROM clients WHERE id = '${org}'`);
    expect(rows).toEqual([{ business_activity: null, onboarding_details: {} }]);
    await db.exec(`UPDATE clients SET business_activity = 'both' WHERE id = '${org}'`);
    await expect(db.exec(`UPDATE clients SET business_activity = 'enterprise' WHERE id = '${org}'`)).rejects.toThrow();
  });
  it('denies self-promotion even with UPDATE grants', async () => {
    await asMember();
    await expect(db.exec(`UPDATE profiles SET role='admin' WHERE id='${member}'`)).rejects.toThrow(/Security fields/);
  });
  it('denies self-unbanning', async () => {
    await db.exec(`UPDATE profiles SET is_banned=true WHERE id='${member}'`);
    await asMember();
    await expect(db.exec(`UPDATE profiles SET is_banned=false WHERE id='${member}'`)).rejects.toThrow(/Security fields/);
  });
  it('permits ordinary profile edits', async () => {
    await asMember();
    await db.exec(`UPDATE profiles SET full_name='New name' WHERE id='${member}'`);
    expect((await db.query('SELECT full_name FROM profiles')).rows).toEqual([{ full_name: 'New name' }]);
  });
  it('returns newer roles from the canonical helper', async () => {
    await db.exec(`UPDATE profiles SET role='user_manager' WHERE id='${member}'`);
    await asMember();
    expect((await db.query('SELECT current_user_role() AS role')).rows).toEqual([{ role: 'user_manager' }]);
  });
  it('denies fabricated audit events', async () => {
    await asMember();
    await expect(db.exec("INSERT INTO iam_audit_log(action) VALUES ('forged')")).rejects.toThrow(/permission denied/);
  });
  it('isolates workspace accounts and prevents member edits', async () => {
    await db.exec("INSERT INTO clients VALUES ('00000000-0000-0000-0000-000000000004',null)");
    await asMember();
    expect((await db.query('SELECT * FROM list_my_workspace_accounts()')).rows).toHaveLength(1);
    expect((await db.query("UPDATE workspace_accounts SET name='stolen' RETURNING id")).rows).toHaveLength(0);
  });
  it('immediately removes suspended membership from workspace access', async () => {
    await db.exec("UPDATE client_team_members SET status='SUSPENDED'");
    await asMember();
    expect((await db.query('SELECT * FROM workspace_accounts')).rows).toHaveLength(0);
  });
  it('allows owner settings updates and derives the audit actor', async () => {
    await db.exec(`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='${owner}'`);
    await db.exec("UPDATE workspace_accounts SET name='Company account'");
    expect((await db.query('SELECT actor_id,action FROM workspace_audit_events')).rows).toEqual([{ actor_id: owner, action: 'settings_updated' }]);
  });
  it('prevents rebinding a workspace to a different company', async () => {
    await db.exec(`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='${owner}'`);
    await expect(db.exec(`UPDATE workspace_accounts SET entity_id='${member}'`)).rejects.toThrow(/permission denied/);
  });
  it('enforces quotas and records retry-safe usage', async () => {
    const { rows } = await db.query<{ id: string }>('SELECT id FROM workspace_accounts');
    const id = rows[0].id;
    await db.exec(`INSERT INTO workspace_subscriptions(workspace_id,plan_name,status,current_period_end) VALUES('${id}','Test','active',now()+interval '1 month');
      INSERT INTO workspace_entitlements(workspace_id,resource,limit_value,used_value) VALUES('${id}','ai_requests',10,0); SET LOCAL ROLE service_role;`);
    const sql = `SELECT consume_workspace_usage('${id}','ai_requests',6,'usage1') AS used`;
    expect((await db.query(sql)).rows).toEqual([{ used: 6 }]);
    expect((await db.query(sql)).rows).toEqual([{ used: 6 }]);
    await expect(db.query(`SELECT consume_workspace_usage('${id}','ai_requests',6,'usage2')`)).rejects.toThrow(/limit exceeded/);
  });
  it('keeps duplicate SLA invocations from creating repeated alerts', async () => {
    const sql = "INSERT INTO epr_notification_queue(dedupe_key) VALUES('warning:filing:due') ON CONFLICT(dedupe_key) DO NOTHING";
    await db.exec(sql); await db.exec(sql);
    expect((await db.query('SELECT * FROM epr_notification_queue')).rows).toHaveLength(1);
  });
  it('activates limits from the server catalog and ignores old subscription events', async () => {
    const { rows } = await db.query<{ id: string }>('SELECT id FROM workspace_accounts');
    const id = rows[0].id;
    await db.exec(`INSERT INTO workspace_subscriptions(workspace_id,plan_name,plan_code,provider_subscription_id,provider_plan_id,status,current_period_end)
      VALUES('${id}','Importer','importer','sub_test','plan_test','pending',now()); SET LOCAL ROLE service_role;`);
    const event = (key: string, time: string, status: string) => `SELECT apply_workspace_subscription_event('sub_test','${key}','${time}','${status}','2026-09-01','2026-10-01','plan_test') AS changed`;
    expect((await db.query(event('active','2026-09-02','active'))).rows).toEqual([{ changed: true }]);
    expect((await db.query("SELECT limit_value FROM workspace_entitlements WHERE resource='countries'")).rows).toEqual([{ limit_value: 1 }]);
    expect((await db.query(event('old','2026-09-01','pending'))).rows).toEqual([{ changed: false }]);
    await db.query(event('cancel','2026-09-03','canceled'));
    expect((await db.query(event('late','2026-09-04','active'))).rows).toEqual([{ changed: false }]);
    expect((await db.query('SELECT status FROM workspace_subscriptions')).rows).toEqual([{ status: 'canceled' }]);
  });
  it('rejects usage on an expired subscription', async () => {
    const { rows } = await db.query<{ id: string }>('SELECT id FROM workspace_accounts');
    const id = rows[0].id;
    await db.exec(`INSERT INTO workspace_subscriptions(workspace_id,plan_name,status,current_period_end) VALUES('${id}','Test','active',now()-interval '1 day');
      INSERT INTO workspace_entitlements(workspace_id,resource,limit_value,used_value) VALUES('${id}','exports',10,0);`);
    await expect(db.query(`SELECT consume_workspace_usage('${id}','exports',1,'request')`)).rejects.toThrow(/Subscription inactive/);
  });
  for (const type of ['partner','client','cepc','recycler']) {
    it(`revokes ${type} activity reads upon suspension`, async () => {
      await asMember();
      expect((await db.query(`SELECT * FROM ${type}_activity_log`)).rows).toHaveLength(1);
      await db.exec(`RESET ROLE; UPDATE ${type}_team_members SET status='SUSPENDED'`);
      await asMember();
      expect((await db.query(`SELECT * FROM ${type}_activity_log`)).rows).toHaveLength(0);
    });
  }
  it('denies capture RPC access to normal users', async () => {
    await asMember();
    await expect(db.query("SELECT record_captured_payment('evt','order_test','pay_test',10000,'INR')")).rejects.toThrow(/permission denied/);
  });
  it('records capture once and handles duplicate delivery', async () => {
    await db.exec('SET LOCAL ROLE service_role');
    const sql = "SELECT record_captured_payment('evt','order_test','pay_test',10000,'INR') AS changed";
    expect((await db.query(sql)).rows).toEqual([{ changed: true }]);
    expect((await db.query(sql)).rows).toEqual([{ changed: false }]);
    expect((await db.query('SELECT status FROM payments')).rows).toEqual([{ status: 'captured' }]);
    expect((await db.query('SELECT * FROM payment_events')).rows).toHaveLength(1);
  });
  it('rejects mismatched capture amounts atomically', async () => {
    await expect(db.query("SELECT record_captured_payment('evt','order_test','pay_test',1,'INR')")).rejects.toThrow(/mismatch/);
  });
  it('rejects unknown orders', async () => {
    await expect(db.query("SELECT record_captured_payment('evt','order_missing','pay_test',10000,'INR')")).rejects.toThrow(/Unknown local order/);
  });
  it('keeps public launch prices consistent with the database catalog', async () => {
    const { rows } = await db.query('SELECT code,name,monthly_paise,annual_paise,currency,limits FROM saas_plans ORDER BY sort_order');
    expect(rows).toEqual(launchPlans);
  });
  it('resets metered allowances monthly even on annual subscriptions', async () => {
    const { rows } = await db.query<{ id: string }>('SELECT id FROM workspace_accounts');
    const id = rows[0].id;
    await db.exec(`INSERT INTO workspace_subscriptions(workspace_id,plan_name,status,current_period_end) VALUES('${id}','Annual','active',now()+interval '1 year');
      INSERT INTO workspace_entitlements(workspace_id,resource,limit_value,used_value,usage_period_start) VALUES('${id}','ai_requests',10,10,'2020-01-01');`);
    expect((await db.query(`SELECT consume_workspace_usage('${id}','ai_requests',1,'new-month') AS used`)).rows).toEqual([{ used: 1 }]);
  });
});
