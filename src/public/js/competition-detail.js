const socket = io();
var roomId = $("#roomId").val();
let indexQuestion = 0;
let checkNextQuestion = false;
let playerTime = 30;

//- xử lý user tham gia vào phòng
socket.emit("client-send-room-name", {
    roomId: roomId,
    userName: $(".user__info .username").text(),
    fullname: $(".user__info .name").text(),
    avatar: $(".user__avatar img").attr("src"),
});

//- real time thành viên khi join phòng
socket.on("server-send-members-in-room", (data) => {
    $(".members .row").html("");
    data.map((member) => {
        $(".members .row").append(`
            <div class='col-sm-4'>
                <div class='card mb-4'>
                    <div class='card-body'>
                        <div class='d-flex align-items-center'>
                            <img src='${member.avatar}' class='rounded-circle' width=100 height=100 style='object-fit: cover' />
                            <div class='ms-4'>
                                <span class='text-warning fw-bold'>Thành viên</span>
                                <span class='d-block mt-2'>${member.fullname}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    });
});

socket.on("server-send-starting", (data) => {
    $("#overlay").show();
    var counter = 10;
    var interval = setInterval(function() {
        $('.countdown').text(counter);
        counter--;
        if (counter <= 0) {
            clearInterval(interval);
            handleShowHide();
            socket.emit("room-request-questions", {roomId: data, indexQuestion: 0});
            return;
        } else {
            $('.countdown').text(counter);
        }
    }, 1000);

    function handleShowHide() {
        $("#overlay").hide();
        $("#btn-start").attr("style", "display: none !important");
        $("#btn-copy-link").attr("style", "display: none !important");
        $(".master").attr("style", "display: none !important");
        $(".members").hide();
        $('button[data-bs-target="#outRoomModal"]').attr("style", "position: absolute; right: 3rem");
        $(".leaderboard").show();
        $(".quiz").attr("style", "display: flex");
    }
})

socket.on("server-send-question", (data) => {
    $(".quiz").html("");
    $(".quiz").append(`
        <div class="game-quiz-container">
            <div class="game-details-container">
                <h1>Câu hỏi: <span id="question-number">${data.indexNumberQuestion}</span> / ${data.questionsLength}</h1>
                <h1><span id="player-time"></span></h1>
               
            </div>

            <div class="game-question-container">
                <h1 id="display-question">${data.question.question}</h1>
            </div>

            <div class="game-options-container">
                <span>
                    <input
                        type="radio"
                        id="option-one"
                        name="option"
                        class="radio"
                        value="${data.question.option1}"
                    />
                    <label
                        for="option-one"
                        class="option"
                        id="option-one-label"
                    >${data.question.option1}</label>
                </span>

                <span>
                    <input
                        type="radio"
                        id="option-two"
                        name="option"
                        class="radio"
                        value="${data.question.option2}"
                    />
                    <label
                        for="option-two"
                        class="option"
                        id="option-two-label"
                    >${data.question.option2}</label>
                </span>

                <span>
                    <input
                        type="radio"
                        id="option-three"
                        name="option"
                        class="radio"
                        value="${data.question.option3}"
                    />
                    <label
                        for="option-three"
                        class="option"
                        id="option-three-label"
                    >${data.question.option3}</label>
                </span>

                <span>
                    <input
                        type="radio"
                        id="option-four"
                        name="option"
                        class="radio"
                        value="${data.question.option4}"
                    />
                    <label
                        for="option-four"
                        class="option"
                        id="option-four-label"
                    >${data.question.option4}</label>
                </span>
            </div>

            <div class="next-button-container">
                <button>
                    Gửi kết quả
                </button>
            </div>
        </div>
    `);
   
    let isClick = false;
    let countClick = 0;
    let answeredCorrect = 0;
    
    countDownTimer();

    $(".next-button-container button").click(function () {
        isClick = true;
        countClick++;

        if (countClick === 1) {
            handleQuestion();
        } else {
            Eggy({
                title: 'Bạn đã hoàn thành câu này',
                message: 'Vui lòng đợi người chơi khác hoàn thành để sang câu tiếp theo!!!',
                type: 'warning',
                duration: 5000,
            });
        }
    })

    function handleQuestion() {
        const currentQuestion = data.question;
        const currentQuestionAnswer = currentQuestion.answer;
        const options = document.getElementsByName("option");
        const currentUser = $(".user__info .username").text();
        const fullname = $(".user__info .name").text();
        const avatar = $(".user__avatar img").attr("src");
        let correctOption = null;

        options.forEach((option) => {
            if (option.value === currentQuestionAnswer) {
                correctOption = option.labels[0].id;
            }
        });

        if (
            options[0].checked === false &&
            options[1].checked === false &&
            options[2].checked === false &&
            options[3].checked === false
        ) {
            //- if (confirm("Bạn muốn bỏ qua câu này?") === false) {
            //-     countClick = 0;
            //-     return false;
            //- }
            answeredCorrect = 0;
            var option = null;
            const obj = {
                roomId: roomId,
                currentQuestion: currentQuestion,
                currentUser: currentUser,
                fullname: fullname,
                avatar: avatar,
                optionValue: option,
                answeredCorrect: answeredCorrect,
            };
            socket.emit("user-send-option", obj);
            indexQuestion++;
        } else {
            let optionValue = null;
            options.forEach((option) => {
                if (option.checked === true && option.value === currentQuestionAnswer) {
                    optionValue = option.value;
                    document.getElementById(correctOption).style.backgroundColor = "#44a500";
                    answeredCorrect = 1;
                } else if (option.checked && option.value !== currentQuestionAnswer) {
                    const wrongLabelId = option.labels[0].id;
                    optionValue = option.value;
                    document.getElementById(wrongLabelId).style.backgroundColor = "#fb5533";
                    document.getElementById(correctOption).style.backgroundColor = "#44a500";
                    answeredCorrect = 0;
                }
            });

            const obj = {
                roomId: roomId,
                currentQuestion: currentQuestion,
                currentUser: currentUser,
                fullname: fullname,
                avatar: avatar,
                optionValue: optionValue,
                answeredCorrect: answeredCorrect,
            };
            socket.emit("user-send-option", obj);
            indexQuestion++;
        }
    }

    function nextQuestion() {
        playerTime = 30;
        const objQuestion = {
            roomId: roomId, 
            indexQuestion: indexQuestion,
        };
        setTimeout(() => {
            socket.emit("room-request-questions", objQuestion);
        },1000);
    }
    
    function countDownTimer() {
        var interval = setInterval(function() {
            $('#player-time').text(playerTime);
            playerTime--;

            if (playerTime <= 0) {
                clearInterval(interval);

                if (!isClick) {
                    handleQuestion();
                    unCheckRadioButtons();
                    nextQuestion();
                    resetOptionBackground();
                    return;
                }

                unCheckRadioButtons();
                nextQuestion();
                resetOptionBackground();
                return;
            } else {
                $('#player-time').text(playerTime);
            }
        }, 1000);
    }

    //sets options background back to null after display the right/wrong colors
    function resetOptionBackground() {
        const options = document.getElementsByName("option");
        options.forEach((option) => {
            document.getElementById(option.labels[0].id).style.backgroundColor = "";
        });
    }

    // unchecking all radio buttons for next question(can be done with map or foreach loop also)
    function unCheckRadioButtons() {
        const options = document.getElementsByName("option");
        for (let i = 0; i < options.length; i++) {
            options[i].checked = false;
        }
    }
});




socket.on("server-send-next-question", (data) => {
    playerTime = 0;
    setTimeout(() => {
        playerTime = 30;
    },1000);
});

socket.on("server-send-score", (data) => {
    $(".leaderboard ol").html("");
    data.map((member) => {
        $(".leaderboard ol").append(`
            <li>
                <img src='${member.avatar}' width=30 height=30 class='rounded-circle' style='object-fit: cover' />
                <mark>${member.fullname}</mark>
                <small>${member.score}</small>
            </li>
        `);
    })
});

socket.on("server-send-finished", (data) => {
    totalAnswerTrue = 0;
    $(".quiz").hide();
   
    $(".overlay_ranking").show();

    data.map((member, index) => {
        if (index === 1) {
            $(".r2").append(`
                <div class="header-ranking">
                    <h3>Hạng 2</h3>
                </div>
                <div class="block1"><img class="rounded-circle" src=${member.avatar} width="50" height="50" />
                    <h2>${member.fullname}</h2>
                </div>
                <div class="block2">
                    <p><strong>Điểm</strong></p>
                    <p>${member.score} điểm</p>
                </div>
                <div class="block3">
                    <p><strong>Số câu đúng</strong></p>
                    <p>${member.answeredCorrect}/${indexQuestion} câu</p>
                </div>
                <div class="block4">
                    <div class="place">2</div>
                </div>
            `);
        } else if (index === 0) {
            $(".r1").append(`
                <div class="header-ranking">
                    <h3>Hạng 1</h3>
                </div>
                <div class="block1"><img class="rounded-circle" src=${member.avatar} width="50" height="50" />
                    <h2>${member.fullname}</h2>
                </div>
                <div class="block2">
                    <p><strong>Điểm</strong></p>
                    <p>${member.score} điểm</p>
                </div>
                <div class="block3">
                    <p><strong>Số câu đúng</strong></p>
                    <p>${member.answeredCorrect}/${indexQuestion} câu</p>
                </div>
                <div class="block4">
                    <div class="place">1</div>
                </div>
            `);
        } else if (index === 2) {
            $(".r3").append(`
                <div class="header-ranking">
                    <h3>Hạng 3</h3>
                </div>
                <div class="block1"><img class="rounded-circle" src=${member.avatar} width="50" height="50" />
                    <h2>${member.fullname}</h2>
                </div>
                <div class="block2">
                    <p><strong>Điểm</strong></p>
                    <p>${member.score} điểm</p>
                </div>
                <div class="block3">
                    <p><strong>Số câu đúng</strong></p>
                    <p>${member.answeredCorrect}/${indexQuestion} câu</p>
                </div>
                <div class="block4">
                    <div class="place">3</div>
                </div>
            `);
        }
    })

    $('#ready').css('display', 'block').addClass('fadeIn');
    setTimeout(function(){
        $('.r3').addClass('slideInUp');
    }, 300);
    setTimeout(function(){
        $('.r2').addClass('slideInUp');
    }, 600);
    setTimeout(function(){
        $('.r1').addClass('slideInUp');
    }, 900);
    setTimeout(function(){
        $('#btn-choose-competition').addClass('slideInUp');
    }, 1200);
})

// handle server send length members to click start
let lengthMembersInRoom = 0;
socket.on("server-send-length-members-in-room", (data) => {
    lengthMembersInRoom = data;

})

//- chủ phòng out room
socket.on("master-handle-out-room", () => {
    alert("Chủ phòng đã rời phòng!");
    window.location.href = `/competition`;
})

$(document).ready(function () {
    var currentUser = $(".user__info .username").text();
    if (roomId !== currentUser) {
        $("#btn-start").attr("style", "display: none !important");
    }

    // copy link
    $("#btn-copy-link").click(function () {
        var link = window.location.href;
        //- link.select();
        //- link.setSelectionRange(0, 99999); /* For mobile devices */
        navigator.clipboard.writeText(link);
        /* Alert the copied text */
        alert("Đã copy link: " + link);
    })

    //- btn out room click
    $("#btn-out-room, #btn-choose-competition").click(function() {
        socket.emit("client-handle-out-room", roomId);
        window.location.href = `/competition`;
    })

    //- btn start room click
    $("#btn-start").click(function() {
        if (lengthMembersInRoom > 0) {
            //- socket.emit("handle-start-room", roomId);
            const obj = {
                roomId: roomId,
                username: $(".user__info .username").text(),
                avatar: $(".user__avatar img").attr("src"),
                fullname: $(".user__info .name").text(),
            };
            socket.emit("handle-start-room", obj);
            return;
        }
        Eggy({
            title: 'Không đủ thành viên',
            message:  'Phòng phải có ít nhất 2 thành viên để bắt đầu thi đấu!!!',
            type: 'warning',
            duration: 5000,
        });
    })

    $(".leaderboard h1").click(function (e) {
        $(this).parent().toggleClass("active");
        $(".leaderboard div").slideToggle();
    })
});