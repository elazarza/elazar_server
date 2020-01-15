const router = require('express').Router();
const app = require('express')();
const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const verifytoken = require('../verifytoken')

db.Open(app).then((state) => {
    if (state) { console.log('DB Server connected...') }
}).catch((err) => {
    console.log(err)
})

//Verify Token
router.get('/verifytoken',verifytoken.all ,(req, res) => {
    res.json({ state: 'success', message: req.auth })
});

//GET ALL USERS
router.get('/',verifytoken.admin ,(req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users`
    con.query(sql, (err, result, fields) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `No results!!!` })
            }
        }
    })
});

//GET USER
router.get('/user',verifytoken.user ,(req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE t_z = ${req.auth.user_id}`
    con.query(sql, (err, result, fields) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `No results!!!` })
            }
        }
    })
});

//VERIFY ID OR MAIL NOT EXIST
router.post('/verifidmail',(req,res)=>{
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM users WHERE t_z=${req.body.user_id} OR mail='${req.body.email}'`
    con.query(sql, (err, result, fields) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length === 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `id or mail already exist` })
            }
        }
    })
})

//ADD NEW USER
router.post('/add',async (req,res)=>{
    let {user_id, first_name, last_name, email, password, city, adress } = req.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt)
    if (!user_id || !first_name || !last_name || !email || !password || !city || !adress) {
        res.json({ state: 'error', message: 'not all input' })
    }
    else {
        console.log(req.body)
        const con = app.get('CONNECTION');
        sql = `INSERT INTO users(t_z, first_name, last_name, mail, password_hach, city, adress)
                VALUES (${user_id},'${first_name}','${last_name}','${email}','${password_hash}','${city}','${adress}')`
        con.query(sql, (err, result, fields) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: 'new member created' })
            }
        })
    }
})

//USER LOGIN
router.post('/login', async (req, res) => {
    let { mail, password } = req.body;
    const con = app.get('CONNECTION');
    sql = `SELECT * FROM users WHERE mail='${mail}'`
    con.query(sql, async (err, result, fields) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                const valid_password = await bcrypt.compare(password, result[0].password_hach)
                if (valid_password) {
                    jwt.sign({ mail: result[0].mail, admin: result[0].admin, first_name:result[0].first_name, last_name:result[0].last_name, user_id:result[0].t_z }, 'secretkey', (err, token) => {
                        if (err) { res.json({ state: 'error', message: err.message }) }
                        else { res.json({state:'success', message: { token, first_name: result[0].first_name, last_name: result[0].last_name,admin: result[0].admin } }) }
                    });
                }
                else {
                    res.json({ state: 'error', message: `password wrong` })
                }
            } else {
                res.json({ state: 'error', message: `email not exist` })
            }
        }
    })
})

//GET COUNT PRODUCTS AND COUNT ORDERS
router.get('/infocount',(req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT COUNT(product_id) AS countInfo FROM products UNION SELECT COUNT(order_id) FROM orders`
    con.query(sql, (err, result, fields) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            if (result.length > 0) {
                res.json({ state: 'success', message: result })
            } else {
                res.json({ state: 'error', message: `No results!!!` })
            }
        }
    })
});

module.exports = router;