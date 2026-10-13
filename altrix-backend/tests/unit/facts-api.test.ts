import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import app from '../../src/app';
import { factsService } from '../../src/services/facts.service';
import { ApiError } from '../../src/utils/api-error';

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

vi.mock('../../src/services/facts.service', () => ({
  factsService: { listPending: vi.fn(), review: vi.fn() },
}));

describe('Candidate fact API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null });
    vi.mocked(factsService.listPending).mockResolvedValue([]);
    vi.mocked(factsService.review).mockResolvedValue({
      factId: '72bc852d-fc33-4d4c-bad7-bf8424f7db8a',
      decision: 'confirm',
      factType: 'observation',
      recordId: 'cb2af40d-f3d1-4937-8e20-e4ca39b8b8b6',
      idempotent: false,
    });
  });

  it('requires authentication and rejects invalid tokens', async () => {
    expect((await request(app).get('/api/facts/pending')).status).toBe(401);
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: new Error('secret') });
    const response = await request(app).get('/api/facts/pending').set('Authorization', 'Bearer bad-token');
    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });

  it('uses the authenticated session identity when listing pending facts', async () => {
    const response = await request(app).get('/api/facts/pending').set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(factsService.listPending).toHaveBeenCalledWith(expect.anything(), 'owner-1');
    expect(vi.mocked(createClient)).toHaveBeenCalled();
  });

  it('validates observation date corrections and returns a non-disclosing 404 for unowned IDs', async () => {
    const invalidDate = await request(app)
      .post('/api/facts/72bc852d-fc33-4d4c-bad7-bf8424f7db8a/confirm')
      .set('Authorization', 'Bearer valid-token')
      .send({ observationDate: '2026-02-30' });
    expect(invalidDate.status).toBe(400);
    expect(factsService.review).not.toHaveBeenCalled();

    vi.mocked(factsService.review).mockRejectedValueOnce(new ApiError(404, 'Candidate fact not found'));
    const crossUser = await request(app)
      .post('/api/facts/72bc852d-fc33-4d4c-bad7-bf8424f7db8a/confirm')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(crossUser.status).toBe(404);
    expect(crossUser.body.error.message).toBe('Candidate fact not found');
  });
});
