const router = require('express').Router();
const app = require('express')();
const db = require('../db');
const verToken = require('../verToken')

const fs = require('fs');
const pdf = require('dynamic-html-pdf');
const html = fs.readFileSync(__dirname + '/template.html', 'utf8');

db.Open(app).then((state) => {
    if (state) { console.log('DB connected...') }
}).catch((err) => {
    console.log(err)
})

//Get cart
router.get('/getcart', verToken.chkuser, (req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM carts WHERE userid ='${req.auth.userid}'`
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

// Add cart
router.get('/addcart', verToken.chkuser, (req, res) => {
    const con = app.get('CONNECTION');
    sql = `INSERT INTO carts(userid) VALUES ('${req.auth.userid}')`
    con.query(sql, (err, result, fields) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: 'Cart created', res: result, fields })
        }
    })
})

// Delete cart
router.post('/deletecart', verToken.chkuser, (req, res) => {
    const con = app.get('CONNECTION');
    sql = `DELETE FROM carts WHERE id = ${req.body.id}`
    con.query(sql, (err) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: 'Cart deleted' })
        }
    })
})

// Add new item to cart
router.post('/additemtocart', verToken.chkuser, (req, res) => {
    let { prodid, quant, cartid } = req.body;
    if (!prodid || !quant || !cartid) {
        res.json({ state: 'error', message: 'Missing fields' })
    }
    else {
        console.log(req.body)
        const con = app.get('CONNECTION');
        sql = `INSERT INTO items(id,prodid,quant,cartid)
                VALUES (NULL, ${prodid},${quant},${cartid})`
        con.query(sql, (err) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: 'Item created' })
            }
        })
    }
})

// Delete item from cart
router.post('/deleteitemfromcart', verToken.chkuser, (req, res) => {
    const con = app.get('CONNECTION');
    sql = `DELETE FROM items WHERE id = ${req.body.id}`
    con.query(sql, (err) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: 'Item deleted' })
        }
    })
})

// Delete all items from cart
router.post('/deleteallfromcart', verToken.chkuser, (req, res) => {
    const con = app.get('CONNECTION');
    sql = `DELETE FROM items WHERE cartid = ${req.body.id}`
    con.query(sql, (err) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: 'Item deleted' })
        }
    })
})

// Get all items for cart
router.post('/getitemsforcart', verToken.chk, (req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT item.id, item.quant, item.cartid, prod.id AS prodid, prod.prodname, prod.price, prod.img FROM items AS item INNER JOIN prods AS prod ON item.prodid = prod.id WHERE cartid = ${req.body.cartid}`//changehere cartid
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

// Edit item quantity
router.put('/editquant', verToken.chkuser, (req, res) => {
    const con = app.get('CONNECTION');
    let sql = `UPDATE items SET quant = ${req.body.quant} WHERE id=${req.body.id}`
    con.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: result })
        }
    })
})

// Add order
router.post('/addorder', verToken.chkuser, (req, res) => {
    let { userid, cartid, ordertotal, ordercity, orderstreet, senddate, creditcard } = req.body;
    if (!userid || !cartid || !ordertotal || !ordercity || !orderstreet || !senddate || !creditcard) {
        res.json({ state: 'error', message: 'Missing fields' })
    }
    else {
        let creditcardsub = creditcard.substr(12);
        console.log(req.body);
        const con = app.get('CONNECTION');
        sql = `INSERT INTO orders(userid, cartid, ordertotal, ordercity, orderstreet, senddate, creditcard)
                VALUES (${userid},${cartid},${ordertotal},'${ordercity}','${orderstreet}','${senddate}',${creditcardsub})`
        con.query(sql, (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                let orderid = result.insertId || -1;
                con.query(`DELETE FROM carts WHERE id = ${cartid}`,(errd) => {
                    if (err) {
                        res.json({ state: 'error', message: err.message })
                    } else {
                        let carddigits = req.body.creditcard.substr(12)
                        var options = {
                            format: "A4",
                            orientation: "portrait",
                            border: "0mm"
                        };
                        var document = {
                            type: 'file',
                            template: html,
                            context: {
                                data: { ...req.body, carddigits }
                            },
                            path: "./public/receipts/order-" + orderid + ".pdf"
                        };

                        pdf.create(document, options)
                            .then(resx => {
                                res.json({ state: 'success', message: 'Order recieved', pdf: "order-" + orderid + ".pdf" })
                            })
                            .catch(error => {
                                res.json({ state: 'success', message: 'No reciept'})
                            });
                    }
                })
            }
        })
    }
})

// Check if has 3 dates
router.get('/occdates',verToken.chk,(req, res)=>{
    const con = app.get('CONNECTION');
    let sql = `SELECT senddate,COUNT(*) AS list FROM orders GROUP BY senddate HAVING COUNT(*)>2 AND senddate>CURRENT_DATE+1`;
    con.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: result })
        }
    })
})

module.exports = router;