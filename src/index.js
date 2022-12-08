require("dotenv").config();

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require("cookie-parser");
const { messages } = require("./util/message-data");
const methodOverride = require('method-override');
const handlebars = require('express-handlebars').engine;
const moment = require("moment");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();

const route = require('./routes');
const db = require('./config/db');

const {
    userLocal,
} = require("./app/middlewares/LocalMiddleware");

///MODel

const Subject = require("./app/models/Subject");
const Unit = require("./app/models/Unit");
const Lesson = require("./app/models/Lesson");
const Exercise = require("./app/models/Exercise");
const Room = require("./app/models/Room");
const Rank = require("./app/models/Rank");
const User = require("./app/models/User");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//Connect to db 
db.connect();

app.use(express.static(path.join(__dirname, 'public')));




app.use(
    express.urlencoded({
        extended: true,
    }),
);


app.use(morgan('combined'));
app.use(cookieParser('MY SECRET'));

app.use(express.json());


app.use(methodOverride('_method'));

app.use(userLocal);



app.use(
    session({
        cookie: { maxAge: 60000 },
        saveUninitialized: true,
        resave: "true",
        secret: "secret",
    })
);

app.use(flash());


///Templates engine
app.engine('hbs',
    handlebars({
        extname: '.hbs',
        helpers: {
            sum: (a, b) => a + b,
            subtraction: (a, b) => a - b,
            JON: (a) => JSON.stringify(a),
            formatDate: (a) => moment(a).format("DD-MM-YYYY"),
            formatDateYMD: (a) => moment(a).format("YYYY-MM-DD"),
            formatString: (a) => a,
            formatDateLocale: (a) => moment(a).locale("vi").fromNow(),
            round: (a) => Math.round(a),
            percent: (a, b) => Math.round((a / b) * 100),
            ifCond: function (v1, operator, v2, options) {
                switch (operator) {
                    case '==':
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '!=':
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);
                    case '!==':
                        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }
            },
        },

    })
);









app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'resources', 'views'));



app.use(userLocal);

///Route init
route(app);

// app.use(function (req, res) {
//     res.status(404).render("error",{
//         layout:"",
//     });
// });


//socket
const server = require("http").Server(app);
const io = require("socket.io")(server);

var countMessage = 0;
var connected_socket = 0;
var $ipsConnected = [];
let ranks = [];
let users_answered = [];
let users_scored = [];


io.on("connection", async (socket) => {
    // qaController.respond(socket);

    console.log(socket.id + " ket noi");

    var $ipAddress = socket.handshake.address;
    if (!$ipsConnected.hasOwnProperty($ipAddress)) {
        $ipsConnected[$ipAddress] = 1;
        connected_socket++;
        io.sockets.emit("server-send-counter", connected_socket);
    }

    // ngắt kết nối
    socket.on("disconnect", async () => {
        if ($ipsConnected.hasOwnProperty($ipAddress)) {
            delete $ipsConnected[$ipAddress];
            connected_socket--;
            socket.emit("server-send-counter", connected_socket);
            console.log(socket.id + " ngat ket noi");
        }

        const rooms = await Room.find({});
        rooms.forEach(async (room) => {
            if (room.socketID === socket.id) {
                if (room.members.length > 0) {
                    await Room.deleteOne({ socketID: socket.id });
                    const roomsNew = await Room.aggregate([
                        {
                            $lookup: {
                                from: "grades",
                                localField: "gradeId",
                                foreignField: "_id",
                                as: "grade",
                            },
                        },
                    ]);

                    io.sockets.emit("server-send-rooms", roomsNew);
                    io.sockets.in(room.roomName).emit("master-handle-out-room");
                }
            } else {
                if (room.status === "Full") {
                    room.members.forEach(async (member) => {
                        if (member.socketID === socket.id) {
                            await Room.updateOne(
                                { _id: room._id },
                                {
                                    status: "Đang chờ...",
                                    $pull: {
                                        members: {
                                            socketID: socket.id,
                                        },
                                    },
                                }
                            );

                            const roomMembers = await Room.findOne({
                                roomName: room.roomName,
                            });
                            const roomsNew = await Room.aggregate([
                                {
                                    $lookup: {
                                        from: "grades",
                                        localField: "gradeId",
                                        foreignField: "_id",
                                        as: "grade",
                                    },
                                },
                            ]);

                            io.sockets.emit("server-send-rooms", roomsNew);
                            io.sockets
                                .in(room.roomName)
                                .emit(
                                    "server-send-members-in-room",
                                    roomMembers.members
                                );
                        }
                    });
                } else if (room.status === "Đang thi...") {
                    room.members.forEach(async (member) => {
                        if (member.socketID === socket.id) {
                            await Room.updateOne(
                                { _id: room._id },
                                {
                                    $pull: {
                                        members: {
                                            socketID: socket.id,
                                        },
                                    },
                                }
                            );

                            const roomMembers = await Room.findOne({
                                roomName: room.roomName,
                            });
                            const roomsNew = await Room.aggregate([
                                {
                                    $lookup: {
                                        from: "grades",
                                        localField: "gradeId",
                                        foreignField: "_id",
                                        as: "grade",
                                    },
                                },

                            ]);

                            io.sockets.emit("server-send-rooms", roomsNew);
                            io.sockets
                                .in(room.roomName)
                                .emit(
                                    "server-send-members-in-room",
                                    roomMembers.members
                                );
                        }
                    });
                }
            }
        });

        // delete socket when disconnect
        ranks = ranks.filter(
            (item) => item.socketID === socket.id && ranks.indexOf(item) === -1
        );

        users_answered = users_answered.filter(
            (item) =>
                item.socketID === socket.id &&
                users_answered.indexOf(item) === -1
        );
    });


    // chat all
    socket.on("user-send-message", (data) => {
        countMessage++;
        let message = data.message;
        messages.forEach((item) => {
            if (message.toLowerCase().includes(item)) {
                message = message.replace(item, "***");
                return;
            }
        });
        data.message = message;

        io.sockets.emit("server-send-message", data);
        socket.broadcast.emit("server-send-count-message", countMessage);
    });

    // handle typing messages
    socket.on("writing-message", (data) => {
        countMessage = 0;
        io.sockets.emit("user-writing-message", data);
        socket.emit("server-send-count-message", countMessage);
    });

    // handle stopping messages
    socket.on("stopping-message", () => {
        io.sockets.emit("user-stopping-message");
    });


    // create room
    socket.on("create-room", async (data) => {
        var roomId = data.username;
        socket.join(roomId);
        socket.room = roomId;

        // save db
        const room = new Room({
            roomName: roomId,
            socketID: socket.id,
            master: data.name,
            avatar: data.avatar,
            gradeId: data.grade,
            number: data.number,
        });
        await room.save();

        const rooms = await Room.aggregate([
            {
                $lookup: {
                    from: "grades",
                    localField: "gradeId",
                    foreignField: "_id",
                    as: "grade",
                },
            }
        ]);

        io.sockets.emit("server-send-rooms", rooms);
        socket.emit("room-id", roomId);
        // console.log(socket.adapter.rooms);
    });


    // start-room
    socket.on("handle-start-room", async (data) => {
        io.sockets.in(data.roomId).emit("server-send-starting", data.roomId);
        await Room.updateOne({ roomName: data.roomId, status: "Đang thi..." });

        const rooms = await Room.aggregate([
            {
                $lookup: {
                    from: "grades",
                    localField: "gradeId",
                    foreignField: "_id",
                    as: "grade",
                },
            },
        ]);
        io.sockets.emit("server-send-rooms", rooms);

        users_scored.push({
            roomId: data.roomId,
            score: 0,
        });
    });
    async function loadQuestions(lessonIdArray) {
       
    }
    ///server-send-question
    socket.on("room-request-questions", async (data) => {
        const room = await Room.findOne({ roomName: data.roomId });
        if (room) {
            //update score in room
            users_scored.forEach((item) => {
                if (item.roomId === room.roomName) {
                    item.score = 20;
                }
            });

            var subject = await Subject.findOne({ gradeID: room.gradeId, name: "Phần Lý Thuyết" });
            const units = await Unit.find({ subjectID: subject._id });
            const unitIdArray = units.map(({ _id }) => _id);
            const lessons = await Lesson.aggregate([
                { $match: { unitID: { $in: unitIdArray } } },
                {
                    $lookup: {
                        from: "theories",
                        localField: "_id",
                        foreignField: "lessonID",
                        as: "theory",
                    },
                },
                {
                    $lookup: {
                        from: "exercises",
                        localField: "_id",
                        foreignField: "lessonID",
                        as: "exercises",
                    },
                },
                {
                    $lookup: {
                        from: "statisticals",
                        localField: "_id",
                        foreignField: "lessionID",
                        as: "statisticals",
                    },
                },
            ]);
            const lessonIdArray = lessons.map(({ _id }) => _id);
            const questions = await Exercise.aggregate([
                {
                    $match: { lessonID: { $in: lessonIdArray } }
                },
                {
                    $lookup: {
                        from: "exercise-categories",
                        localField: "ceID",
                        foreignField: "_id",
                        as: "cate",
                    },
                },
                { "$sample": { "size": 5 } }
            ]);

            if (data.indexQuestion <= questions.length - 1) {
                const obj = {
                    indexNumberQuestion: data.indexQuestion + 1,
                    questionsLength: questions.length,
                    question: questions[data.indexQuestion],
                };
                socket.emit("server-send-question", obj);
            } else {
                // load ranks when finished competition
                let ranksClient = [];
                ranksClient = ranks.filter(
                    (item) => item.roomId === data.roomId
                );

                let grouped = [];
                ranksClient.forEach(
                    (function (hash) {
                        return function (item) {
                            if (!hash[item.socketID]) {
                                hash[item.socketID] = {
                                    socketID: item.socketID,
                                    score: 0,
                                    answeredCorrect: 0,
                                    roomId: item.roomId,
                                    fullname: item.fullname,
                                    avatar: item.avatar,
                                    username: item.currentUser,
                                };
                                grouped.push(hash[item.socketID]);
                            }
                            hash[item.socketID].score += +item.score;
                            hash[item.socketID].answeredCorrect +=
                                +item.answeredCorrect;
                        };
                    })(Object.create(null))
                );

                grouped.sort(function (a, b) {
                    return b.score - a.score;
                });

                io.sockets
                    .in(data.roomId)
                    .emit("server-send-finished", grouped);

                grouped.forEach(async (item, index) => {
                    const username = item.username.split("@").join("");
                    const user = await User.findOne({
                        username: username,
                    });
                    const checkUser = await Rank.findOne({ userID: user._id });
                    if (checkUser && index === 0) {
                        await Rank.updateOne(
                            { userID: user._id },
                            {
                                $inc: {
                                    score: item.score,
                                    victory: 1,
                                },
                            }
                        );
                    } else if (checkUser) {
                        await Rank.updateOne(
                            { userID: user._id },
                            {
                                $inc: {
                                    score: item.score,
                                },
                            }
                        );
                    } else if (!checkUser && index === 0) {
                        let rank = new Rank({
                            userID: user._id,
                            score: item.score,
                            victory: 1,
                        });
                        await rank.save();
                    } else if (!checkUser) {
                        let rank = new Rank({
                            userID: user._id,
                            score: item.score,
                            victory: 0,
                        });
                        await rank.save();
                    }
                });

                // throw multiple array away form server
                ranks = ranks.filter(
                    (item) =>
                        item.roomId === data.roomId &&
                        ranks.indexOf(item) === -1
                );

                users_scored = users_scored.filter(
                    (item) =>
                        item.roomId === data.roomId &&
                        users_scored.indexOf(item) === -1
                );

                users_answered = users_answered.filter(
                    (item) =>
                        item.roomId === data.roomId &&
                        users_answered.indexOf(item) === -1
                );

                // load ranks in competition
                const ranksCompetition = await Rank.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "userID",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    {
                        $sort: { score: -1, victory: -1 },
                    },
                ]);

                io.sockets.emit(
                    "server-send-ranks-in-competition",
                    ranksCompetition
                );
            }
        }
    });




    ///sever-send--option
    socket.on("user-send-option", async (data) => {
        const room = await Room.findOne({ roomName: data.roomId });
        if (room) {
            let ranksInRoom = [];
            let totalScore = 0;

            users_scored.forEach((item) => {
                if (item.roomId === data.roomId) {
                    totalScore = item.score;
                }
            });

            if (
                data.currentQuestion.answer === data.optionValue &&
                totalScore === 20
            ) {
                const obj = {
                    roomId: data.roomId,
                    score: 20,
                    socketID: socket.id,
                    fullname: data.fullname,
                    avatar: data.avatar,
                    currentUser: data.currentUser,
                    answeredCorrect: data.answeredCorrect,
                };
                ranks.push(obj);

                ranks.forEach((rank) => {
                    if (rank.roomId === data.roomId) {
                        ranksInRoom.push(rank);
                    }
                });

                let grouped = [];
                ranksInRoom.forEach(
                    (function (hash) {
                        return function (item) {
                            if (!hash[item.socketID]) {
                                hash[item.socketID] = {
                                    socketID: item.socketID,
                                    score: 0,
                                    roomId: item.roomId,
                                    fullname: item.fullname,
                                    avatar: item.avatar,
                                };
                                grouped.push(hash[item.socketID]);
                            }
                            hash[item.socketID].score += +item.score;
                        };
                    })(Object.create(null))
                );

                //  -- handle users answered --
                const objTemp = {
                    roomId: data.roomId,
                    socketID: socket.id,
                };
                users_answered.push(objTemp);

                let lengthUsersAnswered = users_answered.filter(
                    (item) => item.roomId === data.roomId
                );

                if (lengthUsersAnswered.length === room.members.length + 1) {
                    users_answered = users_answered.filter(
                        (item) =>
                            item.roomId === data.roomId &&
                            users_answered.indexOf(item) === -1
                    );

                    io.sockets
                        .in(data.roomId)
                        .emit("server-send-next-question");
                }

                // handle sort ranks
                grouped.sort(function (a, b) {
                    return b.score - a.score;
                });

                io.sockets.in(data.roomId).emit("server-send-score", grouped);

                users_scored.forEach((item) => {
                    if (item.roomId === data.roomId) {
                        item.score = 20;
                    }
                });
            } else if (
                data.currentQuestion.answer === data.optionValue &&
                totalScore === 15
            ) {
                const obj = {
                    roomId: data.roomId,
                    score: 20,
                    socketID: socket.id,
                    fullname: data.fullname,
                    avatar: data.avatar,
                    currentUser: data.currentUser,
                    answeredCorrect: data.answeredCorrect,
                };
                ranks.push(obj);

                ranks.forEach((rank) => {
                    if (rank.roomId === data.roomId) {
                        ranksInRoom.push(rank);
                    }
                });

                let grouped = [];
                ranksInRoom.forEach(
                    (function (hash) {
                        return function (item) {
                            if (!hash[item.socketID]) {
                                hash[item.socketID] = {
                                    socketID: item.socketID,
                                    score: 0,
                                    roomId: item.roomId,
                                    fullname: item.fullname,
                                    avatar: item.avatar,
                                };
                                grouped.push(hash[item.socketID]);
                            }
                            hash[item.socketID].score += +item.score;
                        };
                    })(Object.create(null))
                );

                //  -- handle users answered --
                const objTemp = {
                    roomId: data.roomId,
                    socketID: socket.id,
                };
                users_answered.push(objTemp);

                let lengthUsersAnswered = users_answered.filter(
                    (item) => item.roomId === data.roomId
                );

                if (lengthUsersAnswered.length === room.members.length + 1) {
                    users_answered = users_answered.filter(
                        (item) =>
                            item.roomId === data.roomId &&
                            users_answered.indexOf(item) === -1
                    );

                    io.sockets
                        .in(data.roomId)
                        .emit("server-send-next-question");
                }

                // handle sort ranks
                grouped.sort(function (a, b) {
                    return b.score - a.score;
                });
                io.sockets.in(data.roomId).emit("server-send-score", grouped);

                users_scored.forEach((item) => {
                    if (item.roomId === data.roomId) {
                        item.score = 10;
                    }
                });
            } else if (
                data.currentQuestion.answer === data.optionValue &&
                totalScore === 10
            ) {
                const obj = {
                    roomId: data.roomId,
                    score: 10,
                    socketID: socket.id,
                    fullname: data.fullname,
                    avatar: data.avatar,
                    currentUser: data.currentUser,
                    answeredCorrect: data.answeredCorrect,
                };
                ranks.push(obj);
                ranks.forEach((rank) => {
                    if (rank.roomId === data.roomId) {
                        ranksInRoom.push(rank);
                    }
                });

                let grouped = [];
                ranksInRoom.forEach(
                    (function (hash) {
                        return function (item) {
                            if (!hash[item.socketID]) {
                                hash[item.socketID] = {
                                    socketID: item.socketID,
                                    score: 0,
                                    roomId: item.roomId,
                                    fullname: item.fullname,
                                    avatar: item.avatar,
                                };
                                grouped.push(hash[item.socketID]);
                            }
                            hash[item.socketID].score += +item.score;
                        };
                    })(Object.create(null))
                );

                //  -- handle users answered --
                const objTemp = {
                    roomId: data.roomId,
                    socketID: socket.id,
                };
                users_answered.push(objTemp);

                let lengthUsersAnswered = users_answered.filter(
                    (item) => item.roomId === data.roomId
                );

                if (lengthUsersAnswered.length === room.members.length + 1) {
                    users_answered = users_answered.filter(
                        (item) =>
                            item.roomId === data.roomId &&
                            users_answered.indexOf(item) === -1
                    );

                    io.sockets
                        .in(data.roomId)
                        .emit("server-send-next-question");
                }

                // handle sort ranks
                grouped.sort(function (a, b) {
                    return b.score - a.score;
                });
                io.sockets.in(data.roomId).emit("server-send-score", grouped);
            } else {
                const obj = {
                    roomId: data.roomId,
                    score: 0,
                    socketID: socket.id,
                    fullname: data.fullname,
                    avatar: data.avatar,
                    currentUser: data.currentUser,
                    answeredCorrect: data.answeredCorrect,
                };
                ranks.push(obj);

                ranks.forEach((rank) => {
                    if (rank.roomId === data.roomId) {
                        ranksInRoom.push(rank);
                    }
                });

                let grouped = [];
                ranksInRoom.forEach(
                    (function (hash) {
                        return function (item) {
                            if (!hash[item.socketID]) {
                                hash[item.socketID] = {
                                    socketID: item.socketID,
                                    score: 0,
                                    roomId: item.roomId,
                                    fullname: item.fullname,
                                    avatar: item.avatar,
                                };
                                grouped.push(hash[item.socketID]);
                            }
                            hash[item.socketID].score += +item.score;
                        };
                    })(Object.create(null))
                );

                //  -- handle users answered --
                const objTemp = {
                    roomId: data.roomId,
                    socketID: socket.id,
                };
                users_answered.push(objTemp);

                let lengthUsersAnswered = users_answered.filter(
                    (item) => item.roomId === data.roomId
                );

                if (lengthUsersAnswered.length === room.members.length + 1) {
                    users_answered = users_answered.filter(
                        (item) =>
                            item.roomId === data.roomId &&
                            users_answered.indexOf(item) === -1
                    );

                    io.sockets
                        .in(data.roomId)
                        .emit("server-send-next-question");
                }

                // handle sort ranks
                grouped.sort(function (a, b) {
                    return b.score - a.score;
                });
                io.sockets.in(data.roomId).emit("server-send-score", grouped);
            }
        }
    });






    // user tham gia vào phòng
    socket.on("client-send-room-name", async (data) => {
        socket.join(data.roomId);

        const room = await Room.findOne({ roomName: data.roomId });
        if (room) {
            if (room.roomName === data.userName) {
                // user là chủ phòng
                // await room.update({ socketID: socket.id });
                await Room.updateOne(
                    { roomName: data.roomId },
                    { socketID: socket.id }
                );
            } else {
                // user ko phải là chủ phòng
                let flag = false;
                room.members.forEach((member) => {
                    if (member.userName === data.userName) {
                        flag = true;
                    }
                });

                if (flag) {
                    await Room.updateOne(
                        { roomName: room.roomName },
                        {
                            $pull: {
                                members: {
                                    userName: data.userName,
                                },
                            },
                        }

                    );
                    await Room.updateOne(
                        { roomName: room.roomName },
                        {
                            $push: {
                                members: {
                                    $each: [
                                        {
                                            socketID: socket.id,
                                            userName: data.userName,
                                            avatar: data.avatar,
                                            fullname: data.fullname,
                                        },
                                    ],
                                },
                            },
                        }
                    );
                } else {
                    await Room.updateOne(
                        { roomName: room.roomName },
                        {
                            $push: {
                                members: {
                                    $each: [
                                        {
                                            socketID: socket.id,
                                            userName: data.userName,
                                            avatar: data.avatar,
                                            fullname: data.fullname,
                                        },
                                    ],
                                },
                            },
                        }
                    );
                }

                const roomMembers = await Room.findOne({
                    roomName: data.roomId,
                });

                if (roomMembers.members.length === roomMembers.number) {
                    // await roomMembers.update({ status: "Full" });
                    await Room.updateOne(
                        {
                            roomName: data.roomId,
                        },
                        { status: "Full" }
                    );
                }

                const rooms = await Room.aggregate([
                    {
                        $lookup: {
                            from: "grades",
                            localField: "gradeId",
                            foreignField: "_id",
                            as: "grade",
                        },
                    },
                ]);

                io.sockets.emit("server-send-rooms", rooms);
                io.sockets
                    .in(data.roomId)
                    .emit("server-send-members-in-room", roomMembers.members);
            }

            const roomMembers = await Room.findOne({ roomName: data.roomId });
            io.sockets
                .in(data.roomId)
                .emit(
                    "server-send-length-members-in-room",
                    roomMembers.members.length
                );
        }
    });


    // user roi phong
    socket.on("client-handle-out-room", async (data) => {
        const room = await Room.findOne({ roomName: data });
        // nếu là chủ phòng
        if (socket.id === room.socketID) {
            io.sockets.in(data).emit("master-handle-out-room");
            await Room.deleteOne({ roomName: data });

            const rooms = await Room.aggregate([
                {
                    $lookup: {
                        from: "grades",
                        localField: "gradeId",
                        foreignField: "_id",
                        as: "grade",
                    },
                },

            ]);
            io.sockets.emit("server-send-rooms", rooms);
        } else {
            // nếu ko phải là chủ phòng
            await Room.updateOne(
                { roomName: data },
                {
                    status: "Đang chờ...",
                    $pull: {
                        members: {
                            socketID: socket.id,
                        },
                    },
                }
            );
            const roomMembers = await Room.findOne({ roomName: data });
            const rooms = await Room.aggregate([
                {
                    $lookup: {
                        from: "grades",
                        localField: "gradeId",
                        foreignField: "_id",
                        as: "grade",
                    },
                },
            ]);

            const roomMembersLength = await Room.findOne({ roomName: data });
            io.sockets
                .in(data)
                .emit(
                    "server-send-length-members-in-room",
                    roomMembersLength.members.length
                );

            io.sockets.emit("server-send-rooms", rooms);
            io.sockets
                .in(data)
                .emit("server-send-members-in-room", roomMembers.members);
        }
    });




    // tìm kiếm theo Lớp
    socket.on("user-filter-option-grade", async (data) => {
        const rooms = await Room.aggregate([
            {
                $match: { gradeId: ObjectId(data) },
            },
            {
                $lookup: {
                    from: "grades",
                    localField: "gradeId",
                    foreignField: "_id",
                    as: "grade",
                },
            },

        ]);

        socket.emit("server-send-rooms", rooms);
    });


    // tìm kiếm theo tên chủ phòng
    socket.on("user-search", async (data) => {
        if (data !== "") {
            const rooms = await Room.aggregate([
                {
                    $match: {
                        master: { $regex: data, $options: "i" },
                    },
                },
                {
                    $lookup: {
                        from: "grades",
                        localField: "gradeId",
                        foreignField: "_id",
                        as: "grade",
                    },
                },

            ]);
            socket.emit("server-send-rooms", rooms);
        } else {
            const rooms = await Room.aggregate([
                {
                    $lookup: {
                        from: "grades",
                        localField: "gradeId",
                        foreignField: "_id",
                        as: "grade",
                    },
                },
            ]);
            socket.emit("server-send-rooms", rooms);
        }
    });


});



let port = process.env.PORT || 8888;
var listener = server.listen(port, function () {
    console.log("Listening on port " + listener.address().port);
});