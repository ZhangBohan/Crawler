const request = require('supertest');
const app = require('../src/server');

describe('Crawler API', () => {
  jest.setTimeout(60000); // 增加测试超时时间

  test('should crawl simple test page', async () => {
    const response = await request(app)
      .post('/crawl')
      .send({
        url: 'https://www.zhidx.com/p/465832.html',  // 一个稳定的测试网站
        keyword: '',
        async: false,
        scroll: false
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('images');
    expect(Array.isArray(response.body.images)).toBe(true);
  }, 30000);

  test('should return images for valid URL', async () => {
    const response = await request(app)
      .post('/crawl')
      .send({
        url: 'https://www.ithome.com/0/833/171.htm',
        keyword: 'newsuploadfiles/2025',
        async: true,
        scroll: true
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('images');
    console.log('Crawled images:', response.body.images);
    expect(Array.isArray(response.body.images)).toBe(true);
  });

  test('should return 400 for missing URL', async () => {
    const response = await request(app)
      .post('/crawl')
      .send({
        keyword: 'test'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('URL is required');
  });

  test('should return 400 for invalid URL format', async () => {
    const response = await request(app)
      .post('/crawl')
      .send({
        url: 'invalid-url',
        keyword: ''
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid URL format');
  });

  test('should handle non-existent URLs', async () => {
    const response = await request(app)
      .post('/crawl')
      .send({
        url: 'http://non-existent-domain-12345.com',
        keyword: ''
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
}); 