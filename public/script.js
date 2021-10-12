const socket = io('/');
const myPeer = new Peer(undefined, {
    host:'/',
    port: '4201'
});
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
let userCall;

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
    console.log("Current user", myPeer.id);
});

myVideo.muted = true;   // Don't wanna listen echo of our own voice

navigator.mediaDevices.getUserMedia({audio: true, video: { facingMode: "user" } })
    .then(function(stream) {
        addVideoStream(myVideo, stream);

        socket.on('user-connected', userId => {  // A new user has joined the room
            document.getElementById('calling-div').innerHTML = `<button onclick = "connectToNewUser(${userId}, ${stream})"> Call Agent</button>`;
        });

        myPeer.on('call', call => {
            const answerCall = confirm("Do you want to answer?");

            if (answerCall) {
                call.answer(stream);
                console.log("Answering a call");
                const userVideo = document.createElement('video');
                call.on('stream', userStream => {
                    addVideoStream(userVideo, userStream)
                    console.log("stream is added ");
                });
            } else {
                console.log("Called denied");
            }
        });
    })
    .catch(function(err) {
        alert("There is an error accessing your camera and microphone. If you have not given permissions, please reload and do the needful, it is mandatory.");
    });

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play());
    videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
    // 1. Make a peerJs call and send them our stream
    const call = myPeer.call(userId, stream); userCall = call;

    // 2. Receive their stream
    const userVideo = document.createElement('video');
    call.on('stream', userStream => {
        console.log("Call is answered by", userId);
        addVideoStream(userVideo, userStream)
    });
    call.on('close', () => userVideo.remove());
}

socket.on('user-disconnected', userId => {
    alert("User - " + userId + " disconnected");
    document.getElementById('calling-div').innerHTML = "";
    userCall.close();
})