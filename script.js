var MyEventEmitter = function () {
    this.events = {};
}

MyEventEmitter.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];

    }
    this.events[event].push(callback);
}
MyEventEmitter.prototype.fire = function (event, data) {
    if (!this.events[event]) {
        return;
    }
    for (let i = 0; i < this.events[event].length; i++) {
        this.events[event][i](data);
    }
}
MyEventEmitter.prototype.off = function (event, callback) {
    if (!this.events[event]) {
        return;
    }
    this.events[event] = this.events[event].filter(c => { c !== callback });
    console.log(this.events[event]);
}

var MyStateMachine = function (transitions, currentStateName, onStateChange) {
    this.currentStateName = currentStateName;
    this.transitions = transitions;
    this.current = this.transitions[this.currentStateName];
    this.onStateChange = onStateChange;
}

MyStateMachine.prototype.handle = function (eventName, data) {
    if (this.current[eventName]) {
        this.currentStateName = this.current[eventName];
        this.current = this.transitions[this.currentStateName];
        if (this.onStateChange) {
            this.onStateChange(this.currentStateName);
        }
    }
}


var Video = function (id) {
    this.id = id
    this.url = "./public/video/video" + id + ".mp4";
    this.thumbnail = "./public/video/img/th" + id + ".png";

}
var VideoPlayer = function () {

    this.events = new MyEventEmitter();

    function triggerStateChangeEvent(newState) {
        this.events.fire("state-change", newState);
    }
    this.fsm = new MyStateMachine(
        {
            "start": {
                "config-loaded": "ready"

            },
            "ready": {
                "video-loaded": "pause"
            },
            "pause": {
                "play-clicked": "play",
            },
            "play": {
                "pause-clicked": "pause",
                "video-ended": "end"
            },
            "end": {
                "autoplay": "start"
            }
        }, "start", triggerStateChangeEvent.bind(this));
}

VideoPlayer.prototype.__trigger = function (eventName, data) {
    this.fsm.handle(eventName);
    this.events.fire(eventName, data);
}

VideoPlayer.prototype.loadConfig = function () {
    this.__trigger("config-loaded");
}
VideoPlayer.prototype.loadVideo = function () {
    this.__trigger("video-loaded");
}

VideoPlayer.prototype.pause = function () {
    this.__trigger("pause-clicked");
};

VideoPlayer.prototype.play = function () {
    this.__trigger("play-clicked" );
};
VideoPlayer.prototype.videoEnded = function () {
    this.__trigger("video-ended");
};

VideoPlayer.prototype.autoplay = function () {
    this.__trigger("autoplay");
}

var logStateChange = function (newState) {
    console.log("state changed to " + newState);
};


var videoended = function () {

    resetControls();

    if (config.playlistOn && config.autoplay) {
        curIndex++;
        curIndex = mod(curIndex , config.playlistLength);
        vp.autoplay();
    }
}

var playclicked = function () {
    //update button
    video.play();
    playButton.setAttribute("src","./public/img/pause.png");
}
var pauseclicked = function () {
    video.pause();
    playButton.setAttribute("src","./public/img/play.png");
}
var videoloaded = function () {
    video.load();

}

var configloaded = function(){
    loadConfig();
    vp.loadVideo({ video: video, playButton: playButton });
}

var autoplay = function(){
    vp.loadConfig();
}


var vp = new VideoPlayer();

vp.events.on("state-change", logStateChange);

vp.events.on("config-loaded", configloaded)

vp.events.on("video-loaded", videoloaded);

vp.events.on("play-clicked", playclicked);

vp.events.on("pause-clicked", pauseclicked);

vp.events.on("video-ended", videoended);

vp.events.on("autoplay", autoplay);


var Config = function () {

    this.width = "640px";
    this.height = "360px";
    this.playlistOn = true;
    this.autoplay = true;
    this.playlist = [];
    this.playlistLength = 7;

    this.fillPlaylist = function () {
        console.log("filing playlist");
        for (let i = 0; i < this.playlistLength; i++) {
            this.playlist.push(new Video(i + 1));
        }
    };
    (this.fillPlaylist());
}


function mod(n, m) {
    return ((n % m) + m) % m;
}

var resetControls = function (){
    playButton.setAttribute("src","./public/img/play.png");
    $("#playprogress").css("width", 0 + "%");
}

var playButton = document.getElementById("playbutton");
var soundButton = document.getElementById("soundButton");
var fullScreenButton = document.getElementById("fullscreenButton");
// var replayButton = document.getElementById("replaybutton");
// playButton.disabled = true;
// replayButton.disabled = true;


const video = this.document.getElementById("video");
const videoSrc = this.document.getElementById("videosrc");
const videoContainer = this.document.getElementById("videoContainer");
const seekbar = this.document.getElementById("seekbar");
const playprogress = this.document.getElementById("playprogress");
const thumb = this.document.getElementById("thumb");

let seeking = false;
let fullscreenOn = false;
let counter = 0;
let curIndex = 0;


let config = new Config();

let loadConfig = function(){
    videoContainer.style.setProperty("width", config.width);
    videoContainer.style.setProperty("height", config.height);
    videoSrc.setAttribute("src", config.playlist[curIndex].url);
}

vp.loadConfig();


playButton.addEventListener("click", function () {
    if (vp.fsm.currentStateName === "pause") {
        vp.play({ video: video, button: this });
    } else if (vp.fsm.currentStateName === "play") {
        vp.pause({ video: video, button: this });
    }
});

soundButton.addEventListener("click", function () {
    video.muted = !video.muted;
});

fullscreenButton.addEventListener("click", function () {
    if (fullscreenOn) {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
        $(videoContainer).css({ "width": "640px", "height": "360px" });
        fullscreenOn = false;
    } else {
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
            videoContainer.mozRequestFullScreen(); // Firefox
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen(); // Chrome and Safari
        }
        $(videoContainer).css({ "width": "100%", "height": "100%" });
        fullscreenOn = true;
    }
});

video.addEventListener("ended", function () {
    vp.videoEnded({ video: video, playButton: playButton });
});

video.addEventListener("timeupdate", function () {
    var value = (video.currentTime / video.duration) * 100;
    $("#playprogress").css("width", value + "%");
});

seekbar.addEventListener("mousedown", function () {
    seeking = true;
});

window.addEventListener("mousemove", function (e) {
    if (seeking) {
        var widthclicked = (e.pageX - (seekbar.offsetLeft + videoContainer.offsetLeft)) / seekbar.offsetWidth * 100;
        widthclicked = Math.max(0, Math.min(widthclicked, 100));
        var time = video.duration * (widthclicked / 100);
        video.currentTime = time;
    }
});

window.addEventListener("mouseup", function (e) {
    if (seeking) {
        var widthclicked = (e.pageX - (seekbar.offsetLeft + videoContainer.offsetLeft)) / seekbar.offsetWidth * 100;
        widthclicked = Math.max(0, Math.min(widthclicked, 100));
        var time = video.duration * (widthclicked / 100);
        video.currentTime = time;
        seeking = false;
    }
});











