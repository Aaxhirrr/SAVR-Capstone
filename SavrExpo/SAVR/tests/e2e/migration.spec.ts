import { expect, test, type Page } from '@playwright/test';

async function mockBackend(page: Page) {
  let profile = {
    first_name: 'Pat',
    last_name: 'Shopper',
    email: 'pat@example.test',
    phone: '',
    address: { street: '' },
    dietary_restrictions: [] as string[],
    brand_preferences: { liked: {}, disliked: {} },
  };
  let lists = [
    {
      id: 'list-1',
      name: 'Weekly groceries',
      items: [{ name: 'Apples', quantity: '2 lbs', category: 'Produce' }],
      createdAt: '2026-09-29T10:00:00Z',
      is_active: true,
      session_id: 'stale-session',
      savings_amount: 4.5,
    },
  ];
  let stores = [
    {
      id: 12,
      store_name: 'No Frills',
      address: '900 Dufferin St',
      postal_code: 'M6H 4B1',
      brand: 'nofrills',
    },
  ];
  let deletes = 0;
  const chatBodies: Record<string, unknown>[] = [];
  const flyerBodies: Record<string, unknown>[] = [];
  await page.route('https://savr.test/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/', '');
    const method = request.method();
    const reply = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: status === 204 ? '' : JSON.stringify(body),
      });
    if (method === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        },
      });
    if (path === 'auth/login')
      return reply({
        access_token: 'browser-test-token',
        user_id: 'test-user',
      });
    if (path === 'auth/profile') {
      if (method === 'PUT') profile = { ...profile, ...request.postDataJSON() };
      return reply(profile);
    }
    if (path === 'auth/change-password') return reply({ message: 'Updated' });
    if (path === 'auth/account') return reply({}, 204);
    if (path === 'grocery-lists/all') return reply(lists);
    if (path === 'grocery-lists/list-1') {
      if (method === 'DELETE') {
        if (++deletes === 1)
          return reply({ detail: 'Deletion failed. Try again.' }, 500);
        lists = [];
        return reply({}, 204);
      }
      return reply(lists[0]);
    }
    if (path === 'chat/history/stale-session')
      return reply({ detail: 'Session not found' }, 404);
    if (path.startsWith('chat/history/')) return reply([]);
    if (path === 'chat/message') {
      chatBodies.push(request.postDataJSON());
      return reply({
        session_id: 'new-session',
        bot_response: 'Try **pears** for your next grocery trip.',
      });
    }
    if (path === 'user/selected_stores') {
      if (method === 'POST')
        stores.push({ id: Date.now(), ...request.postDataJSON() });
      return reply(stores);
    }
    if (path.startsWith('user/selected_stores/') && method === 'DELETE') {
      stores = stores.filter((s) => String(s.id) !== path.split('/').pop());
      return reply({}, 204);
    }
    if (path === 'flyers')
      return reply({
        deals: [
          {
            id: 'deal-1',
            store_brand: 'nofrills',
            product_name: 'Fresh apples',
            price: '$2.99',
            price_float: 2.99,
            valid_from: '2026-09-25',
            valid_to: '2026-10-01',
          },
        ],
        total: 1,
        page: 1,
        page_size: 30,
      });
    if (path === 'flyers/add-to-list') {
      flyerBodies.push(request.postDataJSON());
      return reply({}, 204);
    }
    return reply(
      { detail: 'Unexpected test endpoint: ' + method + ' ' + path },
      500,
    );
  });
  return { chatBodies, flyerBodies, getProfile: () => profile };
}
async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('pat@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('What are we shopping for today?')).toBeVisible();
}

test('landing and protected navigation work at phone width', async ({
  page,
}) => {
  await mockBackend(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Your smart', { exact: false })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start saving with SAVR' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/savr-home.png', fullPage: true });
  await page.goto('/profile');
  await expect(
    page.getByRole('button', { name: 'Start saving with SAVR' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('chat, list context recovery, and failed deletion retain correct state', async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await signIn(page);
  await page
    .getByRole('textbox', { name: 'Message SAVR' })
    .fill('Help me plan groceries.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(
    page
      .getByText('Try pears for your next grocery trip.')
      .filter({ visible: true }),
  ).toBeVisible();
  expect(backend.chatBodies[0]).toEqual({ message: 'Help me plan groceries.' });
  await page.getByText('My Lists', { exact: true }).click();
  await page.getByRole('button', { name: 'Open Weekly groceries' }).click();
  await expect(page.getByRole('checkbox', { name: 'Apples' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Apples' }).click();
  await expect(page.getByRole('checkbox', { name: 'Apples' })).toBeChecked();
  await page.getByRole('button', { name: 'Conversation', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Message SAVR' })
    .fill('Any substitutes?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(
    page
      .getByText('Try pears for your next grocery trip.')
      .filter({ visible: true }),
  ).toBeVisible();
  expect(backend.chatBodies[1].message).toContain('Weekly groceries');
  expect(backend.chatBodies[1].sessionId).toBeUndefined();
  await page.screenshot({ path: 'test-results/savr-chat.png', fullPage: true });
  await page.goBack();
  await page.getByRole('button', { name: 'Delete Weekly groceries' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Deletion failed. Try again.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Weekly groceries' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete Weekly groceries' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open Weekly groceries' }),
  ).toHaveCount(0);
});

test('flyers add selected deals to an explicit list and stores enforce the limit', async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await signIn(page);
  await page.getByText('Flyers', { exact: true }).click();
  await expect(page.getByText('Fresh apples', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Select deal' }).click();
  await page.getByRole('button', { name: 'Add 1 deal to a list' }).click();
  await expect(
    page.getByRole('button', { name: 'Add selected deals' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Weekly groceries', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add selected deals' }).click();
  await expect(
    page.getByText('Deals added to your grocery list.'),
  ).toBeVisible();
  expect(backend.flyerBodies).toEqual([
    { deal_ids: ['deal-1'], list_id: 'list-1' },
  ]);
  await page.getByText('Stores', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Save store', exact: true })
    .first()
    .click();
  await expect(page.getByText('Saved stores · 2/3')).toBeVisible();
  await page
    .getByRole('button', { name: 'Save store', exact: true })
    .first()
    .click();
  await expect(page.getByText('Saved stores · 3/3')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Save store', exact: true }).first(),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Remove', exact: true })
    .first()
    .click();
  await expect(page.getByText('Saved stores · 2/3')).toBeVisible();
});

test('profile saves preferences and sign-out removes access to protected screens', async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await signIn(page);
  await page.getByRole('button', { name: 'Open profile' }).click();
  await page.getByRole('button', { name: 'Dietary', exact: true }).click();
  await page.getByRole('button', { name: 'Vegetarian', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByText('Your preferences have been saved.'),
  ).toBeVisible();
  expect(backend.getProfile().dietary_restrictions).toEqual(['Vegetarian']);
  await page.getByRole('button', { name: 'Security', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Start saving with SAVR' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open profile' })).toHaveCount(
    0,
  );
});
