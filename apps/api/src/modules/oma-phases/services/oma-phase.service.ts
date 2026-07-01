/**
 * OMA phase compatibility barrel.
 *
 * The preliminary phase workflow has been split into focused slices for access,
 * admin reads/downloads, portal reads/uploads, meetings, pre-evaluation, DG,
 * and closure. Keep this file so existing imports from oma-phase.service remain
 * stable while the implementation stays modular.
 */
export * from "./oma-phase-access.service.js";
export * from "./oma-phase-admin-read.service.js";
export * from "./oma-phase-portal.service.js";
export * from "./oma-phase-meetings.service.js";
export * from "./oma-phase-pre-eval.service.js";
export * from "./oma-phase-dg.service.js";
export * from "./oma-phase-closure.service.js";
