const { multipleMongooseToObject: multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')
const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../../util/send-email");
class AuthController {
    // [GET]/password/change
    async passwordChange(req, res) {

        // const user = await User.findById(req.signedCookies.userId);
        // const user = await User.findOne({ id: req.params._id });
        res.render("auth/password-change", {
            errors: req.flash("error"),
            success: req.flash("success"),
            // user: mongooseToObject(user),
        });
    }

    // [PUT]/password/change/:id
    async putPasswordChange(req, res) {
        const user = await User.findById(req.signedCookies.userId);
        // const user = await User.findOne({ id: req.params._id });
        const { passwordOld, passwordNew } = req.body;

        const matchPassword = await bcrypt.compare(passwordOld, user.password);
        if (!matchPassword) {
            req.flash("error", "Mật khẩu cũ không chính xác!");
            res.redirect("back");
        } else {
            const passwordNewHash = await bcrypt.hash(passwordNew, 10);
            await User.updateOne(
                { _id: req.signedCookies.userId },
                // { _id: req.params._id },
                { password: passwordNewHash }
            );
            req.flash("success", "Đổi mật khẩu thành công!");
            res.redirect("back");
        }
    }

    // [GET]/password/reset
    passwordReset(req, res) {
        res.render("auth/password-reset", {
            errors: req.flash("error"),
            success: req.flash("success"),
        });
    }

    // [POST]/password/reset
    async postPasswordReset(req, res) {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            req.flash("error", "Người dùng có email này không tồn tại!");
            res.render("auth/password-reset", {
                values: req.body,
                errors: req.flash("error"),
                success: req.flash("success"),
            });
            return;
        }

        const token = crypto.randomBytes(32).toString("hex");
        Token.updateOne(
            { userId: user._id },
            { userId: user._id, token: token },
            { upsert: true }
        )
            .then(() => {
                const resetLink = `${process.env.BASE_URL}/reset/confirm/${token}`;
                sendEmail({
                    to: user.email,
                    subject: "Đặt lại mật khẩu",
                    text: `Chào ${user.fullname}, đây là liên kết đặt lại mật khẩu của bạn: ${resetLink}. Nếu bạn không yêu cầu liên kết này, hãy bỏ qua nó.!`,
                });
                req.flash(
                    "success",
                    "Kiểm tra địa chỉ email của bạn để biết liên kết đặt lại mật khẩu!"
                );
                res.render("auth/password-reset", {
                    values: req.body,
                    errors: req.flash("error"),
                    success: req.flash("success"),
                });
            })
            .catch((error) => {
                req.flash(
                    "error",
                    "Không thể tạo liên kết đặt lại, vui lòng thử lại!"
                );
                res.render("auth/password-reset", {
                    values: req.body,
                    errors: req.flash("error"),
                    success: req.flash("success"),
                });
            });
    }

    // [GET]/auth/reset/confirm/:token
    async resetConfirm(req, res) {
        const token = req.params.token;
        const passwordReset = await Token.findOne({ token: token });
        if (passwordReset !== null) {
            res.render("auth/reset-confirm", {
                token: token,
                // valid: passwordReset ? true : false,
                errors: req.flash("error"),
                success: req.flash("success"),
            });
        } else {
            res.status(404).render("error");
        }
    }

    // [POST]/auth/reset/confirm/:token
    async postResetConfirm(req, res) {
        const token = req.params.token;
        const passwordReset = await Token.findOne({ token: token });

        let user = await User.findOne({ _id: passwordReset.userId });
        user.password = await bcrypt.hash(req.body.password, 10);
        user.save()
            .then(async (savedUser) => {
                await Token.deleteOne({ _id: passwordReset._id });
                sendEmail({
                    to: user.email,
                    subject: "Đặt lại mật khẩu thành công",
                    text: `Xin chúc mừng ${user.fullname}! Đặt lại mật khẩu của bạn đã thành công.`,
                });
                req.flash("success", "Đặt lại mật khẩu thành công!");
                res.redirect("/login");
            })
            .catch((error) => {
                req.flash(
                    "error",
                    "Đặt lại mật khẩu không thành công, vui lòng thử lại!"
                );
                return res.redirect(`/reset/confirm/${token}`);
            });
    }
}

module.exports = new AuthController();
