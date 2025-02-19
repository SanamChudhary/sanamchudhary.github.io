import { Router } from "express";
import { addToHistory, getUserHistory, login, register, verifyToken } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(verifyToken, addToHistory);
router.route("/get_all_activities").get(verifyToken, getUserHistory);

//TODO

// router.route("/profile");
// router.route("/update-profile");
// router.route("/delete-profile");
// router.route("/forgot-password");
// router.route("/reset-password");
// router.route("/change-password");
// router.route("/change-email");
// router.route("/change-username");
// router.route("/change-role");
// router.route("/add-friend");
// router.route("/remove-friend");
// router.route("/block-user");
// router.route("/unblock-user");



export default router;