var recognition = new webkitSpeechRecognition();
var start_time = null;
var confidence = 0;

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
    return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function start_recording(interim_callback, end_callback) {
    var start_time = new Date();
    var recorder;
    navigator.webkitGetUserMedia({"audio": true}, function(stream) {
	var audioContext = new webkitAudioContext();
	var mediaStreamSource = audioContext.createMediaStreamSource(stream);
	var prefix = window.location.href.match('https*://.*?\..*?(/.*/)');
	prefix = prefix === null ? '/' : prefix[1];
	recorder = new Recorder(mediaStreamSource, {
	    workerPath: prefix + "js/lib/recorderjs/recorderWorker.js"
	});
	recorder.clear();
	recorder.record();
    }, function (error) {});
    
    recognition.continuous = true;
    recognition.interimResults = true;
    var final_transcript = '';
    var last_time = new Date();
    var last_words = '';
    var word_timings = [];
    
    recognition.onresult = function(event) {
	var interim_transcript = '';
	confidence = 0;
	var pause_time = new Date() - last_time;
	last_time = new Date();
	if (pause_time > 500) {
	    console.log("paused for " + pause_time);
	}
	for (var i = event.resultIndex; i < event.results.length; i++) {
	    if (event.results[i].isFinal) {
		final_transcript += event.results[i][0].transcript;
	    } else {
		interim_transcript += event.results[i][0].transcript;
	    }
	    confidence += event.results[i][0].confidence;
	}
	final_transcript = capitalize(final_transcript);
	if (interim_callback != undefined) interim_callback(linebreak(final_transcript), linebreak(interim_transcript), confidence / event.results.length);
	recognition.onstart = function(event) {
	    start_time = new Date()
	}
    }

    recognition.onend = function(event) {
	if (end_callback != undefined) end_callback(linebreak(final_transcript), new Date() - start_time, confidence);
	recorder.stop();
	recorder.exportWAV(function(wav) {
	    var url = window.webkitURL.createObjectURL(wav);
	    document.getElementsByTagName("audio")[0].setAttribute("src", url);
	});
	
    };
    
    recognition.start();
}

function stop_recording() {
    recognition.stop();
}

badwrds = ["um", "uh", "stuff", "thing", "things", "yeah"]
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
descrips = ["creative","dynamic","intuitive","synergetic","big data","nosql","analytic","cutting-edge","groundbreaking","next generation","multi-platform","html5","web5.0","angular","sleek","professional","powerful","innovative","reactive","data-driven","customer-focused","100% satisfaction","mobile-friendly","mobile-ready","expandable","modern","user-friendly","intelligent","seamless","flexible","connected","adaptive","advanced","scaled","leading","developed","transparent","partnered","integrated","simple","adaptable","aggregate","redefined","multitasking","productive","object-oriented","high definition","virtual reality","hyper-threaded","free to play","semantic","global","hydrodynamic","thin","slim","lightweight","USB3.0","single port","universal","blue","backend","frontend","trending","pivotal","revolutionary","infrastructure-focused","feature-rich","static","one-page","on-demand","relational","educational","innovative"];

window.onload = function(){
    var w1 = descrips[Math.floor(Math.random()*descrips.length)];
    var w2 = descrips[Math.floor(Math.random()*descrips.length)];
    document.getElementById("descript").innerHTML = "The "+w1+", "+w2+" way to practice your speech/presentation";
}


function batonscript()
{
    var but = document.getElementById("baton")
    if (but.src.endsWith("mic_off.png" )){
	console.log("here")
	but.setAttribute("src", "images/mic_on.gif");
        start_recording(function(final_transcript, interim_transcript) {
	    console.log(final_transcript + interim_transcript);
	}, revmod);

    } else {
	but.setAttribute("src", "images/mic_off.png");
	processing();
        stop_recording();
    }
    
}

function processing(){
    $("#procmodal").foundation('reveal', 'open');
}

function revmod(final_transcript, time, confidence){
    $("#procmodal").trigger("reveal:close"); 
    $("#myModal").foundation('reveal', 'open');
    var st = stats( processData(final_transcript,time));
    var tip = "You blew us away!"
    console.log( confidence)
    if( confidence < .81 )
	tip = "You were difficult to understand.  Speak clearly and make sure there is no background noise.";
    else if ( st.wpm > 140 )
	tip = "Slow down!  Nobody understood you.";
    else if (st.wpm < 100 )
	tip = "Your pacing was a little slow.";
    else if (st.fills > 2 )
	tip = "Try to use less filler words (such as \""+(st.filllist)[0]+"\").";
    document.getElementById("tip").innerHTML = tip;
    //conf message
    //tip
    document.getElementById("time").innerHTML = "Time: "+(st.time/1000)+" seconds.";
    document.getElementById("words").innerHTML = "Words: "+st.words;
    document.getElementById("fillers").innerHTML = "Filler Words Per Minute: "+st.fills.toFixed(2);
    document.getElementById("wpm").innerHTML = "Words per minute: "+st.wpm.toFixed(2);
}

function processData(text, tim)
{
    var proc = {time:tim, trans:text, words:0, fills:[] }
    var spl = text.split(" ");
    spl.forEach(function(x) {
	console.log( x )
	proc.words++;
	badwrds.forEach(function(y) {
	    if (x == y)
		proc.fills.push( x );	    
	})
    })
    return proc;
}

function stats( proc )
{
    var st = { time:proc.time, words:proc.words, fills:(proc.fills.length / proc.time * (60000.0)), wpm: (proc.words / proc.time * (60000.0)), filllist:proc.fills };
    console.log(st.filllist);
    return st;
}
