import { supabaseAdmin } from './client';

export class SupabaseStorageService {
  async uploadMedicalDocument(userId: string, fileName: string, mimeType: string, buffer: Buffer): Promise<{ path: string }> {
    const filePath = `${userId}/${Date.now()}-${fileName}`;
    const { data, error } = await supabaseAdmin.storage.upload('medical-documents', filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) throw error;
    return { path: filePath };
  }

  async downloadMedicalDocument(filePath: string): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage.from('medical-documents').download(filePath);
    if (error) throw error;
    
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const storageService = new SupabaseStorageService();