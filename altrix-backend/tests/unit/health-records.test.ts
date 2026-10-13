import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthRecordsController } from '../../src/controllers/health-records.controller';
import { verifiedRecordsService } from '../../src/services/verified-records.service';

vi.mock('../../src/services/verified-records.service');

describe('HealthRecordsController', () => {
  const supabase = { from: vi.fn() };
  const req = { userId: 'owner-1', supabase } as any;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as any;
  const next = vi.fn();
  let controller: HealthRecordsController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new HealthRecordsController();
    vi.mocked(verifiedRecordsService.getForUser).mockResolvedValue({
      observations: [],
      medications: [],
      sources: [],
    });
  });

  it('returns only the verified records resolved through the authenticated user-scoped client', async () => {
    await controller.getVerifiedRecords(req, res, next);

    expect(verifiedRecordsService.getForUser).toHaveBeenCalledWith(supabase, 'owner-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { observations: [], medications: [], sources: [] },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes service failures to the safe error middleware', async () => {
    const failure = new Error('database unavailable');
    vi.mocked(verifiedRecordsService.getForUser).mockRejectedValue(failure);

    await controller.getVerifiedRecords(req, res, next);

    expect(next).toHaveBeenCalledWith(failure);
    expect(res.json).not.toHaveBeenCalled();
  });
});
