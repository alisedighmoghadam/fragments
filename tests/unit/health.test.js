const request = require('supertest');

const app = require('../../src/app');

const { version, author } = require('../../package.json');

describe('/ health check', () => {
  test('should return HTTP 200 response', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('should return Cache-Control: no-cache header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['cache-control']).toEqual('no-cache');
  });

  test('should return status: ok response', async () => {
    const res = await request(app).get('/');
    expect(res.body.status).toEqual('ok');
  });

  test('should return correct version, githubUrl, and author in response', async () => {
    const res = await request(app).get('/');
    expect(res.body.author).toEqual(author);
    expect(res.body.version).toEqual(version);
    expect(res.body.githubUrl.startsWith('https://github.com/')).toBe(true);
  });

  test('should return 404 since the route is not available', async () => {
    const res = await request(app).get('/notARoute');
    expect(res.statusCode).toBe(404);
  });

  test('should return error since the route is not available', async () => {
    const res = await request(app).get('/notARoute');
    expect(res.body.status).toEqual('error');
  });

  test('should return error message since the route is not available', async () => {
    const res = await request(app).get('/notARoute');
    expect(res.body.error.message).toEqual('not found');
  });
});
