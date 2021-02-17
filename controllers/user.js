const express = require('express');
const router = express.Router();
const User = require('../models/user');
var MongoClient = require('mongodb').MongoClient;


router.get('/', (req, resp) => {
    resp.status(200).send({ message: 'user GET' });
});

router.post('/register', async (req, resp) => {
    console.log('req body: ', req.body);
    const user = new User(req.body);

    require('../services/db').connect();

    user.save(error => {
        if (checkServerError(resp, error)) return;
        resp.status(201).json(user);
        console.log('user created successfully!');
        console.log(user.password);
        user.comparePassword('abc', function (err, isMatch) {
            if (err) throw err;
            console.log('abc:', isMatch); // -&gt; Password123: true
        });

    });



    //console.log('user: ', user);
    //resp.status(200).send({ message: 'user register POST' });
});

function checkServerError(res, error) {
    if (error) {
        res.status(500).send(error);
        return error;
    }
}
module.exports = router;
