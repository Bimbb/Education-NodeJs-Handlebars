const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");



router.get('/', siteController.index);
router.get("/admin", checkRequireAdmin ,siteController.admin);
router.get("/login-admin",siteController.LoginAdmin);
router.post("/login-admin", siteController.postLoginAdmin);
router.get("/logout-admin", checkRequireAdmin, siteController.logoutAdmin);
router.get("/competition",  siteController.competition);


module.exports = router;
