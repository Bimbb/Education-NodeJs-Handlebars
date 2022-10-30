const User = require('../models/User');
const { multipleMongooseToObject, mongooseToObject}  = require('../../util/mongoose')
const bcrypt = require("bcrypt");
const isJson = require("is-json");
const json2xls = require("json2xls");
const fs = require("fs");
const path = require("path");
const readXlsxFile = require("read-excel-file/node");
const moment = require("moment");
const XLSX = require("xlsx");
class UserController{

    // [GET] /user/create
    async listUser(req, res, next) {
        User.find({})
        .then((users) => {
            res.render('user/list', {
                users : multipleMongooseToObject(users),
                layout:'admin',
                success: req.flash("success"),
                errors: req.flash("error"),
            });
        })
        .catch(next);
    }
    // [GET] /user/create
    create(req, res, next) {
        res.render('user/create',{
            success: req.flash("success"),
            errors: req.flash("error"),
            layout:'admin',
        });
        
    }
    // [POST]/user/create
    async createUser(req, res) {
        const formUser = req.body;
        const checkEmail = await User.findOne({ email: formUser.email });
        const checkPhone = await User.findOne({ phone: formUser.phone });
        if (checkEmail) {

            req.flash("error", "Email này đã tồn tại!");
            res.redirect('/user/create');
            return ;
        }

        if (checkPhone) {
            req.flash("error", "Số điện thoại này đã tồn tại!");
            res.redirect('/user/create');
            return;
        }

        formUser.fullname = formUser.firstName + " " + formUser.lastName;
        formUser.active = true;
        formUser.avatar = "/img/nobody.jpg";
        formUser.password = await bcrypt.hash(formUser.phone, 10);
        const user = new User(formUser); 
        await user.save();
        res.redirect('/user/list');
        req.flash("success", "Đăng ký thành công tài khoản mới!");
    }    
    // [PUT] /User/:id/edit
    edit(req, res, next) {
        User.findById( { _id: req.params.id })
            .then(user => {
                res.render('user/edit',{
                    user: mongooseToObject(user),
                    layout:'admin',
                })

            })
            .catch(next);
       
    }
    // [PUT] /User/:id
    update(req, res, next) {
        User.updateOne({ _id: req.params.id },req.body)
            .then(() => {
                req.flash("success", "Đã cập nhật thành công!"),
                res.redirect('/user/list')
                
            })
            .catch(next);
    }

    // [DELETE] /user/:id
    destroy(req, res, next) {
        
        User.deleteOne({ _id: req.params.id })
            .then(() => {
                req.flash("success", "Đã Xóa Thành công!"),
                res.redirect('back')
            })
            .catch(next);
    }

    // [DELETE] /courses/:id/force
    forceDestroy(req, res, next) {
        User.deleteOne({ _id: req.params.id })
            .then(() => res.redirect('back'))
            .catch(next);
    }

     //[POST] user/create-list-user
    async addUserList(req, res) {
        if (req.file == undefined) {
            req.flash("error", "Vui lòng tải lên một tệp excel!");
            res.redirect("back");
            return;
        }

        let pathExcel = path.resolve(
            __dirname,
            "../../public/uploads/" + req.file.filename
        );

        readXlsxFile(pathExcel).then(async (rows) => {
            rows.shift();
            let users = [];
            let userCheck = await User.find({});

            rows.forEach((row) => {
                let user = new User({
                    fullname: row[1],
                    birthDay: row[2],
                    phone: row[3],
                    address: row[4],
                    email: row[5].toString().toLowerCase(),
                    avatar: "/img/nobody.jpg",
                });
                users.push(user);
            });

            let usersValid = [];
            let usersInvalid = [];
            for (var i = 0; i < users.length; i++) {
                let flag = 0;
                for (var j = 0; j < userCheck.length; j++) {
                    // trùng tên hoặc trùng email sẽ đưa vào danh sách không hợp lệ
                    if ( users[i].phone == userCheck[j].phone || users[i].email == userCheck[j].email ) 
                    {
                        usersInvalid.push(users[i]);
                    } else {
                        flag++;
                    }
                    if (flag == userCheck.length) {
                        usersValid.push(users[i]);
                    }
                }
            }

            // xử lý lưu các học sinh đăng ký hợp lệ
            if (usersValid.length > 0) {
                for (var i = 0; i < usersValid.length; i++) {
                    let userSave = new User(usersValid[i]);
                    userSave.active = true;
                    // passworld là so dien thoai
                    userSave.password = await bcrypt.hash(userSave.phone, 10);
                    await userSave.save();
                }
            }

            let fileName;
            if (usersInvalid.length > 0) {
                let usersInvalidExcel = [];
                usersInvalid.forEach((item, index) => {
                    let user = {
                        STT: index + 1,
                        "Họ và tên": item.fullname,
                        "Ngày sinh": moment(item.birthDay).format("DD-MM-YYYY"),
                        "Số điện thoại": item.phone,
                        "Địa chỉ hiện tại": item.address,
                        "Địa chỉ email": item.email,
                    };
                    usersInvalidExcel.push(user);
                });

                var usersInvalidJson = JSON.stringify(usersInvalidExcel);
                if (isJson(usersInvalidJson)) {
                    // code
                    fileName = "ImportStudentFail" + Date.now() + ".xlsx";
                    var excelOutput = "src/public/exports/" + fileName;
                    var xls = json2xls(usersInvalidExcel);
                    // save file in server
                    fs.writeFileSync(excelOutput, xls, "binary");
                } else {
                    // thông báo lỗi
                    //res.send("lỗi rồi!");
                }
            }

            res.render("user/create-list-user", {
                fileName,
                usersValid,
                usersInvalid,
                layout: "admin",
                success: req.flash("success"),
                errors: req.flash("error"),
            });
        });
    }
     // [POST]/user/export
     async export(req, res) {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "roles",
                    localField: "roleID",
                    foreignField: "_id",
                    as: "role",
                },
            },
        ]);

        let usersExcel = [];
        users.forEach((item, index) => {
            let user = {
                STT: index + 1,
                "Họ tên": item.fullname,
                "Ngày sinh": moment(item.birthDay).format("DD-MM-YYYY"),
                "Số điện thoại": item.phone,
                "Địa chỉ hiện tại": item.address,
                "Địa chỉ email": item.email,
            };
            usersExcel.push(user);
        });

        /* create a new blank workbook */
        var wb = XLSX.utils.book_new();
        var temp = JSON.stringify(usersExcel);
        temp = JSON.parse(temp);
        var ws = XLSX.utils.json_to_sheet(temp);
        let down = path.resolve(
            __dirname,
            `../../public/exports/thong-ke-danh-sach-nguoi-dung.xlsx`
        );
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, down);
        res.download(down);
    }
}

module.exports = new UserController();