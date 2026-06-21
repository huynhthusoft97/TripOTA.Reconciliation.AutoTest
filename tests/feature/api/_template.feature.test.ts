import { describe, it, expect } from 'vitest';
// import { authConfig } from '../../../lib/api-config.js';
// import { MasterDataAirlinesApi /* hoặc *Api phù hợp */ } from '../../../sdk/index.js';

// [FEATURE] TEMPLATE — copy file này & điền cho API 1B của sprint đang làm. CHƯA gate release.
// Pattern: const api = new <XxxApi>(await authConfig());  → res = await api.<method>(...)  → expect(res.data...).
// Khi ổn định + release → promote sang tests/regression/api/1b/. Bỏ `.skip` khi viết thật.
describe.skip('[FEATURE] 1B — <tên API>', () => {
  it('TODO: <kịch bản> (US-1B-0x)', async () => {
    // const api = new MasterDataAirlinesApi(await authConfig());
    // const res = await api.searchAirlines({ search: '...' });
    // expect((res.data ?? []).map((x) => x.name)).toContain('...');
    expect(true).toBe(true);
  });
});
