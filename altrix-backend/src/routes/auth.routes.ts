import { Router } from "express";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.userId,
    },
  });
});

export default router;

