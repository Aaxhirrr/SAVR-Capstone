// Run manually with a dedicated test token and disposable Sprint 8 QA list.
// Never commit the token or include it in a command saved in shell history.
import { ApiClient } from '../../../SavrExpo/SAVR/src/services/api.ts';
import { SavrService } from '../../../SavrExpo/SAVR/src/services/savr.ts';
const token = process.env.SAVR_QA_TOKEN;
const listId = process.env.SAVR_QA_LIST_ID;
if (!token || !listId) throw new Error('Set SAVR_QA_TOKEN and SAVR_QA_LIST_ID for a disposable Sprint 8 QA list.');
const service = new SavrService(new ApiClient('https://savr.app/api', token));
const target = await service.list(listId);
if (!target.name.startsWith('Sprint 8 QA')) throw new Error('Refusing mutations: choose a disposable list whose name begins Sprint 8 QA.');
const results: { flow: string; status: string; reason?: string }[] = [];
const checks: [string, () => Promise<unknown>][] = [
  ['lists', () => service.lists()],
  ['list-detail', () => service.list(listId)],
  ['stores', () => service.stores()],
  ['flyers', () => service.deals('walmart')],
  ['profile', () => service.profile()],
  ['rename-persistence', async () => {
    await service.renameList(listId, 'Sprint 8 QA Verified');
    if ((await service.list(listId)).name !== 'Sprint 8 QA Verified') throw new Error('Name did not persist.');
  }],
  ['profile-save-roundtrip', async () => {
    const before = await service.profile();
    const after = await service.saveProfile(before);
    if (JSON.stringify(after.dietary) !== JSON.stringify(before.dietary)) throw new Error('Preference mismatch.');
  }],
  ['flyer-addition-readback', async () => {
    const before = await service.list(listId);
    const name = ['Bananas', 'Eggs', 'Bread', 'Tomatoes', 'Carrots', 'Yogurt'].find(candidate => !before.items.some(item => item.name.toLowerCase().includes(candidate.toLowerCase())));
    if (!name) throw new Error('Use a fresh disposable QA list for this mutation check.');
    await service.addDeals([name], listId);
    if (!(await service.list(listId)).items.some(item => item.name.toLowerCase().includes(name.toLowerCase()))) throw new Error('New item missing on readback.');
  }],
];
for (const [flow, check] of checks) {
  try { await check(); results.push({ flow, status: 'PASS' }); }
  catch (error) { results.push({ flow, status: 'FAIL', reason: error instanceof Error ? error.message : 'Unknown error' }); }
}
console.log(JSON.stringify({ execution: 'Node using actual Expo service classes; not native UI evidence', recordedAt: new Date().toISOString(), results }, null, 2));
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
