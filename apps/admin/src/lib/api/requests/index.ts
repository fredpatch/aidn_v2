import { apiGet, apiGetBlob, apiPost, apiPostForm } from '../client';
import type {
  AdminDossier,
  AdminRequest,
  AdminRequestDetail,
  ListRequestsParams,
} from './types';
import {
  buildRequestActionPath,
  buildRequestDocumentPath,
  buildRequestPath,
  buildRequestsPath,
} from './utils';

export type {
  AdminCourrier,
  AdminDgReview,
  AdminDocument,
  AdminDossier,
  AdminRequest,
  AdminRequestDetail,
  AdminRequestStatus,
  AdminRequestType,
  CourrierSource,
  ListRequestsParams,
  RelatedOrganization,
  RelatedUser,
} from './types';

export function listRequests(paramsInput: ListRequestsParams): Promise<{ items: AdminRequest[] }> {
  return apiGet<{ items: AdminRequest[] }>(buildRequestsPath(paramsInput));
}

export function getRequest(id: string): Promise<AdminRequestDetail> {
  return apiGet<AdminRequestDetail>(buildRequestPath(id));
}

export function startIntake(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(buildRequestActionPath(id, 'start-intake'), payload);
}

export function requestCorrection(
  id: string,
  payload: { reason: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(buildRequestActionPath(id, 'request-correction'), payload);
}

export function registerPhysicalCourrier(
  id: string,
  formData: FormData,
): Promise<AdminRequestDetail> {
  return apiPostForm(buildRequestActionPath(id, 'register-physical-courrier'), formData);
}

export function markPrintedForDg(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(buildRequestActionPath(id, 'mark-printed-for-dg'), payload);
}

export function recordDgReturn(
  id: string,
  formData: FormData,
): Promise<AdminRequestDetail> {
  return apiPostForm(buildRequestActionPath(id, 'record-dg-return'), formData);
}

export function openDossierDn(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest; dossier: AdminDossier }> {
  return apiPost(buildRequestActionPath(id, 'open-dossier-dn'), payload);
}

export function recordInitialDgDecision(
  id: string,
  payload: { decision: 'approved' | 'rejected'; observations?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(buildRequestActionPath(id, 'dg-decision'), payload);
}

export function sendToDg(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(buildRequestActionPath(id, 'send-to-dg'), payload);
}

export function downloadRequestOrientationDocument(
  requestId: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  return apiGetBlob(buildRequestDocumentPath(requestId, documentId));
}
