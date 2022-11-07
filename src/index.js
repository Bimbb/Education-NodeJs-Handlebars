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

const route  = require('./routes');
const db = require('./config/db');



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


app.use(express.json());


app.use(methodOverride('_method'));


app.use(cookieParser('MY SECRET'));

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
        helpers:{
          sum :(a, b) => a + b,
          formatDate: ( a )=> moment(a).format("DD-MM-YYYY"),
          formatDateYMD: ( a )=> moment(a).format("YYYY-MM-DD"),
          formatString:(a) => a,
          formatDateLocale:(a) =>moment(a).locale("vi").fromNow(),
          round: ( a ) => Math.round(a),
          percent: (a, b) => Math.round((a/b)*100),
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
                                from: "subjects",
                                localField: "subjectID",
                                foreignField: "_id",
                                as: "subject",
                            },
                        },
                        {
                            $lookup: {
                                from: "units",
                                localField: "unitID",
                                foreignField: "_id",
                                as: "unit",
                            },
                        },
                        {
                            $lookup: {
                                from: "lessions",
                                localField: "lessionID",
                                foreignField: "_id",
                                as: "lession",
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
                                        from: "subjects",
                                        localField: "subjectID",
                                        foreignField: "_id",
                                        as: "subject",
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "units",
                                        localField: "unitID",
                                        foreignField: "_id",
                                        as: "unit",
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "lessions",
                                        localField: "lessionID",
                                        foreignField: "_id",
                                        as: "lession",
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
                                        from: "subjects",
                                        localField: "subjectID",
                                        foreignField: "_id",
                                        as: "subject",
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "units",
                                        localField: "unitID",
                                        foreignField: "_id",
                                        as: "unit",
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "lessions",
                                        localField: "lessionID",
                                        foreignField: "_id",
                                        as: "lession",
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
            gradeID: data.grade,
            subjectID: data.subject,
            unitID: data.unit,
            lessionID: data.lession,
        });
        await room.save();

        const rooms = await Room.aggregate([
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectID",
                    foreignField: "_id",
                    as: "subject",
                },
            },
            {
                $lookup: {
                    from: "units",
                    localField: "unitID",
                    foreignField: "_id",
                    as: "unit",
                },
            },
            {
                $lookup: {
                    from: "lessions",
                    localField: "lessionID",
                    foreignField: "_id",
                    as: "lession",
                },
            },
        ]);

        io.sockets.emit("server-send-rooms", rooms);
        socket.emit("room-id", roomId);
        // console.log(socket.adapter.rooms);
    });




    
});



let port = process.env.PORT || 8888;
var listener = server.listen(port, function () {
    console.log("Listening on port " + listener.address().port);
});