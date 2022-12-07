const User = require("../models/User");
const Subject = require("../models/Subject");
const Blog = require("../models/Blog");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

module.exports = {
    userLocal: async function (req, res, next) {
        try {
            const user = await User.aggregate([
                { $match: { _id: ObjectId(req.signedCookies.userId) } },
            ]);
            res.locals.user = user;
            next();
        } catch (error) {
            console.log(error);
        }
    },

  
};
