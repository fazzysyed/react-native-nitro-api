import type { MediaFile, UploadConfig, UploadFieldValue } from '../core/types';

function inferFileName(uri: string): string {
  const parts = uri.split('/');
  const fileName = parts[parts.length - 1];
  return fileName && fileName.length > 0 ? fileName : `upload-${Date.now()}`;
}

function inferMimeType(fileName: string): string {
  const lowered = fileName.toLowerCase();
  if (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lowered.endsWith('.png')) {
    return 'image/png';
  }
  if (lowered.endsWith('.gif')) {
    return 'image/gif';
  }
  if (lowered.endsWith('.mp4')) {
    return 'video/mp4';
  }
  if (lowered.endsWith('.mov')) {
    return 'video/quicktime';
  }
  if (lowered.endsWith('.pdf')) {
    return 'application/pdf';
  }
  return 'application/octet-stream';
}

function appendField(formData: FormData, key: string, value: UploadFieldValue): void {
  if (value === null || value === undefined) {
    return;
  }
  formData.append(key, String(value));
}

function normalizeFiles(files: MediaFile | MediaFile[]): MediaFile[] {
  return Array.isArray(files) ? files : [files];
}

export function createUploadFormData(config: UploadConfig): FormData {
  const formData = new FormData();
  const files = normalizeFiles(config.files);
  const fileFieldName = config.fileFieldName ?? 'file';

  for (const file of files) {
    const name = file.name ?? inferFileName(file.uri);
    const type = file.type ?? inferMimeType(name);
    formData.append(fileFieldName, { uri: file.uri, name, type } as unknown as Blob);
  }

  const fields = config.fields ?? {};
  for (const [key, value] of Object.entries(fields)) {
    appendField(formData, key, value);
  }

  return formData;
}
