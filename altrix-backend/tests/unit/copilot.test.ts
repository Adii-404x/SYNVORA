import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { copilotService } from '../../src/services/copilot.service';
import { ApiError } from '../../src/utils/api-error';

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

vi.mock('../../src/services/copilot.service', () => ({
  copilotService: { groundedChat: vi.fn() },
}));

describe('Copilot API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    vi.mocked(copilotService.groundedChat).mockResolvedValue({ answer: 'A cautious answer.', sources: [], uncertainty: true });
  });

  it('requires authentication', async () => {
    const response = await request(app).post('/api/copilot/chat').send({ message: 'Hello' });
    expect(response.status).toBe(401);
    expect(copilotService.groundedChat).not.toHaveBeenCalled();
  });

  it('rejects invalid request bodies', async () => {
    const response = await request(app)
      .post('/api/copilot/chat')
      .set('Authorization', 'Bearer valid')
      .send({ msg: 'wrong key' });
    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
    expect(copilotService.groundedChat).not.toHaveBeenCalled();
  });

  it('rejects client-supplied health context', async () => {
    const response = await request(app)
      .post('/api/copilot/chat')
      .set('Authorization', 'Bearer valid')
      .send({ message: 'What does this result mean?', context: [{ value: '105' }] });
    expect(response.status).toBe(400);
    expect(copilotService.groundedChat).not.toHaveBeenCalled();
  });

  it('uses authenticated identity and returns the grounded service result', async () => {
    const response = await request(app)
      .post('/api/copilot/chat')
      .set('Authorization', 'Bearer valid')
      .send({ message: 'What is in my records?' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ answer: 'A cautious answer.', sources: [], uncertainty: true });
    expect(copilotService.groundedChat).toHaveBeenCalledWith('user-1', expect.any(Object), 'What is in my records?', undefined);
  });

  it('returns provider failures without exposing internal details', async () => {
    vi.mocked(copilotService.groundedChat).mockRejectedValueOnce(new ApiError(502, 'AI Service temporarily unavailable'));
    const response = await request(app)
      .post('/api/copilot/chat')
      .set('Authorization', 'Bearer valid')
      .send({ message: 'Hello' });

    expect(response.status).toBe(502);
    expect(response.body.error.message).toBe('AI Service temporarily unavailable');
    expect(JSON.stringify(response.body)).not.toContain('private provider details');
  });
});
