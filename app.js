// express
// body-parser
// basic-auth
// cors

(async ()=>{ 

const http = require('http');
const fsm = require('fs');
const path = require('path');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');
const express = require('express');
const auth = require('basic-auth');
const cors = require('cors');　
const ejs = require('ejs');　

let users = require('./users.js');
let config = require('./config.js');

const PORTNUMBER = config.port;
const listenIp = config.ip;

const LocalStrategy = passportLocal.Strategy;
const fs = fsm.promises;

let webServer;
const app = express();

app.use(session({
  secret: config.secret,
  resave: true,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session()); 

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new LocalStrategy(
  (username, password, done)=>{
    if(!users[username]){
      console.log(`[${username}] Login name is incorrect.`);
      return done(null, false);
    }
    if(users[username].pass != password){
      console.log(`[${username}] Login password is incorrect.`);
      return done(null, false);
    }
    return done(null, username);
  }
));

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set('views', path.join(__dirname, 'www'));
app.engine('html', ejs.renderFile);

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('Auth ok');
    return next();
  }
  console.warn("not authenticated.");
  res.redirect('/viewer');
}

app.post('/login', 
  passport.authenticate('local',{failureRedirect: '/viewer',session: true}),
  (req, res) => {
    console.log('login ok: '+req.user);
    res.redirect('/viewer/'+req.user);
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  console.log('logout ok');
  res.redirect('/');
});

app.get('/viewer/:user', isAuthenticated, (req, res) => res.render('viewer/app.html'));
app.get('/register', (req, res) => res.render('viewer/register.html'));

app.use('/', basicauth, express.static('./www'));
app.use('/chat', basicauth, express.static('./chat'));

app.use('/viewer', express.static("./www/viewer"));

app.post('/newuser', async (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;
  console.log("user:"+user+" pass:"+pass);

  if(users[user]){
    console.log("["+user+"] already exists!");
    res.redirect('/register');
  }else{
    console.log("add new user");
    users[user] = {"pass":pass};
    let filename = __dirname+"/"+"users.js";
    let str1 = "module.exports = ";
    let str2 = JSON.stringify(users);
    await fs.writeFile(filename, str1+str2);
    res.redirect('/viewer');
  }
});

app.use((error, req, res, next) => {
  if(error){
    console.warn('app error,', error.message);
    error.status = error.status || (error.name === 'TypeError' ? 400 : 500);
    res.statusMessage = error.message;
    res.status(error.status).send(String(error));
  }else{
    next();
  }
});

webServer = http.createServer(app);
webServer.on('error', (err) => {
  console.error('starting web server failed:', err.message);
});

webServer.listen(PORTNUMBER, listenIp, () => {
  console.log('server is running');
  console.log(`open https://${listenIp}:${PORTNUMBER} in your web browser`);
});
//////////////

function basicauth(request, response, next) {
  var user = auth(request);
  console.log(user);
  if (!user || config.basicAuth.id !== user.name || config.basicAuth.pass !== user.pass) {
    response.set('WWW-Authenticate', 'Basic realm="401"');
    return response.status(401).send();
  }
  return next();
};

// socket.io

const io = require('socket.io')(webServer,{path:"/ws"});

let cons = {};

io.on("connection",(socket)=>{
  console.log("new connection : "+socket.id);
  cons[socket.id] = {id:socket.id, user:null};

  socket.on("newuser",(data)=>{
    console.log("newuser id: "+socket.id+" user: "+data);
  	cons[socket.id].user = data;
    socket.broadcast.emit("join",data);
    sendUsers();
  });

  socket.on("disconnect",(data)=>{
    console.log("disconnected : "+socket.id);
    let user = cons[socket.id].user;
    socket.broadcast.emit("leave",user);
  	delete cons[socket.id];
    sendUsers();
  });

  socket.on("message",(data)=>{
    console.log("message : from "+socket.id+" user["+cons[socket.id].user+"] ["+data+"]");
    let jobj = {user:cons[socket.id].user,text:data};
    socket.broadcast.emit("message",JSON.stringify(jobj));
  });

  function sendUsers(){
    let users = [];
    Object.keys(cons).forEach((socketid)=>{
      users.push(cons[socketid].user);
    });
    socket.emit("users",users);
    socket.broadcast.emit("users",users);
    
  }
});

})();
