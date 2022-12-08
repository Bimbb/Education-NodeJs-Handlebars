const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb+srv://dacn:Mcndctbc2001@cluster0.1hoz6es.mongodb.net/education_dev', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex: true,
        });
        console.log('Connect successfully!!!');
    } catch (error) {
        console.log('Connect failure!!!');
    }
}

module.exports = { connect };
