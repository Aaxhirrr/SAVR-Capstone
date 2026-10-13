import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, ApiError } from '../src/services/api.ts';
import { SavrService } from '../src/services/savr.ts';
import {
  parseChat,
  parseDeals,
  parseList,
  parseProfile,
  parseSession,
  parseStores,
} from '../src/models/domain.ts';
import { sendConversation } from '../src/services/conversation.ts';
import { restoreAccount } from '../src/services/session-lifecycle.ts';
import type { Profile } from '../src/models/domain.ts';

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
const profile: Profile = {
  firstName: 'Pat',
  lastName: '',
  email: 'pat@example.test',
  phone: '',
  address: '',
  dietary: [],
  likedBrands: {},
  dislikedBrands: {},
};
const session = { accessToken: 'test-token', userId: '42' };
const list = parseList({
  id: 'list/1',
  name: 'Weekly shop',
  items: [{ name: 'Apples', quantity: '2 lbs', meal: 'Lunch' }],
  createdAt: '2026-09-29T10:00:00Z',
  is_active: true,
  session_id: 'old-session',
  savings_amount: 0,
  least_expensive_store_price: 12.99,
});

test('login uses multipart credentials without overriding the generated boundary', async () => {
  const api = new ApiClient(
    'https://example.test/api/',
    undefined,
    undefined,
    async (url, init) => {
      assert.equal(url, 'https://example.test/api/auth/login');
      assert.equal(init?.method, 'POST');
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers['Content-Type'], undefined);
      assert.equal(headers.Authorization, undefined);
      assert.ok(init?.body instanceof FormData);
      assert.equal(init.body.get('username'), 'pat@example.test');
      assert.equal(init.body.get('password'), ' pass with spaces ');
      return json({ access_token: 'token', user_id: 42 });
    },
  );
  assert.deepEqual(
    await new SavrService(api).login(
      ' pat@example.test ',
      ' pass with spaces ',
    ),
    { accessToken: 'token', userId: '42' },
  );
});

test('signup sends nested address and optional fields using the Swift contract', async () => {
  const api = new ApiClient(
    'https://example.test/api',
    undefined,
    undefined,
    async (_url, init) => {
      assert.deepEqual(JSON.parse(init?.body as string), {
        email: 'pat@example.test',
        password: 'password',
        first_name: 'Pat',
        address: { street: '12 Main', postal_code: 'A1A 1A1' },
      });
      return json({ access_token: 'token', user_id: 'u' });
    },
  );
  await new SavrService(api).signup({
    email: 'pat@example.test',
    password: 'password',
    firstName: 'Pat',
    lastName: '',
    phone: '',
    street: '12 Main',
    city: '',
    province: '',
    postal: 'A1A 1A1',
  });
});

test('authenticated calls preserve /api, encode IDs, and accept DELETE 204', async () => {
  const api = new ApiClient(
    'https://example.test/api',
    'token',
    undefined,
    async (url, init) => {
      assert.equal(url, 'https://example.test/api/grocery-lists/list%2F1');
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        'Bearer token',
      );
      assert.equal(init?.method, 'DELETE');
      return new Response(null, { status: 204 });
    },
  );
  await new SavrService(api).deleteList('list/1');
});

test('failed DELETE is surfaced instead of silently removing a list', async () => {
  const api = new ApiClient(
    'https://example.test',
    'token',
    undefined,
    async () => json({ detail: 'Cannot delete' }, 500),
  );
  await assert.rejects(
    new SavrService(api).deleteList('x'),
    (e: unknown) =>
      e instanceof ApiError &&
      e.status === 500 &&
      e.message === 'Cannot delete',
  );
});

test('query encoding and flyer normalization preserve pagination and prices', async () => {
  const api = new ApiClient(
    'https://example.test/api',
    'token',
    undefined,
    async (url) => {
      const parsed = new URL(String(url));
      assert.equal(parsed.searchParams.get('search'), 'milk & eggs');
      assert.equal(parsed.searchParams.get('page'), '2');
      return json({
        deals: [
          { id: 1, product_name: 'Milk', price: '2/$5', price_float: null },
        ],
        total: 70,
        page: 2,
        page_size: 30,
      });
    },
  );
  const page = await new SavrService(api).deals('sobeys', 'milk & eggs', 2);
  assert.equal(page.total, 70);
  assert.equal(page.page, 2);
  assert.equal(page.deals[0].price, '2/$5');
  assert.equal(page.deals[0].priceFloat, undefined);
});

test('401 expires authenticated sessions, but login errors and 403 do not', async () => {
  let invalidations = 0;
  const expired = new ApiClient(
    'https://example.test',
    'token',
    () => invalidations++,
    async () => json({ detail: 'Expired' }, 401),
  );
  await assert.rejects(expired.request('auth/profile'), ApiError);
  assert.equal(invalidations, 1);
  const anonymous = new ApiClient(
    'https://example.test',
    undefined,
    () => invalidations++,
    async () => json({}, 401),
  );
  await assert.rejects(anonymous.request('auth/login'), ApiError);
  assert.equal(invalidations, 1);
  const forbidden = new ApiClient(
    'https://example.test',
    'token',
    () => invalidations++,
    async () => json({}, 403),
  );
  await assert.rejects(forbidden.request('lists'), ApiError);
  assert.equal(invalidations, 1);
});

test('malformed responses are rejected and server validation errors are readable', async () => {
  assert.throws(() => parseSession({ user_id: '1' }));
  assert.throws(() => parseList({ id: '1', name: 'List', items: 'wrong' }));
  assert.throws(() => parseDeals({ deals: null }));
  const api = new ApiClient(
    'https://example.test',
    undefined,
    undefined,
    async () => json({ detail: [{ msg: 'Email is invalid' }] }, 422),
  );
  await assert.rejects(api.request('auth/signup'), {
    message: 'Email is invalid',
  });
});

test('Swift response aliases, nullable savings, dictionary brands, and numeric store IDs map correctly', () => {
  assert.deepEqual(parseChat({ session_id: 's', bot_response: 'Hello' }), {
    sessionId: 's',
    text: 'Hello',
  });
  assert.deepEqual(parseChat({ sessionId: 's', botResponse: 'Hello' }), {
    sessionId: 's',
    text: 'Hello',
  });
  assert.equal(list.items[0].quantity, '2 lbs');
  assert.equal(list.savings, 0);
  assert.equal(list.priciestPrice, undefined);
  assert.equal(
    parseProfile({
      brand_preferences: { liked: { Dairy: 'Brand' }, disliked: {} },
      dietary_restrictions: [],
    }).likedBrands.Dairy,
    'Brand',
  );
  assert.equal(parseStores([{ id: 9, store_name: 'No Frills' }])[0].id, '9');
});

test('list chat retries a missing session once with list and transcript context', async () => {
  const requests: { text: string; id?: string }[] = [];
  const send = async (text: string, id?: string) => {
    requests.push({ text, id });
    if (id) throw new ApiError(404, 'Session missing');
    return { sessionId: 'new-session', text: 'Try pears.' };
  };
  const result = await sendConversation(
    send,
    {
      sessionId: 'old-session',
      messages: [
        { id: 'm', text: 'I like fruit', role: 'user', timestamp: '' },
      ],
    },
    'Any substitutes?',
    list,
  );
  assert.equal(requests.length, 2);
  assert.equal(requests[0].text, 'Any substitutes?');
  assert.equal(requests[1].id, undefined);
  assert.match(requests[1].text, /Weekly shop/);
  assert.match(requests[1].text, /Apples \(2 lbs\)/);
  assert.match(requests[1].text, /I like fruit/);
  assert.equal(result.sessionId, 'new-session');
});

test('chat does not retry generic failures or loop on a new-session 404', async () => {
  let calls = 0;
  const failing = async () => {
    calls++;
    throw new ApiError(500, 'Unavailable');
  };
  await assert.rejects(
    sendConversation(
      failing,
      { sessionId: 'old', messages: [] },
      'hello',
      list,
    ),
  );
  assert.equal(calls, 1);
  calls = 0;
  const missing = async () => {
    calls++;
    throw new ApiError(404, 'Missing');
  };
  await assert.rejects(
    sendConversation(
      missing,
      { sessionId: 'old', messages: [] },
      'hello',
      list,
    ),
  );
  assert.equal(calls, 2);
});

test('session bootstrap restores a valid account and only clears rejected credentials', async () => {
  let cleared = 0;
  assert.deepEqual(
    await restoreAccount(
      async () => session,
      async () => profile,
      async () => {
        cleared++;
      },
    ),
    { session, profile, notice: '' },
  );
  const expired = await restoreAccount(
    async () => session,
    async () => {
      throw new ApiError(401, 'Expired');
    },
    async () => {
      cleared++;
    },
  );
  assert.equal(expired.session, null);
  assert.equal(cleared, 1);
  const offline = await restoreAccount(
    async () => session,
    async () => {
      throw new Error('Offline');
    },
    async () => {
      cleared++;
    },
  );
  assert.deepEqual(offline.session, session);
  assert.ok(offline.notice);
  assert.equal(cleared, 1);
});

test('flyer additions require a real target list', async () => {
  let requests = 0;
  const service = new SavrService(
    new ApiClient('https://example.test', 'token', undefined, async () => {
      requests++;
      return new Response(null, { status: 204 });
    }),
  );
  await assert.rejects(service.addDeals(['d'], ''));
  await assert.rejects(service.addDeals([], 'l'));
  assert.equal(requests, 0);
});
