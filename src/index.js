const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require("cookie-parser");

const methodOverride = require('method-override');
const handlebars = require('express-handlebars').engine;
const moment = require("moment");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const port = 8888;

const route  = require('./routes');
const db = require('./config/db');

//Connect to db 
db.connect();

app.use(express.static(path.join(__dirname, 'public')));


app.use(cookieParser(process.env.SESSION_SECRET));

app.use(
  express.urlencoded({
      extended: true,
  }),
  );
app.use(morgan('combined'));

app.use(express.json());

app.use(methodOverride('_method'));

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


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})