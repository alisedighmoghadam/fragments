/* eslint-disable no-unused-vars */
// tests/unit/get.test.js

const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');

const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id', () => {
  let userEmail = 'user1@email.com';
  let password = 'password1';
  let createdFragment;

  beforeAll(async () => {
    // Create a fragment before running the GET tests
    const res = await request(app)
      .post('/v1/fragments')
      .auth(userEmail, password)
      .set('Content-type', 'text/plain')
      .send('Fragment for GET test');

    const hashedEmail = hash(userEmail);
    const userFragments = await Fragment.byUser(hashedEmail, true);
    createdFragment = userFragments[0];
  });

  test('unauthenticated requests are denied', async () => {
    await request(app).get(`/v1/fragments/${createdFragment.id}`).expect(401);
  });

  test('incorrect credentials are denied', async () => {
    await request(app)
      .get(`/v1/fragments/${createdFragment.id}`)
      .auth('invalid@email.com', 'password1')
      .expect(401);
  });

  test('authenticated user can retrieve fragment by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${createdFragment.id}`)
      .auth(userEmail, password);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe(createdFragment.id);
    expect(res.body.fragment.ownerId).toBe(createdFragment.ownerId);
    expect(res.body.fragment.type).toBe(createdFragment.type);
  });

  test("authenticated user can't access fragment that doesn't exist", async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id-12345')
      .auth(userEmail, password);

    expect(res.statusCode).toBe(500); // Or 404 if your handler is improved to catch not found
    expect(res.body.status).toBe('error');
  });
});
