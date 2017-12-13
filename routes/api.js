let express = require('express');
let fs = require('fs');
let router = express.Router();
let oauth2Router = express.Router({mergeParams: true});
let jwt = require("jsonwebtoken");

let HACKATHON_SECRET = process.env.HACKATHON_SECRET;

function readFile(filename) {
    return new Promise((success, fail) => {
        fs.readFile(filename, 'utf8', function (err, data) {
            if (err) throw err;
            success(data);
        });
    });
}

function writeFile(filename, data) {
    return new Promise((success, fail) => {
        fs.writeFile(filename, data, 'utf8', function (err) {
            if (err) throw err;
            success();
        });
    });
}

router.use('/oauth2', oauth2Router);

router.get('/common', function (req, res, next) {
    readFile('configs/common.config.json').then(appConfig => {
        res.end(appConfig);
    });
});

/* GET app configuration */
router.get('/common', function (req, res, next) {
    readFile('configs/common.config.json').then(appConfig => {
        res.end(appConfig);
    });
});

function verify(req) {
    return new Promise((success, fail) => {
        let token = req.header('Authorization').split(' ')[1];
        jwt.verify(token, HACKATHON_SECRET, (err, decoded) => {
            if(err) fail();
            else success(decoded);
        });
    });

}

router.put('/common', function (req, res, next) {
    verify(req).then((user)=>{
        if (user.role === 'admin')
            writeFile('configs/common.config.json', JSON.stringify(req.body)).then(() => {
                res.status(204).end();
            });
        else res.status(403).end();

    }, ()=>{
        res.status(401).end();
    });

});

router.get('/home', function (req, res, next) {
    readFile('configs/home.config.json').then(homeConfig => {
        res.end(homeConfig);
    });
});

let users = require('./../data/users.data');

oauth2Router.post('/token', (req, res, next) => {
    let matchedUsers = users.filter(user => user.email === req.body.email && user.password === req.body.password);
    if (matchedUsers.length < 1)
        res.status(401).end();
    else {
        user = matchedUsers[0];
        let token = jwt.sign({
            email: user.email,
            role: user.role,
            signed_at: new Date().getTime(),
        }, HACKATHON_SECRET);
        res.status(200).end(token);
    }

});

module.exports = router;
