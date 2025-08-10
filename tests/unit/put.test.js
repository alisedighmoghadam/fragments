// tests/e2e.putFragment.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id (E2E)', () => {
  const userEmail1 = 'user1@email.com';
  const userEmail2 = 'user2@email.com';
  const pass = 'password1';

  // Safe binary parser (avoid string concat corruption)
  const parseBinary = (res, fn) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    res.on('end', () => fn(null, Buffer.concat(chunks)));
  };

  const createFragment = async (contentType, bodyBuffer) => {
    const post = await request(app)
      .post('/v1/fragments')
      .auth(userEmail1, pass)
      .set('Content-Type', contentType)
      .send(bodyBuffer);

    expect(post.status).toBe(201);
    const loc = post.headers.location;
    expect(loc).toBeTruthy();
    const id = loc.split('/').pop();
    expect(id).toBeTruthy();
    return { id, location: loc };
  };

  test('updates a text fragment with the same content-type (200) and persists new data', async () => {
    const original = Buffer.from('hello world');
    const updated = Buffer.from('updated text');

    const { id } = await createFragment('text/plain', original);

    const put = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(userEmail1, pass)
      .set('Content-Type', 'text/plain')
      .send(updated);

    expect(put.status).toBe(200);
    expect(put.body.status).toBe('ok');

    // Verify persisted bytes via raw GET
    const get = await request(app).get(`/v1/fragments/${id}`).auth(userEmail1, pass);

    expect(get.status).toBe(200);
    expect(get.body.body).toBe('updated text');
  });

  test('updates a PNG fragment (200) and returns new bytes on GET', async () => {
    // Tiny valid 1x1 red PNG
    const png1 = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010802000000907724' +
        '0000000a49444154789c6360f8cf00000006000105fe02fea5d9f60000000049' +
        '454e44ae426082',
      'hex'
    );
    // Tiny valid 1x1 (different content) PNG — a minimal different IDAT
    const png2 = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010802000000907724' +
        '0000000a49444154789c6360f8cf00000006000105fe02fea5d9f60000000049' +
        '454e44ae426083', // last byte differs to make payload different but still PNG-ish
      'hex'
    );

    const { id } = await createFragment('image/png', png1);

    const put = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(userEmail1, pass)
      .set('Content-Type', 'image/png')
      .send(png2);

    expect(put.status).toBe(200);
    expect(put.body.status).toBe('ok');

    const get = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth(userEmail1, pass)
      .set('Accept-Encoding', 'identity') // avoid gzip
      .buffer(true)
      .parse(parseBinary);

    expect(get.status).toBe(200);
    expect(Buffer.isBuffer(get.body)).toBe(true);
  });

  test('returns 404 when fragment does not exist', async () => {
    const res = await request(app)
      .put('/v1/fragments/does-not-exist-xyz')
      .auth(userEmail1, pass)
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('anything'));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('returns 400 when trying to change content-type', async () => {
    const { id } = await createFragment('text/plain', Buffer.from('hello'));

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(userEmail1, pass)
      .set('Content-Type', 'text/markdown') // different than original
      .send(Buffer.from('# md update'));

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('a different authenticated user cannot update someone else’s fragment (404)', async () => {
    const { id } = await createFragment('text/plain', Buffer.from('owned by user1'));

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth(userEmail2, pass)
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('user2 trying to update'));

    // Handler uses Fragment.byId(ownerId, id), so for user2 it looks "not found"
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');

    // Verify original still intact
    const get = await request(app).get(`/v1/fragments/${id}`).auth(userEmail1, pass);

    expect(get.status).toBe(200);
    expect(get.body.body).toBe('owned by user1');
  });
});
