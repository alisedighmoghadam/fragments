const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');

const { Fragment } = require('../../src/model/fragment');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', async () => {
    await request(app).post('/v1/fragments').expect(401);
  });

  test('incorrect credentials are denied', async () => {
    await request(app).post('/v1/fragments').auth('dummyUser@email.com', 'password1').expect(401);
  });

  test('authenticated users get fragment', async () => {
    const userEmail = 'user1@email.com';
    const content = 'Hello from test';
    const res = await request(app)
      .post('/v1/fragments')
      .auth(userEmail, 'password1')
      .set('Content-type', 'text/plain')
      .send(content);
    const hashedEmail = hash(userEmail);
    const fragment = await Fragment.byUser(hashedEmail, true);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.id).toEqual(fragment[0].id);
    expect(res.body.type).toEqual(fragment[0].type);
    expect(res.body.ownerId).toEqual(fragment[0].ownerId);
  });

  test('unsupported type', async () => {
    const userEmail = 'user1@email.com';
    const content = 'Hello from test';
    const res = await request(app)
      .post('/v1/fragments')
      .auth(userEmail, 'password1')
      .set('Content-type', 'audio/mpeg')
      .send(content);
    expect(res.statusCode).toBe(204);
  });
});
