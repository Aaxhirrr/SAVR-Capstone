import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, ApiError } from '../src/services/api.ts';
import { SavrService } from '../src/services/savr.ts';
import { parseProfile, parseList } from '../src/models/domain.ts';
import { sendConversation } from '../src/services/conversation.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const rawProfile = {
  email: 'qa@example.test',
  first_name: 'QA',
  address: {
    street: '12 Main',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5V 1A1',
    phoneNumber: '123',
  },
  dietaryRestrictions: ['Vegetarian'],
  brandPreferences: { liked: { Dairy: 'Test brand' }, disliked: {} },
};
const rawList = {
  id: 'qa/1',
  name: 'QA list',
  items: [{ name: 'Apples', quantity: '2' }],
  chat_session_id: 'linked-session',
};
const make = (fetcher: typeof fetch) =>
  new SavrService(
    new ApiClient(
      'https://example.test/api',
      'test-token',
      undefined,
      fetcher,
    ),
  );

test('S8 profile reads published camelCase fields and preserves complete address', () => {
  const p = parseProfile(rawProfile);
  assert.deepEqual(p.dietary, ['Vegetarian']);
  assert.equal(p.likedBrands.Dairy, 'Test brand');
  assert.equal(p.city, 'Toronto');
  assert.equal(p.postalCode, 'M5V 1A1');
});
test('S8 empty current preferences override legacy cached-looking fields', () => {
  const p = parseProfile({
    ...rawProfile,
    dietaryRestrictions: [],
    dietary_restrictions: ['Stale'],
    brandPreferences: {},
    brand_preferences: { liked: { Dairy: 'Stale' } },
  });
  assert.deepEqual(p.dietary, []);
  assert.deepEqual(p.likedBrands, {});
});
test('S8 saving profile sends published keys and returns authoritative response', async () => {
  const service = make(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.dietaryRestrictions, ['Vegetarian']);
    assert.deepEqual(body.address, rawProfile.address);
    assert.equal(body.dietary_restrictions, undefined);
    assert.equal(body.phone, undefined);
    return json({ ...rawProfile, first_name: 'Server normalized' });
  });
  assert.equal(
    (await service.saveProfile(parseProfile(rawProfile))).firstName,
    'Server normalized',
  );
});
test('S8 incomplete address rejected before making a request', async () => {
  let calls = 0;
  const service = make(async () => {
    calls++;
    return json(rawProfile);
  });
  await assert.rejects(
    service.saveProfile({ ...parseProfile(rawProfile), city: '' }),
    /city, province and postal code/,
  );
  assert.equal(calls, 0);
});
test('S8 no address sends null and cleared preferences are sent explicitly', async () => {
  const service = make(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.address, null);
    assert.deepEqual(body.dietaryRestrictions, []);
    return json({ ...rawProfile, address: null, dietaryRestrictions: [] });
  });
  assert.equal(
    (
      await service.saveProfile({
        ...parseProfile(rawProfile),
        address: '',
        dietary: [],
      })
    ).address,
    '',
  );
});
test('S8 list retains the backend chat_session_id', () => {
  assert.equal(parseList(rawList).sessionId, 'linked-session');
});
test('S8 rename persists via PUT and uses the server result', async () => {
  const service = make(async (url, init) => {
    assert.equal(
      String(url),
      'https://example.test/api/grocery-lists/qa%2F1',
    );
    assert.equal(init?.method, 'PUT');
    assert.deepEqual(JSON.parse(String(init?.body)), { name: 'Renamed' });
    return json({ ...rawList, name: 'Renamed' });
  });
  assert.equal(
    (await service.renameList('qa/1', ' Renamed ')).name,
    'Renamed',
  );
});
test('S8 failed rename is not reported as success', async () => {
  await assert.rejects(
    make(async () => json({ detail: 'Unavailable' }, 503)).renameList(
      'qa/1',
      'New',
    ),
    ApiError,
  );
});
test('S8 flyer additions use item names even when selection spans pages', async () => {
  const service = make(async (_url, init) => {
    assert.deepEqual(JSON.parse(String(init?.body)), {
      item_names: ['Apples', 'Milk'],
      list_id: 'qa/1',
    });
    return json({ list_id: 'qa/1' });
  });
  await service.addDeals(['Apples', 'Milk'], 'qa/1');
});
test('S8 account deletion supplies explicit API confirmation without a live deletion', async () => {
  await make(async (_url, init) => {
    assert.deepEqual(JSON.parse(String(init?.body)), {
      confirmationText: 'DELETE',
    });
    return new Response(null, { status: 204 });
  }).deleteAccount();
});
test('S8 list context accompanies messages even when a session already exists', async () => {
  await sendConversation(
    async (text, id) => {
      assert.match(text, /List ID: qa\/1/);
      assert.match(text, /Apples \(2\)/);
      assert.equal(id, 'linked-session');
      return { sessionId: id!, text: 'Two apples.' };
    },
    { sessionId: 'linked-session', messages: [] },
    'What is on this list?',
    parseList(rawList),
  );
});
test('S8 offline request produces an actionable connection error', async () => {
  await assert.rejects(
    new ApiClient('https://example.test', undefined, undefined, async () => {
      throw new TypeError('Network failed');
    }).request('lists'),
    /Check your connection/,
  );
});
test('S8 timeout aborts the transport and settles with a retry message', async () => {
  const api = new ApiClient(
    'https://example.test',
    undefined,
    undefined,
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new Error('aborted')),
          { once: true },
        );
      }),
  );
  await assert.rejects(api.request('lists', { timeoutMs: 10 }), /timed out/);
});
test('S8 external cancellation is distinguished from timeout', async () => {
  const controller = new AbortController();
  const api = new ApiClient(
    'https://example.test',
    undefined,
    undefined,
    async (_url, init) => {
      controller.abort();
      assert.equal(init?.signal?.aborted, true);
      throw new Error('aborted');
    },
  );
  await assert.rejects(
    api.request('lists', { signal: controller.signal }),
    /cancelled/,
  );
});
test('S8 HTML success and malformed list shapes fail safely', async () => {
  await assert.rejects(
    new ApiClient(
      'https://example.test',
      undefined,
      undefined,
      async () => new Response('<html>bad gateway</html>'),
    ).request('lists'),
    /unreadable response/,
  );
  await assert.rejects(
    make(async () => json({ lists: [] })).lists(),
    /Unexpected server response/,
  );
});
test('S8 rejected profile save keeps the caller draft available for retry', async () => {
  const draft = parseProfile(rawProfile);
  await assert.rejects(
    make(async () =>
      json({ detail: [{ msg: 'Address invalid' }] }, 422),
    ).saveProfile(draft),
    /Address invalid/,
  );
  assert.deepEqual(draft.dietary, ['Vegetarian']);
});
