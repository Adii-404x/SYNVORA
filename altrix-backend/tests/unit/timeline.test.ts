import { describe, expect, it, vi } from 'vitest';
import { TimelineService } from '../../src/services/timeline.service';
import { verifiedRecordsService } from '../../src/services/verified-records.service';

vi.mock('../../src/services/verified-records.service', () => ({
  verifiedRecordsService: { getForUser: vi.fn() },
}));

describe('TimelineService', () => {
  it('includes confirmed source-linked observations', async () => {
    vi.mocked(verifiedRecordsService.getForUser).mockResolvedValue({
      observations: [{
        id: 'observation-1', factId: 'fact-1', name: 'Glucose', date: '2026-01-05',
        value: '5.4', unit: 'mmol/L', referenceRange: '3.9-5.5',
      }],
      medications: [],
      sources: [{
        factId: 'fact-1', documentId: 'document-1', fileName: 'report.pdf',
        evidence: 'Glucose 5.4 mmol/L', pageNumber: 1, extractionMethod: 'pdf_text',
      }],
    });

    const timeline = await new TimelineService().getTimeline({} as never, 'user-1', {
      type: 'observation', limit: 20,
    });

    expect(timeline).toEqual([{
      id: 'observation-1', type: 'observation', date: '2026-01-05',
      title: 'Glucose', status: 'verified', sourceId: 'fact-1',
    }]);
  });

  it('does not surface pending or rejected facts when verified retrieval returns none', async () => {
    vi.mocked(verifiedRecordsService.getForUser).mockResolvedValue({
      observations: [], medications: [], sources: [],
    });

    const timeline = await new TimelineService().getTimeline({} as never, 'user-1', {
      type: 'observation', limit: 20,
    });

    expect(timeline).toEqual([]);
  });
});
