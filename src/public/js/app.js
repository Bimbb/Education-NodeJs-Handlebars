$(document).ready(function () {
    const userAva = $(".header__actions--avatar img");
    const userMenu = $(".header__actions--userMenu");
    const actionsUser = $(".header__actions--user");
    const notiUser = $(".header__actions--noti");
    const notiUserIcon = $(".header__actions--notiIcon");
    const notiMenu = $(".header__actions--notiMenu");
    const sidebarCreateBtn = $(".sidebar .create__button");

    // const notiMenuItem = $(".header__actions--notiMenu ul li a");
    // $.each(notiMenuItem, function (index, val) {
    //     val.onclick = function () {
    //         console.log(123);
    //     };
    // });

    userAva.click(function (e) {
        userMenu.toggleClass("show");
    });

    sidebarCreateBtn.click(function () {
        $(this).toggleClass("show");
        $(".sidebar .sidebar__menu").toggleClass("show");
    });

    notiUserIcon.click(function () {
        notiMenu.toggleClass("show");
    });

    $(document).click(function (e) {
        // Nếu click bên ngoài đối tượng container thì ẩn nó đi
        if (
            !actionsUser.is(e.target) &&
            actionsUser.has(e.target).length == 0
        ) {
            userMenu.removeClass("show");
        }

        if (
            !sidebarCreateBtn.is(e.target) &&
            sidebarCreateBtn.has(e.target).length == 0
        ) {
            $(".sidebar .sidebar__menu, .sidebar .create__button").removeClass(
                "show"
            );
        }

        if (!notiUser.is(e.target) && notiUser.has(e.target).length == 0) {
            notiMenu.removeClass("show");
        }
    });

    $(function () {
        $(".subjects__item .brand").each(function (index) {
            var colorR = Math.floor(Math.random() * 256);
            var colorG = Math.floor(Math.random() * 256);
            var colorB = Math.floor(Math.random() * 256);
            $(this).css(
                "background-color",
                "rgb(" + colorR + "," + colorG + "," + colorB + ")"
            );
        });
    });

    // Highlight the active link in a navigation menu
    $(function () {
        var path = window.location.href;
        $(".sidebar li a, .sidebar__mobile li a").each(function () {
            if (this.href === path) {
                $(this).addClass("active");
            }
        });
    });

    //Recommend question
    $(".recommend-header").click(function () {
        var parent = $(this).parent();
        parent.find(".recommend-body").slideToggle();
    });

    $(".explain-header").click(function () {
        var parent = $(this).parent();
        parent.find(".explain-body").slideToggle();
    });
});
