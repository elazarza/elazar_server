const jwt = require('jsonwebtoken');

// Verify token
function chk(req, res, next){
    const token = req.header('authorization');
    if(!token){
        res.status(401).json( {state: 'error', message: 'Token not found' })
    }
    else{
        jwt.verify(token, 'secretkey',(err,auth)=>{
            if(err){res.status(400).json( {state: 'error', message: 'Invalid token' })}
            else{
                req.auth = auth;
                next()
            }
        });
    }
}

// Verify user
function chkuser(req, res, next){
    const token = req.header('authorization');
    if(!token){
        res.status(401).json( {state: 'error', message: 'Token not found' })
    }
    else{
        jwt.verify(token, 'secretkey',(err,auth)=>{
            if(err){res.status(400).json( {state: 'error', message: 'Invalid token' })}
            else{
                if(auth.admin){
                    res.status(400).json( {state: 'error', message: 'Not authorized' })
                }
                else{
                    console.log(auth);
                    req.auth = auth;
                    next()
                }
            }
        });
    }
}

// Verify admin
function chkisadmin(req, res, next){
    const token = req.header('authorization');
    if(!token){
        res.status(401).json( {state: 'error', message: 'Token not found' })
    }
    else{
        jwt.verify(token, 'secretkey',(err,auth)=>{
            if(err){res.status(400).json( {state: 'error', message: 'Invalid token' })}
            else{
                if(!auth.isadmin){
                    res.status(400).json( {state: 'error', message: 'Not authorized' })
                }
                else{
                    console.log(auth);
                    req.auth = auth;
                    next()
                }
            }
        });
    }
}

module.exports = {chk , chkuser , chkisadmin};