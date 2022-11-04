
const siteRouter = require('./site');
const userRouter = require('./user');
const subjectsRouter = require("./subjects");
const gradeRouter = require("./grades");
const unitsRouter = require("./units");
const lessonsRouter = require("./lessons");
const theoriesRouter = require("./theories");
const exercisesRouter = require("./exercises");
const blogRouter = require("./blog");
const competitionRouter = require("./competition");
const reportRouter = require("./reports");
const statisticalsRouter = require("./statisticals");

function route(app){

    app.use('/', siteRouter);
    app.use('/user', userRouter);
    app.use("/subjects", subjectsRouter);
    app.use("/grade", gradeRouter);
    app.use("/units", unitsRouter);
    app.use("/lessons", lessonsRouter);
    app.use("/theories", theoriesRouter);
    app.use("/exercises", exercisesRouter);
    app.use("/blog", blogRouter);
    app.use("/competition", competitionRouter);
    app.use("/reports", reportRouter);
    app.use("/statisticals", statisticalsRouter);

}
module.exports = route