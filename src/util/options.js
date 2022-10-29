module.exports = {
    formate: "A3",
    orientation: "portrait",
    border: "10mm",
    footer: {
        height: "20mm",
        contents: {
            first: "Trang 1",
            2: "Trang 2",
            default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
            last: "Trang cuối",
        },
    },
};
