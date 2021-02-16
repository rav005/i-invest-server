const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/', (req, resp) => {
    resp.status(200).send({ message: 'user GET' });
});

router.post('/register', async (req, resp) => {
    console.log('req body: ', req.body);
    const user = new User(req.body);
    var valid = await user.validate().catch(err => {
        if (err.errors.username) {
           console.log('Username validation error: ', err.errors.username.message);
        }
        if (err.errors.password) {
            console.log('Password validation failed: ', err.errors.password.message);
        }
    });
    console.log('user: ', user, 'isValid: ', valid);
    resp.status(200).send({ message: 'user GET' });
});

module.exports = router;
