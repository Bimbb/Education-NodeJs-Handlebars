const User = require("../models/User");
const slugify = require("slugify");
const cloudinary = require("../../config/cloud/index");

class InforController {
    // [PUT]/infor/:id
    async update(req, res) {
        const { fullname, phone, birthDay, address } = req.body;
        const user = await User.findById(req.params.id);
        const checkUser = await User.findOne({
            fullname,
            phone,
            birthDay,
            address,
        });
        if (checkUser) {
            res.redirect("back");
            return;
        }

        const phones = await User.find({ phone: phone });
        const checkPhone = phones.filter((x) => x.phone !== user.phone);
        if (checkPhone.length > 0) {
            req.flash("error", "Số điện thoại này đã có người sử dụng!");
            res.redirect("back");
            return;
        }

        await User.updateOne(
            { _id: req.signedCookies.userId },
            {
                fullname,
                phone,
                birthDay,
                address,
            }
        );
        req.flash("success", "Cập nhật thông tin thành công!");
        res.redirect("back");
    }

    // [PUT]/infor/:id/avatar
    async changeAvatar(req, res) {
        const user = await User.findOne({ _id: req.signedCookies.userId });
        const checkAvatar = user.avatar;
        if (checkAvatar !== "/img/nobody.jpg") {
            const public_id = checkAvatar
                .split("/")
                .slice(-1)
                .join("")
                .split(".")[0];
            cloudinary.uploader.destroy(public_id);
        }

        if (req.file) {
            req.body.avatar = req.file.path.split("/").slice(-2).join("/");
            cloudinary.uploader.upload(req.file.path, async (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    await User.updateOne(
                        { _id: user.id },
                        { avatar: result.url }
                    );
                    req.flash("success", "Cập nhật ảnh đại diện thành công!");
                    res.redirect("back");
                }
            });
        }
    }
}

module.exports = new InforController();
