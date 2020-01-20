const router = require('express').Router();
const app = require('express')();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verToken = require('../verToken');

db.Open(app).then((state) => {
    if (state) { console.log('DB connected...') }
}).catch((err) => {
    console.log(err)
})

// Verify Token
router.get('/verToken',verToken.chk ,(req, res) => {
    res.json({ state: 'success', message: req.auth })
});


// Get user
router.get('/getuser',verToken.chkuser ,(req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE id = ${req.auth.userid}`
    con.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `No results` })
            }
        }
    })
});

// Verify existing user
router.post('/verExistUser',(req, res)=>{
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE id=${req.body.id} OR email='${req.body.email}'`
    con.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length === 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `User already exist` })
            }
        }
    })
})

// Add new user
router.post('/adduser',async (req,res)=>{
    let {id, fname, lname, email, password, city, street } = req.body;
    const salt = await bcrypt.genSalt(10);
    let phash;
    if (password) {
         phash = await bcrypt.hash(password, salt);
    }
    if (!id || !fname || !lname || !email || !password || !city || !street) {
        res.json({ state: 'error', message: 'Missing fields' })
    }
    else {
        console.log(req.body)
        const con = app.get('CONNECTION');
        sql = `INSERT INTO users(id, fname, lname, email, password, city, street)
                VALUES (${id},'${fname}','${lname}','${email}','${phash}','${city}','${street}')`
        con.query(sql, (err) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: 'User created' })
            }
        })
    }
})

// Login
router.post('/login', async (req, res) => {
    let { email, password } = req.body;
    const con = app.get('CONNECTION');
    sql = `SELECT * FROM users WHERE email='${email}'`
    con.query(sql, async (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                const isValidPassword = await bcrypt.compare(password, result[0].password)
                if (isValidPassword) {
                    jwt.sign({ email: result[0].email, isadmin: result[0].isadmin, fname:result[0].fname, lname:result[0].lname, userid:result[0].id }, 'secretkey', (err, token) => {
                        if (err) { res.json({ state: 'error', message: err.message }) }
                        else { res.json({state:'success', message: { token, fname: result[0].fname, lname: result[0].lname,isadmin: result[0].isadmin } }) }
                    });
                } else {
                    res.json({ state: 'error', message: `Wrong password` })
                }
            } else {
                res.json({ state: 'error', message: `Wrong user` })
            }
        }
    })
})

// Get total prods ords
router.get('/totalordprod',(req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT COUNT(id) AS prodtoal FROM prods UNION SELECT COUNT(id) FROM orders`
    con.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `No results` })
            }
        }
    })
});

module.exports = router;