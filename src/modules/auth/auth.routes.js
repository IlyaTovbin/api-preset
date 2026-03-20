import { Router } from "express";
import { authRateLimit } from "../../middlewares/auth.middleware.js";
import { refreshHandler, signInHandler, signOutHandler } from "./auth.controller.js";

const authRouter = Router();

authRouter.use(authRateLimit);
authRouter.post("/sign-in", signInHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/sign-out", signOutHandler);

export { authRouter };
