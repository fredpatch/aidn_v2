import axios, { type AxiosRequestConfig } from "axios";

import { API_BASE_URL } from "./constants";
import { normalizeJsonResponse } from "./formatters";
import { toPortalApiError } from "./utils";

export const portalClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export async function requestJson<TResponse>(
  config: AxiosRequestConfig,
): Promise<TResponse> {
  try {
    const response = await portalClient.request<TResponse>(config);
    return normalizeJsonResponse<TResponse>(response.data);
  } catch (error) {
    throw toPortalApiError(error);
  }
}
