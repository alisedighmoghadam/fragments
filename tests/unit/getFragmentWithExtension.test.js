const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const sharp = require('sharp');

// Magic-byte checks for images

const isJpeg = (buf) =>
  buf && buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

const isWebp = (buf) =>
  buf &&
  buf.length >= 12 &&
  buf.slice(0, 4).toString('ascii') === 'RIFF' &&
  buf.slice(8, 12).toString('ascii') === 'WEBP';

// supertest binary parser
const parseBinary = (res, fn) => {
  const chunks = [];
  res.on('data', (chunk) => {
    // chunk is usually a Buffer; if not, make it one
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  res.on('end', () => fn(null, Buffer.concat(chunks)));
};

describe('GET /v1/fragments/:id.:ext', () => {
  // ---------- TEXT FRAGMENT TESTS ----------
  describe('Text fragments', () => {
    const userEmail = 'user1@email.com';
    const password = 'password1';
    let fragment;

    beforeAll(async () => {
      const post = await request(app)
        .post('/v1/fragments')
        .auth(userEmail, password)
        .set('Content-Type', 'text/markdown')
        .send('# Markdown Heading');
      expect(post.status).toBe(201);

      const ownerId = hash(userEmail);
      const frags = await Fragment.byUser(ownerId, true);
      fragment = frags.find((f) => f.type === 'text/markdown') || frags[0];
      expect(fragment).toBeTruthy();
    });

    test('unauthenticated requests are denied (401)', async () => {
      await request(app).get(`/v1/fragments/${fragment.id}.html`).expect(401);
    });

    test('incorrect credentials are denied (401)', async () => {
      await request(app)
        .get(`/v1/fragments/${fragment.id}.html`)
        .auth('user1@email.com', 'password11')
        .expect(401);
    });

    test('authenticated user can get raw markdown (.md)', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.md`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/markdown/i);
      expect(res.text).toBe('# Markdown Heading');
    });

    test('authenticated user can get converted HTML (.html) from markdown', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.html`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/i);
      expect(res.text).toContain('<h1>Markdown Heading</h1>');
    });

    test('unsupported target extension (unknown ext) returns 400', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.exe`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Unsupported extension/i);
    });

    test('valid extension but unsupported conversion returns 415', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.json`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(415);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Cannot convert this format to \.json/i);
    });

    test('nonexistent fragment returns 404', async () => {
      const res = await request(app)
        .get('/v1/fragments/does-not-exist-xyz.html')
        .auth(userEmail, password);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Fragment not found/i);
    });

    test('a different authenticated user cannot access this fragment (401)', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.md`)
        .auth('user2@email.com', 'password1');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  // ---------- IMAGE FRAGMENT TESTS ----------
  describe('Image fragments', () => {
    const userEmail = 'user1@email.com';
    const password = 'password1';
    let pngBuf;
    let fragment;

    beforeAll(async () => {
      // Create a tiny PNG buffer
      pngBuf = await sharp({
        create: {
          width: 2,
          height: 2,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      // Upload PNG fragment
      const postRes = await request(app)
        .post('/v1/fragments')
        .auth(userEmail, password)
        .set('Content-Type', 'image/png')
        .send(pngBuf);
      expect(postRes.status).toBe(201);

      const ownerId = hash(userEmail);
      const frags = await Fragment.byUser(ownerId, true);
      fragment = frags.find((f) => f.type === 'image/png') || frags[0];
      expect(fragment).toBeTruthy();
    });

    test('unauthenticated image request is denied (401)', async () => {
      await request(app).get(`/v1/fragments/${fragment.id}.jpeg`).expect(401);
    });

    test('same user can fetch original PNG (.png)', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.png`)
        .auth(userEmail, password)
        .set('Accept-Encoding', 'identity')
        .buffer(true)
        .parse(parseBinary);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/i);
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(Buffer.compare(res.body, pngBuf)).toBeGreaterThanOrEqual(1);
    });

    test('PNG → JPEG conversion (.jpg) succeeds', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.jpg`)
        .auth(userEmail, password)
        .buffer(true)
        .parse(parseBinary);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/jpeg/i);
      expect(isJpeg(res.body)).toBe(true);
    });

    test('PNG → WEBP conversion (.webp) succeeds', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.webp`)
        .auth(userEmail, password)
        .buffer(true)
        .parse(parseBinary);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/webp/i);
      expect(isWebp(res.body)).toBe(true);
    });

    test('unknown/unsupported image extension returns 400', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.bmp`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Unsupported extension/i);
    });

    test('different authenticated user cannot access the image fragment (404)', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.png`)
        .auth('user2@email.com', 'password1');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });
});
