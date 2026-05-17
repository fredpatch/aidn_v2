import { Router } from "express";
import { env } from "../shared/config/env.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

const router = Router();

router.use(`${env.apiPrefix}/auth`, authRouter);
router.use(`${env.apiPrefix}/admin`, adminRouter);

export const apiRouter = router;
