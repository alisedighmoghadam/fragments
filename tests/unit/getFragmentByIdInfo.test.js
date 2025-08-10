const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');

const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id/info', () => {
  let userEmail = 'user1@email.com';
  let password = 'password1';
  let createdFragment;

  beforeAll(async () => {
    // Create a fragment to use in tests
    await request(app)
      .post('/v1/fragments')
      .auth(userEmail, password)
      .set('Content-Type', 'text/plain')
      .send('Testing /info endpoint');

    const hashedEmail = hash(userEmail);
    const userFragments = await Fragment.byUser(hashedEmail, true);
    createdFragment = userFragments[0];
  });

  test('unauthenticated requests are denied', async () => {
    await request(app).get(`/v1/fragments/${createdFragment.id}/info`).expect(401);
  });

  test('incorrect credentials are denied', async () => {
    await request(app)
      .get(`/v1/fragments/${createdFragment.id}/info`)
      .auth('invalid@email.com', 'password1')
      .expect(401);
  });

  test('authenticated user can get fragment metadata by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${createdFragment.id}/info`)
      .auth(userEmail, password);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe(createdFragment.id);
    expect(res.body.fragment.type).toBe(createdFragment.type);
    expect(res.body.fragment.size).toBe(createdFragment.size);
  });

  test('authenticated user gets error for non-existent fragment ID', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id-abc123/info')
      .auth(userEmail, password);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unable to fetch fragment');
  });
});
