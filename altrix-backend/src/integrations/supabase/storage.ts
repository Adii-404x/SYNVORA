import { SupabaseClient } from '@supabase/supabase-js';
import { basename } from 'node:path';

export class SupabaseStorageService {
  async uploadMedicalDocument(
    supabase: SupabaseClient,
    userId: string,
    fileName: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<{ path: string }> {
    const safeFileName = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload';
    const filePath = `${userId}/${Date.now()}-${safeFileName}`;
    const { error } = await supabase.storage.from('medical-documents').upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) throw error;
    return { path: filePath };
  }

  async downloadMedicalDocument(supabase: SupabaseClient, filePath: string): Promise<Buffer> {
    const { data, error } = await supabase.storage.from('medical-documents').download(filePath);
    if (error) throw error;
    
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteMedicalDocument(supabase: SupabaseClient, filePath: string): Promise<void> {
    const { error } = await supabase.storage.from('medical-documents').remove([filePath]);
    if (error) throw error;
  }
}

export const storageService = new SupabaseStorageService();
