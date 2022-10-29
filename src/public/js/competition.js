const socket = io();

// chat all
socket.on("server-send-count-message", (data) => {
    data === 0 ? $("#count-message").html("") : $("#count-message").html(data);
});

socket.on("server-send-message", (data) => {
    if (data.username === $(".user__info .username").text()) {
        $(".msg-content").append(`
                    <div class='msg right-msg'>
                        <div class='ms-2'>
                            <div class='msg-img' style='background-image: url(${data.avatar})'></div>
                        </div>
                        <div class='msg-bubble'>
                            <div class='msg-info'>
                                <div class='msg-info-name'>${data.name}</div>
                                <div class='msg-info-time'>${data.time}</div>
                            </div>
                            <div class='msg-text'>${data.message}</div>
                        </div>
                    </div>
                `);
    } else {
        $(".msg-content").append(`
                    <div class='msg left-msg'>
                        <div class='me-2'>
                            <div class='msg-img' style='background-image: url(${data.avatar})'></div>
                        </div>
                        <div class='msg-bubble'>
                            <div class='msg-info'>
                                <div class='msg-info-name'>${data.name}</div>
                                <div class='msg-info-time'>${data.time}</div>
                            </div>
                            <div class='msg-text'>${data.message}</div>
                        </div>
                    </div>
                `);
    }
});

socket.on("user-writing-message", (data) => {
    if (data.username === $(".user__info .username").text()) {
        $(".msg-loading").html("");
    } else {
        $(".msg-loading").html(`
                    <div class='msg left-msg'>
                        <div class='me-2'>
                            <div class='msg-img' style='background-image: url(${data.avatar})'></div>
                        </div>
                        <div class='msg-bubble'>
                            <img src='/img/loading.gif' width='40' />
                        </div>
                    </div>
                `);
    }
});

socket.on("user-stopping-message", () => {
    $(".msg-loading").html("");
});

// create-room
socket.on("server-send-rooms", (data) => {
    $("table tbody").html("");
    data.map((room, index) => {
        var status = room.status;
        $("table tbody").append(`
            <tr class='align-middle' style='line-height: 1.5' id='${
                room.roomName
            }'>
                <td class='pt-3 pb-3' scope='row'>${index + 1}</td>
                <td>
                    <img class='rounded-pill' src=${
                        room.avatar
                    } width=30 height=30 />
                    <span class='ms-2'>${room.master}</span>
                </td>
                <td>${room.gradeID}</td>
                <td>
                    <span class='fw-bold'>${room.subject[0].name}:</span>
                    <span>${room.lession[0].name}</span>
                </td>
                <td class='text-center length-members'>${
                    room.members.length + 1
                }/2</td>
                <td class='fw-bold status ${
                    status === "Đang thi..." ? "text-warning" : "text-success"
                }'>${status}</td>
                <td>
                    <a class='text-primary' ${
                        status === "Full" || status === "Đang thi..."
                            ? `href="javascript:void(0)" style="opacity: 0.3; cursor: none"`
                            : `href='/competition/${room.roomName}'`
                    }>Tham gia</a>
                </td>
            </tr>
        `);
    });
});

socket.on("server-send-ranks-in-competition", (data) => {
    $(".leaderboard div ol").html("");
    data.map((item) => {
        $(".leaderboard div ol").append(`
            <li>
                <img class="rounded-circle" src="${item.user[0].avatar}" width="30" height="30" style="object-fit: cover" />
                <mark>${item.user[0].fullname}</mark>
                <small>${item.score}</small>
            </li>
        `);
    });
});

$(document).ready(function () {
    var chat = $(".chat");
    var chatShow = $(".chat-show");
    var closeChat = $(".msger-header-options");
    var toggledLeaderboard = false;

    closeChat.click(function () {
        chat.hide(400);
        chatShow.show(400);
    });

    chatShow.click(function () {
        $(this).hide(400);
        chat.show(400);
    });

    $(".leaderboard h1").click(function () {
        $(this).parent().toggleClass("active");

        toggledLeaderboard = !toggledLeaderboard;
        $(".leaderboard button").attr(
            "style",
            toggledLeaderboard ? "display: none !important" : ""
        );
    });

    // send message when click send btn
    $(".msger-send-btn").click(function () {
        if ($(".msger-input").val() === "") {
            return;
        }

        var dt = new Date();
        let time;
        if (dt.getMinutes() > 9) {
            time = dt.getHours() + ":" + dt.getMinutes();
        } else {
            time = dt.getHours() + ":" + "0" + dt.getMinutes();
        }
        var data = {
            name: $(".user__info .name").text(),
            username: $(".user__info .username").text(),
            avatar: $(".user__avatar img").attr("src"),
            message: $(".msger-input").val(),
            time: time,
        };
        socket.emit("user-send-message", data);
        $(".msger-input").val("");
    });

    // send message when press enter
    $(".msger-input").keyup(function (e) {
        if ($(this).val() === "") {
            return;
        }

        if (e.keyCode === 13) {
            var dt = new Date();
            let time;
            if (dt.getMinutes() > 9) {
                time = dt.getHours() + ":" + dt.getMinutes();
            } else {
                time = dt.getHours() + ":" + "0" + dt.getMinutes();
            }
            var data = {
                name: $(".user__info .name").text(),
                username: $(".user__info .username").text(),
                avatar: $(".user__avatar img").attr("src"),
                message: $(".msger-input").val(),
                time: time,
            };
            socket.emit("user-send-message", data);
            $(this).val("");
        }
    });

    // typing when chat
    $(".msger-input").focusin(function () {
        var data = {
            username: $(".user__info .username").text(),
            avatar: $(".user__avatar img").attr("src"),
        };
        socket.emit("writing-message", data);
    });

    $(".msger-input").focusout(function () {
        socket.emit("stopping-message");
    });

    // btn click create room
    $("#btn-create-room").click(function () {
        var data = {
            name: $(".user__info .name").text(),
            avatar: $(".user__avatar img").attr("src"),
            username: $(".user__info .username").text(),
            grade: $("#select-grade").val(),
            subject: $("#select-subject").val(),
            unit: $("#select-unit").val(),
            lession: $("#select-lession").val(),
        };

        if (
            data.grade === null ||
            data.subject === null ||
            data.unit === null ||
            data.lession === null
        ) {
            alert("Bạn vui lòng chọn đầy đủ thông tin để tạo phòng!");
            return;
        }

        socket.emit("create-room", data);
        socket.on("room-id", function (response) {
            // $("#btn-cancel-room").click();
            window.location.href = `/competition/${response}`;
        });
    });

    // select option to create a new room
    $("#select-grade").change(function () {
        socket.emit("user-send-option-grade", $(this).val());
    });

    $("#select-subject").change(function () {
        socket.emit("user-send-option-subject", $(this).val());
    });

    $("#select-unit").change(function () {
        socket.emit("user-send-option-unit", $(this).val());
    });

    $("#select-lession").change(function () {
        socket.emit("user-send-option-lession", $(this).val());
    });

    // filter select grade
    $("#select-filter-grade").change(function () {
        socket.emit("user-filter-option-grade", $(this).val());
    });

    // search
    $("#search-client").keyup(function () {
        socket.emit("user-search", $(this).val());
        console.log($(this).val());
    });

    // get ranks by weeks, months
    let currentWeek = 0;
    let currentMonth = 0;
    let isActive = false;

    $(".btn-month-ranks, .btn-week-ranks").click(function () {
        $("#ranksDetailModal button").removeClass("active");
        $(this).addClass("active");
    });

    $(".btn-week-ranks, .leaderboard button").click(function () {
        isActive = true;
        loading();
        showWeeks(0);
    });

    $(".btn-month-ranks").click(function () {
        isActive = false;
        loading();
        showMonths(0);
    });

    $(".tab-rank .icon-chevron-back").click(function () {
        loading();
        isActive ? showWeeks(-1) : showMonths(-1);
    });

    $(".tab-rank .icon-chevron-forward").click(function () {
        loading();
        isActive ? showWeeks(1) : showMonths(1);
    });

    function loading() {
        $("#ranksDetailModal table tbody").html("");
        $("#ranksDetailModal table tbody").append(`
            <tr id="#spinner-loading">
                <td colspan='4'>
                    <div class="d-flex justify-content-center">
                        <div class="spinner-grow" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </td>
            </tr>
        `);
    }

    function showWeeks(e) {
        if (e == 1) {
            currentWeek = currentWeek + 1;
        } else if (e == -1) {
            currentWeek = currentWeek - 1;
        } else {
            currentWeek = 0;
        }

        let startOfWeek, endOfWeek;
        if (currentWeek == 0) {
            startOfWeek = moment().startOf("isoWeek");
            endOfWeek = moment().endOf("isoWeek");
        } else if (currentWeek > 0) {
            startOfWeek = moment().add(currentWeek, "weeks").startOf("isoWeek");
            endOfWeek = moment().add(currentWeek, "weeks").endOf("isoWeek");
        } else {
            startOfWeek = moment().add(currentWeek, "weeks").startOf("isoWeek");
            endOfWeek = moment().add(currentWeek, "weeks").endOf("isoWeek");
        }

        $(".tab-rank strong").text(
            startOfWeek.format("DD/MM") + " - " + endOfWeek.format("DD/MM")
        );

        $.ajax({
            type: "POST",
            url: "/competition/ranks/week",
            contentType: "application/json",
            data: JSON.stringify({
                startOfWeek: startOfWeek,
                endOfWeek: endOfWeek,
            }),
            success: function (data) {
                setTimeout(function () {
                    $("#spinner-loading").hide();
                    $("#ranksDetailModal table tbody").replaceWith(data);
                }, 2000);
            },
        });
    }

    function showMonths(e) {
        if (e == 1) {
            currentMonth = currentMonth + 1;
        } else if (e == -1) {
            currentMonth = currentMonth - 1;
        } else {
            currentMonth = 0;
        }

        let month;
        if (currentWeek == 0) {
            month = moment();
        } else if (currentWeek > 0) {
            month = moment().add(currentMonth, "months");
        } else {
            month = moment().add(currentMonth, "months");
        }

        $(".tab-rank strong").text("Tháng " + month.format("MM/YYYY"));

        $.ajax({
            type: "POST",
            url: "/competition/ranks/month",
            contentType: "application/json",
            data: JSON.stringify({
                month: month,
            }),
            success: function (data) {
                setTimeout(function () {
                    $("#spinner-loading").hide();
                    $("#ranksDetailModal table tbody").replaceWith(data);
                }, 2000);
            },
        });
    }
});

socket.on("server-send-list-subject-of-user-grade-option", (data) => {
    $("#select-subject").html("");
    data.map((subject) => {
        $("#select-subject").append(`
            <option value=${subject._id}>${subject.name}</option>
        `);
    });
});

socket.on("server-send-list-unit-of-user-subject-option", (data) => {
    $("#select-unit").html("");
    data.map((unit) => {
        $("#select-unit").append(`
            <option value=${unit._id}>${unit.name}</option>
        `);
    });
});

socket.on("server-send-list-lession-of-user-unit-option", (data) => {
    $("#select-lession").html("");
    data.map((lession) => {
        $("#select-lession").append(`
            <option value=${lession._id}>${lession.name}</option>
        `);
    });
});
