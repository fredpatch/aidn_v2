import { portalPost } from "../http";
import type {
  SubmitAccountRequestPayload,
  SubmitAccountRequestResponse,
} from "./types";

export function submitAccountRequest(
  payload: SubmitAccountRequestPayload,
): Promise<SubmitAccountRequestResponse> {
  return portalPost<SubmitAccountRequestResponse>(
    "/api/v1/portal/account-requests",
    payload,
    { auth: false },
  );
}
