import axios, { AxiosError } from "axios";
import { env } from "../../shared/config/env.js";
import { derivePersonnelEmail } from "./personnel-email.js";
import type {
  PersonnelAdapter,
  PersonnelIdentity,
  PersonnelSearchParams,
  PersonnelSearchResult,
} from "./personnel.types.js";

type ApiPersonnelRecord = {
  id?: number | string | null;
  idpersonnel?: number | string | null;
  idPersonnel?: number | string | null;
  personnelId?: number | string | null;
  numat?: number | string | null;
  matricule?: number | string | null;
  identity?: {
    matricule?: number | string | null;
    firstName?: string | null;
    lastName?: string | null;
    gender?: string | null;
  } | null;
  prenag?: string | null;
  firstName?: string | null;
  nomag?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  direction?: string | null;
  libdirec?: string | null;
  fonction?: string | null;
  libfct?: string | null;
  service_anac?: { libserv?: string | null } | null;
  direction_anac?: { libdirec?: string | null } | null;
  fonction_anac?: { libfct?: string | null } | null;
  organization?: {
    service?: { name?: string | null; abbreviation?: string | null } | null;
    direction?: { name?: string | null } | null;
    function?: { name?: string | null } | null;
  } | null;
  service?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean | null;
};

type ApiListEnvelope = unknown;

type ApiRecordEnvelope =
  | ApiPersonnelRecord
  | {
      data?: ApiPersonnelRecord;
      item?: ApiPersonnelRecord;
    };

const normalizeMatricule = (value: number | string | null | undefined) => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  return /^\d+$/.test(raw) ? raw.padStart(4, "0") : raw.toUpperCase();
};

const firstNonEmpty = (...values: Array<string | null | undefined>) =>
  values.map((value) => value?.trim()).find(Boolean);

const cleanLabel = (value?: string | null) =>
  value?.replace(/\s+/g, " ").trim() || undefined;

const toIdentity = (record: ApiPersonnelRecord): PersonnelIdentity | null => {
  const matricule = normalizeMatricule(
    record.identity?.matricule ?? record.numat ?? record.matricule,
  );

  if (!matricule) {
    return null;
  }

  const firstName =
    firstNonEmpty(
      record.identity?.firstName,
      record.prenag,
      record.firstName,
    ) ?? "";
  const lastName =
    firstNonEmpty(record.identity?.lastName, record.nomag, record.lastName) ??
    "";
  const fullName =
    firstNonEmpty(
      record.fullName,
      [firstName, lastName].filter(Boolean).join(" "),
    ) ?? matricule;

  return {
    // Keep personnelId stable with the historical AIDN mapping. The SI-ANAC
    // numeric id remains external to this adapter until an account migration is
    // explicitly planned.
    personnelId: matricule,
    matricule,
    fullName,
    email:
      firstNonEmpty(record.email) ?? derivePersonnelEmail(firstName, lastName),
    phone: firstNonEmpty(record.phone),
    service: cleanLabel(
      firstNonEmpty(
        record.service,
        record.organization?.service?.name,
        record.organization?.service?.abbreviation,
        record.service_anac?.libserv,
      ),
    ),
    direction: cleanLabel(
      firstNonEmpty(
        record.direction,
        record.organization?.direction?.name,
        record.libdirec,
        record.direction_anac?.libdirec,
      ),
    ),
    fonction: cleanLabel(
      firstNonEmpty(
        record.fonction,
        record.organization?.function?.name,
        record.libfct,
        record.fonction_anac?.libfct,
      ),
    ),
    isActive: record.isActive ?? undefined,
  };
};

const isRecordArray = (value: unknown): value is ApiPersonnelRecord[] =>
  Array.isArray(value);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readTotal = (value: unknown): number | undefined => {
  if (!isObject(value)) {
    return undefined;
  }

  const meta = isObject(value.meta) ? value.meta : undefined;
  const total =
    value.total ??
    value.count ??
    value.totalItems ??
    meta?.total ??
    meta?.count ??
    meta?.totalItems;
  return typeof total === "number" ? total : undefined;
};

const extractList = (
  payload: ApiListEnvelope,
): {
  records: ApiPersonnelRecord[];
  total?: number;
} => {
  if (isRecordArray(payload)) {
    return { records: payload };
  }

  if (!isObject(payload)) {
    return { records: [] };
  }

  const directRecords = payload.items ?? payload.results ?? payload.personnel;

  if (isRecordArray(directRecords)) {
    return { records: directRecords, total: readTotal(payload) };
  }

  const data = payload.data;

  if (isRecordArray(data)) {
    return { records: data, total: readTotal(payload) };
  }

  if (isObject(data)) {
    const nestedRecords =
      data.items ?? data.results ?? data.data ?? data.personnel;

    if (isRecordArray(nestedRecords)) {
      return {
        records: nestedRecords,
        total: readTotal(data) ?? readTotal(payload),
      };
    }
  }

  return { records: [], total: readTotal(payload) };
};

const extractRecord = (
  payload: ApiRecordEnvelope,
): ApiPersonnelRecord | null => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    ("data" in payload || "item" in payload)
  ) {
    const envelope = payload as {
      data?: ApiPersonnelRecord;
      item?: ApiPersonnelRecord;
    };

    return envelope.data ?? envelope.item ?? null;
  }

  return payload as ApiPersonnelRecord;
};

const stringifyForLog = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export class ApiPersonnelAdapter implements PersonnelAdapter {
  private readonly apiBaseUrl: string;

  constructor() {
    const baseUrl = env.personnelApi.baseUrl.replace(/\/$/, "");
    const prefix = env.personnelApi.apiPrefix
      .replace(/^\/?/, "/")
      .replace(/\/$/, "");
    this.apiBaseUrl = baseUrl.endsWith(prefix)
      ? baseUrl
      : `${baseUrl}${prefix}`;
  }

  private buildUrl(path: string, params?: Record<string, string | number>) {
    const url = new URL(`${this.apiBaseUrl}${path}`);

    Object.entries(params ?? {}).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    return url.toString();
  }

  private async getJson<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T | null> {
    const url = this.buildUrl(path, params);

    // console.log(`[personnel-api] GET ${url}`);

    try {
      const response = await axios.get<T>(url, {
        timeout: env.personnelApi.timeoutMs,
        headers: {
          accept: "application/json",
          "x-api-key": env.personnelApi.apiKey,
        },
      });

      // console.log(`[personnel-api] ${response.status} ${url}`);
      // console.log(
      //   `[personnel-api] raw response:\n${stringifyForLog(response.data)}`,
      // );
      return response.data;
    } catch (caught) {
      if (caught instanceof AxiosError) {
        if (caught.response?.status === 404) {
          // console.log(`[personnel-api] 404 ${url}`);
          return null;
        }

        const status = caught.response?.status;
        const detail =
          typeof caught.response?.data === "object" &&
          caught.response?.data !== null &&
          "message" in caught.response.data
            ? String(caught.response.data.message)
            : caught.message;

        throw new Error(
          `Personnel API request failed${status ? ` with HTTP ${status}` : ""} for ${url}: ${detail}`,
        );
      }

      throw caught;
    }
  }

  async searchPersonnel(
    params: PersonnelSearchParams,
  ): Promise<PersonnelSearchResult> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const page = Math.max(params.page ?? 1, 1);
    const search = params.search.trim();

    const isSearch = search.length >= 2;
    const remoteLimit = isSearch ? Math.min(page * limit, 50) : limit;
    const payload = await this.getJson<ApiListEnvelope>(
      isSearch ? "/personnel/search" : "/personnel",
      isSearch
        ? {
            q: search,
            limit: remoteLimit,
          }
        : {
            page,
            limit,
          },
    );

    if (isObject(payload)) {
      // console.log(
      //   `[personnel-api] payload keys=${Object.keys(payload).join(",")}`,
      // );
    } else {
      // console.log(
      //   `[personnel-api] payload type=${Array.isArray(payload) ? "array" : typeof payload}`,
      // );
    }

    const { records, total } = payload
      ? extractList(payload)
      : { records: [], total: 0 };
    // console.log(
    //   `[personnel-api] extracted records:\n${stringifyForLog(records)}`,
    // );

    const items = records
      .map(toIdentity)
      .filter((item): item is PersonnelIdentity => Boolean(item));
    const skip = isSearch ? (page - 1) * limit : 0;
    const pageItems = items.slice(skip, skip + limit);

    return {
      items: pageItems,
      total: total ?? items.length,
      page,
      limit,
    };
  }

  async getPersonnelById(
    personnelId: string,
  ): Promise<PersonnelIdentity | null> {
    // AIDN historically stores personnelId as the normalized matricule. Keep
    // lookup compatible by resolving IDs through the matricule endpoint.
    return this.getPersonnelByMatricule(personnelId);
  }

  async getPersonnelByMatricule(
    matricule: string,
  ): Promise<PersonnelIdentity | null> {
    const normalized = normalizeMatricule(matricule);

    if (!normalized) {
      return null;
    }

    const payload = await this.getJson<ApiRecordEnvelope | null>(
      `/personnel/matricule/${encodeURIComponent(normalized)}`,
    );

    if (!payload) {
      return null;
    }

    const record = extractRecord(payload);
    return record ? toIdentity(record) : null;
  }
}
