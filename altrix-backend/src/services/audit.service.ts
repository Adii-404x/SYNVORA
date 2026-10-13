import { supabaseAdmin } from '../integrations/supabase/client';
import { ApiError } from '../utils/api-error';

export class AuditService {
  async logAction(params: {
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string,
    userAgent?: string,
  }) {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: params.userId,
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId,
          old_value: params.oldValue,
          new_value: params.newValue,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        });

      if (error) {
        console.error('Audit log failed:', error);
        // We don't throw an error here to prevent blocking the main request,
        // but in a strict HIPAA environment, this might be a critical failure.
      }
    } catch (err) {
      console.error('Critical Audit Service Error:', err);
    }
  }
}

export const auditService = new AuditService();