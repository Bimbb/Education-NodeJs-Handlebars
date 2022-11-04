const Report = require("../models/Report");
const User = require("../models/User");
const mongoose = require("mongoose");
const { multipleMongooseToObject, mongooseToObject}  = require('../../util/mongoose')
const bcrypt = require("bcrypt");
const isJson = require("is-json");
const json2xls = require("json2xls");
const fs = require("fs");
const path = require("path");
const readXlsxFile = require("read-excel-file/node");
const moment = require("moment");
const XLSX = require("xlsx");
const ObjectId = mongoose.Types.ObjectId;
class ReportController{

    // [GET]/reports/list
    async list(req, res) {
        const reports = await Report.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
            
        ]);
        res.render("reports/list", {
            reports,
            layout:"admin",
            success: req.flash("success"),
            errors: req.flash("error"),
        });
    }


    // [DELETE]/reports/:id
    async delete(req, res, next) {
        await Report.deleteOne({ _id: req.params.id });
        req.flash("success", "Xóa thành công!");
        res.redirect("back");
    }

    // [POST]/reports/export
    async export(req, res) {
        const reports = await Report.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
        ]);

        let reportsExcel = [];
        reports.forEach((item, index) => {
            let report = {
                STT: index + 1,
                "Mục lỗi": item.summary,
                "Nội dung chi tiết": item.content,
                "Ngày báo cáo": moment(item.createdAt).format("DD-MM-YYYY"),
                "Người báo cáo lỗi": item.user[0].fullname,
                "Email người báo lỗi": item.user[0].email,
            };
            reportsExcel.push(report);
        });

        /* create a new blank workbook */
        var wb = XLSX.utils.book_new();
        var temp = JSON.stringify(reportsExcel);
        temp = JSON.parse(temp);
        var ws = XLSX.utils.json_to_sheet(temp);
        let down = path.resolve(
            __dirname,
            `../../public/exports/thong-ke-danh-sach-Bao-loi.xlsx`
        );
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, down);
        res.download(down);
    }

}
module.exports = new ReportController();