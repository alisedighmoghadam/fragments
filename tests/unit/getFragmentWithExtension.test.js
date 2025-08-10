// tests/unit/get.test.js

const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');

const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id.ext', () => {
  let userEmail = 'user1@email.com';
  let password = 'password1';
  let fragment;

  beforeAll(async () => {
    // Create a markdown fragment for testing conversions
    await request(app)
      .post('/v1/fragments')
      .auth(userEmail, password)
      .set('Content-Type', 'text/markdown')
      .send('# Markdown Heading');

    const hashedEmail = hash(userEmail);
    const userFragments = await Fragment.byUser(hashedEmail, true);
    fragment = userFragments[0];
  });

  test('unauthenticated requests are denied', async () => {
    await request(app).get(`/v1/fragments/${fragment.id}.html`).expect(401);
  });

  test('incorrect credentials are denied', async () => {
    await request(app)
      .get(`/v1/fragments/${fragment.id}.html`)
      .auth('wrong@email.com', 'password1')
      .expect(401);
  });

  test('authenticated user can get raw markdown (.md)', async () => {
    const res = await request(app).get(`/v1/fragments/${fragment.id}.md`).auth(userEmail, password);
    console.log(res.headers['content-type']);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/markdown/);
    expect(res.text).toBe('# Markdown Heading');
  });

  test('authenticated user can get converted HTML (.html)', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.html`)
      .auth(userEmail, password);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1>Markdown Heading</h1>');
  });

  test('unsupported extension returns 415', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.json`)
      .auth(userEmail, password);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch('Cannot convert this format to .json');
  });

  test('nonexistent fragment returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id-xyz.html')
      .auth(userEmail, password);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Fragment not found');
  });
});
