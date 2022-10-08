const express = require('express');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');
const handlebars = require('express-handlebars').engine;
const app = express();
const port = 3000;

const route  = require('./routes');
const db = require('./config/db');

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



///Templates engine
app.engine('hbs',
    handlebars({
        extname: '.hbs',
        helpers:{
          sum :(a, b) => a + b,
        }
    }),
);

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'resources', 'views'));

///Route init
route(app);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})