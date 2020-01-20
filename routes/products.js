const router = require('express').Router();
const app = require('express')();
const db = require('../db');
const verToken = require('../verToken')
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, `img-${file.originalname}`)
    }
});
const upload = multer({ storage: storage });

db.Open(app).then((state) => {
    if (state) { console.log('DB connected...') }
}).catch((err) => {
    console.log(err)
})


// Get products
router.post('/products', verToken.chk, (req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM prods WHERE catid ='${req.body.catid}'`
    con.query(sql, (err, result) => {
        if (err) {
            res.json({ state: 'error', message: err.message })
        } else {
            res.json({ state: 'success', message: result })
        }
    })
});

// Add product
router.post('/addproduct', verToken.chkisadmin, (req, res) => {
    let { prodname, catid, price, img } = req.body;
    if (!prodname || !catid || !price || !img) {
        res.json({ state: 'error', message: 'Missing fields' })
    }
    else {
        console.log(req.body)
        const con = app.get('CONNECTION');
        sql = `INSERT INTO prods(prodname,catid,price,img)
                VALUES ('${prodname}',${catid},${price},'${img}')`
        con.query(sql, (err) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: 'Product created' })
            }
        })
    }
});

// Get categorys
router.get('/categorys', verToken.chk, (req, res) => {
    const con = app.get('CONNECTION');
    let sql = `SELECT * FROM cat`
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


// Edit product
router.post('/editprod', verToken.chkisadmin, (req, res) => {
    let { prodname, catid, price, img, id } = req.body;
    if (!prodname || !catid || !price || !img || !id) {
        res.json({ state: 'error', message: 'Missing fields' })
    }
    else {
        const con = app.get('CONNECTION');
        sql = `UPDATE prods SET prodname='${prodname}',catid=${catid},price=${price},img='${img}' WHERE id=${id}`
        con.query(sql, (err) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: 'Product Changed' })
            }
        })
    }
})

// Search products
router.post('/searchprods', verToken.chk, (req, res) => {
    if (req.body.term) {
        const con = app.get('CONNECTION');
        sql = `SELECT * FROM prods WHERE prodname LIKE '%${req.body.term}%'`
        con.query(sql, (err, result) => {
            if (err) {
                res.json({ state: 'error', message: err.message })
            } else {
                res.json({ state: 'success', message: result })
            }
        })
    }
})

// Upload Image
router.post('/uploadimg', upload.single('file'), (req, res) => {
    if (req.file) {
        res.json(req.file);
    }
    else throw 'Error uploading file';
});

module.exports = router;