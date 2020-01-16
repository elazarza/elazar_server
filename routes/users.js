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

//Verify Token
router.get('/verToken',verToken.chk ,(req, res) => { //verifytoken
    res.json({ state: 'success', message: req.auth })
});

//GET ALL USERS
router.get('/',verToken.chkisadmin ,(req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users`
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

//GET USER
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

//VERIFY ID OR MAIL NOT EXIST
router.post('/verExistUser',(req, res)=>{ //verifidmail
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE id=${req.body.userid} OR email='${req.body.email}'`
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

//ADD NEW USER
router.post('/adduser',async (req,res)=>{
    let {userid, fname, lname, email, password, city, street } = req.body;
    const salt = await bcrypt.genSalt(10);
    let p_hash;
    if (password) {
         p_hash = await bcrypt.hash(password, salt);
    }
    if (!userid || !fname || !lname || !email || !password || !city || !street) {
        res.json({ state: 'error', message: 'Missing fields' })
    }
    else {
        console.log(req.body)
        const con = app.get('CONNECTION');
        sql = `INSERT INTO users(id, fname, lname, email, password, city, street)
                VALUES (${userid},'${fname}','${lname}','${email}','${p_hash}','${city}','${street}')`
        con.query(sql, (err) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: 'User created' })
            }
        })
    }
})

//USER LOGIN
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
                }
                else {
                    res.json({ state: 'error', message: `Wrong password` })
                }
            } else {
                res.json({ state: 'error', message: `Wrong user` })
            }
        }
    })
})

//GET COUNT PRODUCTS AND COUNT ORDERS
router.get('/totalordprod',(req, res) => { // infocount
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