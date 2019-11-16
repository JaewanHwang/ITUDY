
var express = require('express');
var app = express();
var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var MySQLStore = require('express-mysql-session')(session);

var options = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'userinfo'
};

var sessionStore = new MySQLStore(options);

var connection = mysql.createConnection(options);

connection.connect();
var info;

connection.query('SELECT * from userinfo',function(err,rows,fields){
        if(!err){
            console.log('The solution is: ',rows);
            info = rows;
        }
        else{
            console.log('Error while performing Query.',err);
        }
});


var http = require('http');

var server = http.createServer();



app.set('port',3000);
app.set('view engine','html');
app.engine('html',ejs.renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use('/js',express.static('js'));
app.use('/lib',express.static('lib'));
app.use('/img',express.static('img'));
app.use('/css',express.static('css'));
app.use('/contactform',express.static('contactform'));




http.createServer(app).listen(app.get('port'),function(){
    console.log("express start: %d",app.get('port'));

})


app.get('/',function(req,res){
    res.render("main.html");
})
app.get('/signup',function(req,res){
    res.render("signup.html");
})
app.get('/mypage',function(req,res){
    res.render("mypage.ejs",{loginInfo:loginUser});
})

app.use(session({
    key : 'sid',
    secret : 'secret',
    resave : false,
    saveUninitialized : false,
    store : new MySQLStore(options)
}));

var loginUser;
app.post('/success',function(req,res){
    
    var session = req.session;
    
    var nameAry = new Array();
    var check = 0;    
    for(var i=0;i<info.length;i++){
        nameAry.push(info[i].id);
        if(req.body.id == info[i].id){
             if(req.body.password == info[i].password){
                 check=1;
                 break;
             }
        }
    }
    if(check){
        loginUser=info[i];
        req.session.name = loginUser.name
        req.session.credit = loginUser.credit;
        // alert(req.session.name + "님 환영합니다.");
        req.session.save(()=>{
            res.render('after_login.ejs',{loginInfo:loginUser});    
        });
        
    }
    else{
        console.log('로그인 실패');
        res.render('main.html');
    }    
});

app.get('/home',function(req,res){
    
    if(req.session.name){
        console.log("asdddf");
        req.session.save(()=>{
            res.render('after_login.ejs',{loginInfo:loginUser});    
        });
        
    }
    else{
        console.log("af");
        res.render("main.html");
    }
})


app.get('/logout', function(req,res){
    delete req.session.name;
    req.session.save(()=>{
        res.render('main.html');
    })
});


app.post("/done",function(req,res){
    var user = req.body;
    
    connection.query('insert into userinfo set ?',user,function(err,result){
        if(!err){
            console.log("사용자 등록 성공");
            console.log("new user id : "+ req.body.id);
            console.log("new user password : "+req.body.password);
            console.log('The solution is: ',result);
            console.log('회원가입 완료');
            
        }
        else{
            console.log('Error while performing Query.',err);
        }
    });
    connection.query('SELECT * from userinfo',function(err,rows,fields){
            if(!err){
                console.log('The solution is: ',rows);
                info = rows;
            }
            else{
                console.log('Error while performing Query.',err);
            }
    });
    res.render("main.html");
})

app.get('/credit', function(req,res){
    req.session.name = loginUser.name
        req.session.credit = loginUser.credit;
        req.session.save(()=>{
            res.render('credit.ejs',{name:req.session.name,credit:req.session.credit});    
        });

        
    
});
// // 기본정보 수정
// app.post("/modify",function(req,res){
//     var userName = req.body.name;
//     var userPhone = req.body.phone;
//     connection.query("UPDATE `userinfo`.`userinfo` SET `name` = '"+userName+"',`phone` = '"+userPhone+"' WHERE (`id` = '"+loginUser.id+"');",function(err,result){
//         if(!err){
//             console.log("수정완료");    
//         }
//         else{
//             console.log('Error while performing Query.',err);
//         }
//     });
//     loginUser.name = userName;
//     loginUser.phone = userPhone;
//     res.send();
// })
// 분야 수정
app.post("/modify",function(req,res){
    var user = req.body
    console.log(user);
    connection.query("UPDATE `userinfo`.`userinfo` SET ? WHERE (`id` = '"+loginUser.id+"');",user,function(err,result){
        if(!err){
            console.log("수정완료");    
        }
        else{
            console.log('Error while performing Query.',err);
        }
    });
    connection.query("SELECT * from userinfo WHERE (`id` = '"+loginUser.id+"');",user,function(err,rows,result){
        if(!err){
            console.log("수정완료");   
            loginUser =  rows[0];
        }
        else{
            console.log('Error while performing Query.',err);
        }
    });
    res.send();
});


app.post("/request",function(req,res){
    res.send({loginUser: loginUser})
})
// app.get("/class",function(req,res){
//     res.render('class.ejs');
// })
//
// app.get("/study",function(req,res){
//     res.render('study.ejs');
// })
///////////////////////////// 게시판 구현 ////////////////////////

//클래스 게시판
var classRouter = require('./routes/class.js')
app.use(classRouter)

var studyRouter = require('./routes/study.js')
app.use(studyRouter)



///////////////////////////////////////////////////////////////////

