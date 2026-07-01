import type { ListRequestsParams } from './types';

export function buildRequestsPath(paramsInput: ListRequestsParams): string {
  const params = new URLSearchParams();
  if (paramsInput.status) params.set('status', paramsInput.status);
  if (paramsInput.requestType) params.set('requestType', paramsInput.requestType);
  if (paramsInput.courrierSource) params.set('courrierSource', paramsInput.courrierSource);
  if (paramsInput.search) params.set('search', paramsInput.search);

  const query = params.toString();
  return `/api/v1/admin/requests${query ? `?${query}` : ''}`;
}

export function buildRequestPath(id: string): string {
  return `/api/v1/admin/requests/${id}`;
}

export function buildRequestActionPath(id: string, action: string): string {
  return `${buildRequestPath(id)}/${action}`;
}

export function buildRequestDocumentPath(requestId: string, documentId: string): string {
  return `/api/v1/admin/requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(documentId)}`;
}
