import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app';

describe('FHIR export route', () => {
  it('requires an authenticated request before exporting', async () => {
    const response = await request(app).post('/api/exports/fhir');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('requires authentication for conversation history routes', async () => {
    const list = await request(app).get('/api/copilot/conversations');
    const messages = await request(app).get('/api/copilot/conversations/72bc852d-fc33-4d4c-bad7-bf8424f7db8a/messages');

    expect(list.status).toBe(401);
    expect(messages.status).toBe(401);
  });
});
