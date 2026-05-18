import { Router } from "express";
import { env } from "../shared/config/env.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { portalRouter } from "../modules/portal/portal.routes.js";

const router = Router();

router.use(`${env.apiPrefix}/auth`, authRouter);
router.use(`${env.apiPrefix}/admin`, adminRouter);
router.use(`${env.apiPrefix}/portal`, portalRouter);

export const apiRouter = router;
