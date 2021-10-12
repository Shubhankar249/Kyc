const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {v4 : uuidV4} = require('uuid');  // Using method v4 as uuidV4
const multer = require('multer');

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:roomId', (req, res) => {
    res.render('room', {roomId: req.params.roomId});
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.txt');
    },
});
const upload = multer({ storage: storage });

// let files = [];
app.post('/file-upload', upload.single('document'), (req, res) => {
    res.download('uploads/' + req.file.filename, 'server-file.txt');
});

io.on('connection', socket => {
   socket.on('join-room', (roomId, userId) => {
       socket.join(roomId);
       socket.broadcast.to(roomId).emit('user-connected', userId);

       socket.on('disconnect', () => {  // called when someone leaves the room
           socket.broadcast.to(roomId).emit('user-disconnected', userId);
       })
   });
});
server.listen(4200);