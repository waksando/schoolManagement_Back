const express = require('express');
const router = express.Router();
const db  = require('./database/dbConnection');
const { credentialsValidation } = require('./validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');


router.post('/login', credentialsValidation,  (req, res, next) => {
    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
        async (err, result) => {
            const reqErrors = validationResult(req);

            if (!reqErrors.isEmpty()) {
                return res.status(401).json(reqErrors);
            }


            // user does not exists
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            if (!result.length) {
                return res.status(401).send({
                    msg: 'Email does not exists'
                });
            }

            // check password
            bcrypt.compare(
                req.body.password,
                result[0]['Password'],
                (bErr, bResult) => {
                    // wrong password
                    if (bErr) {
                        throw bErr;
                        return res.status(401).send({
                            msg: 'Email or password is invalid!'
                        });
                    }
                    if (bResult) {
                        const token = jwt.sign({id:result[0].ID},'the-super-strong-secrect',{ expiresIn: '1h' });
                        db.query(
                            `UPDATE users SET last_login = now() WHERE ID = '${result[0].ID}'`
                        );
                        return res.status(200).send({
                            msg: 'Logged in!',
                            token,
                            user: result[0]
                        });
                    }
                    return res.status(401).send({
                        msg: 'Username or password is not valid!'
                    });
                }
            );
        }
    );
});

//register
router.post("/register", credentialsValidation, (req, res) => {
    const reqErrors = validationResult(req);

    if (!reqErrors.isEmpty()) {
        return res.status(401).json(reqErrors);
    }

    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
        async (err,result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            if (result.length) {
                return res.status(401).send({
                    msg: 'Email already exixts'
                });
            } else {
                try {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);

                    if (hashedPassword){
                        db.query(`INSERT INTO users (Name, Surname, Email, Password) VALUES (${db.escape(req.body.name)},${db.escape(req.body.surname)},${db.escape(req.body.email)} , ${db.escape(hashedPassword)})`,  (error, results) => {
                            if (error) throw error;
                            console.log('The response is: ', results);
                            return res.status(200).send({
                                msg: 'Registered in!'
                            });
                        });
                    }
                }catch (error) {
                    console.log('register error: ',error);
                }
            }
        }
    );
});

module.exports = router;