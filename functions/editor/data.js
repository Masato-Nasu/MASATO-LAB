import {ensurePhiCode} from '../_phi-code.js';
import {requireAdmin} from '../_admin-access.js';
import {ensureAdmiralIndustries} from '../_admiral-industries.js';
import {readData,projectData,json} from '../_secret-room.js';

export async function onRequestGet({request,env}) {
  const denied = await requireAdmin(request,env);
  if (denied) return denied;
  try { return json(ensurePhiCode(ensureAdmiralIndustries(projectData(await readData(env),'editor')))); }
  catch { return json({error:'temporarily_unavailable'},503); }
}
