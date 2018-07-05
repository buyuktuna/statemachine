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

var VideoPlayer = function () {
    this.events = new MyEventEmitter();

    function triggerStateChangeEvent(newState) {
        this.events.fire("state-change", newState);
    }
    this.fsm = new MyStateMachine(
        {
            "init": {
                "variables-ready": "load-variables"

            },
            "load-variables": {
                "variables-loaded": "load-video"
            },
            "load-video": {
                "video-loaded": "pause"
            },
            "play": {
                "pause-clicked": "pause",
                "video-ended": "end"
            },
            "pause": {
                "play-clicked": "play",
            },
            "end": {
                "replay-clicked": "play",
                "autoplay": "load-video"
            }
        }, "init", triggerStateChangeEvent.bind(this));


}

VideoPlayer.prototype.__trigger = function (eventName, data) {
    this.fsm.handle(eventName);
    this.events.fire(eventName, data);
}

VideoPlayer.prototype.variablesReady = function () {
    this.__trigger("variables-ready");
}

VideoPlayer.prototype.loadVariables = function () {

    this.__trigger("variables-loaded");
    console.log("variables loaded");
}
VideoPlayer.prototype.loadVideo = function (data) {

    this.__trigger("video-loaded", data);
    console.log("video loaded");

}
VideoPlayer.prototype.replay = function (data) {
    this.__trigger("replay-clicked", data);

};

VideoPlayer.prototype.pause = function (data) {
    this.__trigger("pause-clicked", data);

};
VideoPlayer.prototype.play = function (data) {
    this.__trigger("play-clicked", data);


};
VideoPlayer.prototype.videoEnded = function (data) {
    this.__trigger("video-ended", data);

};

VideoPlayer.prototype.autoplay = function () {
    this.__trigger("replay-clicked");
}




var logStateChange = function (newState) {
    console.log("state changed to " + newState);
};


var videoended = function (data) {
    console.log(data.video);

}

var playclicked = function(data){
    //update button
    data.video.play();
    data.button.innerHTML = "pause";
}
var pauseclicked = function(data){
    data.video.pause();
    data.button.innerHTML = "play";
}
var replayclicked = function(data){
    data.video.currentTime = 0;
    data.video.play();
}

var videoloaded = function(data){
    data.video.load();
    data.playButton.disabled = false;
    //data.replayButton.disabled = false;
}



var vp = new VideoPlayer();

vp.events.on("video-loaded", videoloaded);

vp.events.on("video-ended", videoended);

vp.events.on("state-change", logStateChange);

vp.events.on("play-clicked", playclicked);

vp.events.on("pause-clicked", pauseclicked);

// vp.events.on("replay-clicked", replayclicked);


var config = {
    url: "./video1.mp4",
    width: "640px",
    height: "360px",
    autoplay: true,
}

// window.onload = function () {

    var playButton = document.getElementById("playbutton");
    var soundButton = document.getElementById("soundButton");
    var fullScreenButton = document.getElementById("fullscreenButton");
    // var replayButton = document.getElementById("replaybutton");
    playButton.disabled = true;
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



    videoContainer.style.setProperty("width",config.width);
    videoContainer.style.setProperty("height", config.height);
    videoSrc.setAttribute("src", config.url);


    vp.variablesReady()
    vp.loadVariables();

    vp.loadVideo({video: video, playButton: playButton});



    playButton.addEventListener("click", function () {
        if (vp.fsm.currentStateName === "pause") {
            vp.play({video: video, button: this});
        } else if (vp.fsm.currentStateName === "play") {
            vp.pause({video: video, button: this});
        }
    });
    // replayButton.addEventListener("click", function () {
    //     if (vp.fsm.currentStateName === "end") {
    //         vp.replay({video: video, button: this});
    //     }
    // });
    soundButton.addEventListener("click", function () {
        video.muted = !video.muted;
    });   

    fullscreenButton.addEventListener("click", function() {
        if(fullscreenOn){
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
            $(videoContainer).css({"width": "640px", "height": "360px"});
            fullscreenOn = false;
        }else{
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.mozRequestFullScreen) {
                videoContainer.mozRequestFullScreen(); // Firefox
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen(); // Chrome and Safari
            }
    
            $(videoContainer).css({"width": "100%", "height": "100%"});
            fullscreenOn = true;
        }
      });



    video.addEventListener("ended", function(){
        vp.videoEnded({video: video});
    })

    video.addEventListener("timeupdate", function(){
        var value = (video.currentTime / video.duration) * 100;
        $("#playprogress").css("width", value+"%");
        
    });
    
    seekbar.addEventListener("mousedown", function(){
        seeking = true;
    });

    
    window.addEventListener("mousemove", function(e){
        if(seeking){

            var widthclicked = (e.pageX - (seekbar.offsetLeft + videoContainer.offsetLeft))/seekbar.offsetWidth * 100;
            widthclicked = Math.max(0, Math.min(widthclicked, 100));
            var time = video.duration * (widthclicked / 100);
            video.currentTime = time;
        }
    });

    window.addEventListener("mouseup", function(e){
        if(seeking){
            var widthclicked = (e.pageX - (seekbar.offsetLeft + videoContainer.offsetLeft))/seekbar.offsetWidth * 100;
            widthclicked = Math.max(0, Math.min(widthclicked, 100));
            var time = video.duration * (widthclicked / 100);
            video.currentTime = time;
            seeking = false;

        }
    });


    




// }








