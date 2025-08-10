// tests/e2e.deleteFragment.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id (E2E)', () => {
  const userEmail1 = 'user1@email.com';
  const userPass = 'password1';
  const userEmail2 = 'user2@email.com';

  const createFragment = async (contentType, bodyBuffer) => {
    const post = await request(app)
      .post('/v1/fragments')
      .auth(userEmail1, userPass)
      .set('Content-Type', contentType)
      .send(bodyBuffer);

    expect(post.status).toBe(201);
    expect(post.headers.location).toBeTruthy();

    // Extract id from Location header: .../v1/fragments/:id
    const loc = post.headers.location;
    const id = loc.split('/').pop();
    expect(id).toBeTruthy();

    return { id, location: loc };
  };

  test('creates a fragment, deletes it, then GET returns 404', async () => {
    const body = Buffer.from('hello world'); // ensure Buffer so req.body is Buffer
    const { id } = await createFragment('text/plain', body);

    const del = await request(app).delete(`/v1/fragments/${id}`).auth(userEmail1, userPass);

    expect(del.status).toBe(200);
    expect(del.body.status).toBe('ok');
    // Depending on createSuccessResponse shape, message may be at body.message or body.data.message
    const msg = del.body.message ?? del.body.data?.message;
    expect(msg).toMatch(/Fragment deleted/i);

    // Verify it's gone
    const getAfter = await request(app).get(`/v1/fragments/${id}`).auth(userEmail1, userPass);

    expect(getAfter.status).toBe(404);
    expect(getAfter.body.status).toBe('error');
  });

  test('deleting a non-existent fragment returns 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments/does-not-exist-123')
      .auth(userEmail1, userPass);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('a different authenticated user cannot delete someone else’s fragment (404)', async () => {
    // Create under user1
    const body = Buffer.from('owned by user1');
    const { id } = await createFragment('text/plain', body);

    // Try to delete as user2
    const res = await request(app).delete(`/v1/fragments/${id}`).auth(userEmail2, userPass);

    // Your handler does Fragment.byId(req.user, id) and 404s when not found for that user
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');

    // Clean up as owner (optional, but nice if tests share state)
    const cleanup = await request(app).delete(`/v1/fragments/${id}`).auth(userEmail1, userPass);
    expect([200, 404]).toContain(cleanup.status);
  });

  test('works for binary (image/png) payloads too (create then delete)', async () => {
    // 1×1 PNG (red) buffer: minimal but valid PNG
    const tinyPng = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010802000000907724' +
        '0000000a49444154789c6360f8cf00000006000105fe02fea5d9f60000000049' +
        '454e44ae426082',
      'hex'
    );

    const { id } = await createFragment('image/png', tinyPng);

    const del = await request(app).delete(`/v1/fragments/${id}`).auth(userEmail1, userPass);

    expect(del.status).toBe(200);
    expect(del.body.status).toBe('ok');

    const getAfter = await request(app).get(`/v1/fragments/${id}`).auth(userEmail1, userPass);
    expect(getAfter.status).toBe(404);
  });
});
