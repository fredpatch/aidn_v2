import { portalClient, requestJson } from "./client";
import { getCsrfHeader, toPortalApiError, type JsonOptions } from "./utils";

export function portalPost<TResponse>(
  path: string,
  body: unknown,
  options: JsonOptions = {},
): Promise<TResponse> {
  return requestJson<TResponse>({
    method: "POST",
    url: path,
    data: body,
    headers: {
      "Content-Type": "application/json",
      ...getCsrfHeader(options),
    },
  });
}

export function portalPatch<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  return requestJson<TResponse>({
    method: "PATCH",
    url: path,
    data: body,
    headers: {
      "Content-Type": "application/json",
      ...getCsrfHeader(),
    },
  });
}

export function portalPostForm<TResponse>(
  path: string,
  body: FormData,
): Promise<TResponse> {
  return requestJson<TResponse>({
    method: "POST",
    url: path,
    data: body,
    headers: getCsrfHeader(),
  });
}

export function portalGet<TResponse>(path: string): Promise<TResponse> {
  return requestJson<TResponse>({
    method: "GET",
    url: path,
  });
}

export async function portalGetBlob(path: string): Promise<Blob> {
  try {
    const response = await portalClient.get<Blob>(path, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw toPortalApiError(error);
  }
}
