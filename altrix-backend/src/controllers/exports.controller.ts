import { Request, Response, NextFunction } from 'express';
import { getAuthContext } from '../utils/auth-context';
import { fhirExportService } from '../services/fhir.service';

export class ExportsController {
  async exportFhir(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const bundle = await fhirExportService.exportForUser(userId, supabase);
      return res.status(200).type('application/fhir+json').json(bundle);
    } catch (error) {
      next(error);
    }
  }
}

export const exportsController = new ExportsController();
