/**
 * Document evaluation service compatibility barrel.
 *
 * Phase III implementation lives in payment, review, correction, and closure
 * slices. Keep this file so existing imports remain stable during refactors.
 */
export * from "./document-evaluation-closure.service.js";
export * from "./document-evaluation-correction.service.js";
export * from "./document-evaluation-payment.service.js";
export * from "./document-evaluation-review.service.js";
