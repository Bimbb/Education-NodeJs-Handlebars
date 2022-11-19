const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

const {
    checkRequireAdmin,
    requireAuth,
    authValidate,
} = require("../app/middlewares/AuthMiddleware");



router.get('/',siteController.index);
router.get("/admin", checkRequireAdmin, siteController.admin);

router.get("/login-admin", siteController.LoginAdmin);
router.post("/login-admin", siteController.postLoginAdmin);
router.get("/logout-admin", checkRequireAdmin, siteController.logoutAdmin);

router.get("/login", siteController.login);
router.post("/login", authValidate, siteController.postLogin);
router.get("/logout", requireAuth, siteController.logout);
router.post("/report", requireAuth, siteController.report);
router.get("/competition", requireAuth, siteController.competition);


router.get('/infor', siteController.infor);
module.exports = router;
