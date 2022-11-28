const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');
const authController = require("../app/controllers/AuthController");

const {
    checkRequireAdmin,
    requireAuth,
    authValidate,
    changePassValidate,
} = require("../app/middlewares/AuthMiddleware");



router.get('/', siteController.index);
router.get("/admin", checkRequireAdmin, siteController.admin);

router.get("/login-admin", siteController.LoginAdmin);
router.post("/login-admin", siteController.postLoginAdmin);
router.get("/logout-admin", checkRequireAdmin, siteController.logoutAdmin);

router.get("/login", siteController.login);
router.post("/login", authValidate, siteController.postLogin);
router.get("/logout", requireAuth, siteController.logout);
router.post("/report", requireAuth, siteController.report);
router.get("/competition", requireAuth, siteController.competition);


router.get('/infor', requireAuth, siteController.infor);
router.put('/infor/:id', requireAuth, siteController.updateInfor);
router.get("/subjects", siteController.subjects);

router.get("/password/change", requireAuth, authController.passwordChange);
router.put(
    "/password/change/:id",
    requireAuth,
    changePassValidate,
    authController.putPasswordChange
);
module.exports = router;
