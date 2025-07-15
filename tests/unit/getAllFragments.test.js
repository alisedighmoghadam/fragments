const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments/all', () => {
  const user1 = { email: 'user1@email.com', password: 'password1' };
  const user2 = { email: 'user2@email.com', password: 'password2' };

  beforeAll(async () => {
    // Create one fragment for user1
    await request(app)
      .post('/v1/fragments')
      .auth(user1.email, user1.password)
      .set('Content-Type', 'text/plain')
      .send('Fragment from user 1');

    // Create one fragment for user2
    await request(app)
      .post('/v1/fragments')
      .auth(user2.email, user2.password)
      .set('Content-Type', 'text/plain')
      .send('Fragment from user 2');
  });

  test('unauthenticated requests are denied', async () => {
    await request(app).get('/v1/fragments/all').expect(401);
  });

  test('authenticated user can retrieve all fragments grouped by ownerId', async () => {
    const res = await request(app).get('/v1/fragments/all').auth(user1.email, user1.password);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.fragment).toBe('object');

    const ownerIds = Object.keys(res.body.fragment);
    expect(ownerIds.length).toBeGreaterThanOrEqual(2);

    for (const ownerId of ownerIds) {
      expect(Array.isArray(res.body.fragment[ownerId])).toBe(true);
      for (const frag of res.body.fragment[ownerId]) {
        expect(frag).toHaveProperty('id');
        expect(frag).toHaveProperty('type');
        expect(frag).toHaveProperty('data'); // text or base64
      }
    }
  });
});
