let currentClipTime, currentClipName, clipsArr = []

let socket = new WebSocket("ws://localhost:8999")

socket.onopen = function(e) {
    let data = {
        command: 'connect',
        ipAddress: '10.10.200.68'
    }
    socket.send(JSON.stringify(data))

}

socket.onmessage = (event) => {
    let data = JSON.parse(event.data)
    
    if (data.type == 'clipList') {
        let clips = data.clips
        let colourClips = 0
        let tvcClips = 0
        let ivClips = 0
        let otherClips = 0

        clips.forEach((clip, index) => {
            if (clip.name.includes('COLOUR')) {
                clips[index].category = 'COLOUR'
                colourClips++
            } else if (clip.name.includes('TVC')) {
                clips[index].category = 'TVC'
                tvcClips++
            } else if (clip.name.includes('IV')) {
                clips[index].category = 'IV'
                ivClips++
            } else {
                clips[index].category = 'OTHER'
                otherClips++
            }
        })

        $('.clipsGroup').html('')

        clipsArr = clips
        
        for (let clip of clips) {
            $(`#clips-${clip.category}`).append(`
            <div class="col-md-3 mb-3">
                <div>
                    <p class="fw-bold m-0">${clip.name}</p>
                    <p class="mb-2">${clip.outTime}</p>
                </div>
                <button class="btn bg-light btn-sm me-3 loadClip" data-id="${clip.id}" data-outtime="${clip.outTime}" data-name="${clip.name}">Load</button>
            </div>
            `)
        }

        $('#colourClipNumber').html(colourClips)
        $('#tvcClipNumber').html(tvcClips)
        $('#ivClipNumber').html(ivClips)
        $('#otherClipNumber').html(otherClips)

    } else if (data.type == 'connection') {
        let data = {
            command: 'getClips'
        }
        socket.send(JSON.stringify(data))
    } else if (data.type == 'displayTimecode') {
        $('#displayTimecode').html(data.timecode)
        let t = Timecode(currentClipTime, 25)
        t.subtract(data.timecode)
        $('#displayDuration').html(t.toString())
    } else if (data.type == 'updateClips') {
        let data = {
            command: 'getClips'
        }
        socket.send(JSON.stringify(data))
    }
}

let playBtn = document.querySelector('#hdPlay')
let stopBtn = document.querySelector('#hdStop')
let goToSTartBtn = document.querySelector('#hsGoToStart')
let getClipsBtn = document.querySelector('#hdGetClips')

goToSTartBtn.addEventListener('click', () => {
    let data = {
        command: 'goToStart'
    }
    socket.send(JSON.stringify(data))
})

playBtn.addEventListener("click", () => {
    let data = {
        command: 'play'
    }
    socket.send(JSON.stringify(data))
})

stopBtn.addEventListener("click", () => {
    let data = {
        command: 'stop'
    }
    socket.send(JSON.stringify(data))
})

getClipsBtn.addEventListener("click", () => {
    let data = {
        command: 'getClips'
    }
    socket.send(JSON.stringify(data))
})

const filterClips = (filter) => {
    filter = filter.toUpperCase()
    let arr = clipsArr.filter((clip) => {
        if (clip.name.includes(filter)) {
            return clip
        }
    })

    return arr
}

$('#filterSearch').on('keyup', function() {
    if ($('#filterSearch').val()) {
        let res = filterClips($('#filterSearch').val())
        $('#filterClips').html('')
        for (let clip of res) {
            let label
            if (clip.category == 'COLOUR') {
                label = '<span class="badge bg-primary">COLOUR</span>'
            } else if (clip.category == 'TVC') {
                label = '<span class="badge bg-warning">TVC</span>'
            } else if (clip.category == 'IV') {
                label = '<span class="badge bg-danger">INTERVIEW</span>'
            } else if (clip.category == 'OTHER') {
                label = '<span class="badge bg-success">OTHER</span>'
            }
            $('#filterClips').append(`
            <div class="col-md-3 mb-3">
                <div>
                    <p class="fw-bold m-0">${clip.name} ${label}</p>
                    <p class="mb-2">${clip.outTime}</p>
                </div>
                <button class="btn bg-light btn-sm me-3 loadClip" data-id="${clip.id}" data-outtime="${clip.outTime}" data-name="${clip.name}">Load</button>
            </div>
            `)
        }
        $('#filterContent').show()
        $('#clipsContent').hide()
    } else {
        $('#filterContent').hide()
        $('#clipsContent').show()
    }
    
})

$('#filterClear').on('click', function() {
    $('#filterSearch').val('')
    $('#filterContent').hide()
    $('#clipsContent').show()
})

$(function() {
    $('body').on('click', '.loadClip', function () {
        currentClipTime = $(this).data('outtime')
        $('#currentClipName').html($(this).data('name'))
        let data = {
            command: 'loadClip',
            clipId: $(this).data('id')
        }
        socket.send(JSON.stringify(data))
    })

    $('.groupToggle').on('click', function() {
        $(`#${$(this).data('id')}`).toggle()
    })

    $('.clipsGroup').hide()

    let clipsGroups = 'hide'

    $('#toggleAll').on('click', function() {
        if (clipsGroups == 'hide') {
            $('.clipsGroup').show()
            clipsGroups = 'show'
        } else {
            $('.clipsGroup').hide()
            clipsGroups = 'hide'
        }
    })

    const filterBox = document.querySelector('#filterSearch')

    document.body.onkeyup = function(e) {
        console.log(e);
        if (e.key == " " || e.code == "Space" || e.key == "l") {
          if (filterBox !== document.activeElement) {
            let data = {
                command: 'play'
            }
            socket.send(JSON.stringify(data))
          }
        } else if (e.key == "q") {
            if (filterBox !== document.activeElement) {
                let data = {
                    command: 'goToStart'
                }
                socket.send(JSON.stringify(data))
            }
        } else if (e.key == "k") {
            if (filterBox !== document.activeElement) {
                let data = {
                    command: 'stop'
                }
                socket.send(JSON.stringify(data))
            }
        }
    }

    $('.btn').on('click', function() {
        $(this).blur()
    })
})




var Timecode = function ( timeCode, frameRate, dropFrame ) {

    // Make this class safe for use without "new"
    if (!(this instanceof Timecode)) return new Timecode( timeCode, frameRate, dropFrame);
    
    // If we are passed dropFrame, we need to use it
    if (typeof dropFrame === 'boolean') this.dropFrame = dropFrame;
    else this.dropFrame = false;

    // Get frame rate
    this.frameRateDen = 0;
    switch (typeof (frameRate)) {

        case 'undefined':
            this.frameRateNum = 30000;
            this.frameRateDen = 1001;
            this.dropFrame = true;
            break;

        case 'object':
            if (Array.isArray(frameRate) && frameRate.length>=2 && typeof(frameRate[0]) == 'number' && typeof(frameRate[1]) == 'number') {
                this.frameRateNum = frameRate[0];
                this.frameRateDen = frameRate[1];
            }
            break;

        case 'number': 
            if (frameRate>0) {
                let frameRateRound = Math.round(frameRate);
                if (frameRate === frameRateRound) {  // Whole number of frames per second
                    this.frameRateNum = frameRate;
                    this.frameRateDen = 1;
                } else if (frameRate < frameRateRound && (frameRateRound == 24 || frameRateRound == 30 || frameRateRound == 60)) { 
                    // we got a fractional, we'll assume it's a 29.97, 23.98, 59.94 or something of the sort
                    this.frameRateNum = frameRateRound*1000;
                    this.frameRateDen = 1001;
                    this.dropFrame = true;
                }
            }
            break;
    }
    if (this.frameRateDen == 0) throw new Error('Invalid framerate. Either a number or an array of [numerator,denominator] are expected.');
    this.frameRate = this.frameRateNum / this.frameRateDen;
    if (this.frameRateDen!=1) this.frameRate = Math.round((this.frameRate + Number.EPSILON) * 100) / 100

    // Now either get the frame count, string or datetime        
    if (typeof timeCode === 'number') {
        this.frameCount = Math.round(timeCode);
        this._frameCountToTimeCode();
    }
    else if (typeof timeCode === 'string') {
        // pick it apart
        var parts = timeCode.match('^([012]\\d):(\\d\\d):(\\d\\d)(:|;|\\.)(\\d\\d)$');
        if (!parts) throw new Error("Timecode string expected as HH:MM:SS:FF or HH:MM:SS;FF");
        this.hours = parseInt(parts[1]);
        this.minutes = parseInt(parts[2]);
        this.seconds = parseInt(parts[3]);
        // do not override input parameters
        if (typeof dropFrame !== 'boolean') {
            this.dropFrame = parts[4]!==':';
        }
        this.frames = parseInt(parts[5]);
        this._timeCodeToFrameCount();
    }
    else if (typeof timeCode === 'object' && timeCode instanceof Date) {
        var midnight = new Date(timeCode.getFullYear(), timeCode.getMonth(), timeCode.getDate(),0,0,0);
        var midnight_tz = midnight.getTimezoneOffset() * 60 * 1000;
        var timecode_tz = timeCode.getTimezoneOffset() * 60 * 1000;
        this.frameCount = Math.round(((timeCode-midnight + (midnight_tz - timecode_tz))*this.frameRate)/1000);
        this._frameCountToTimeCode();
    }
    else if (typeof timeCode === 'object' && typeof (timeCode.hours) != 'undefined') {
        if (!frameRate && timeCode.frameRate) {
            this.frameRate = timeCode.frameRate;
            this.frameRateDen = timeCode.frameRateDen;
            this.frameRateNum = timeCode.frameRateNum;
        }
        if (typeof timeCode.dropFrame === 'boolean') this.dropFrame = timeCode.dropFrame;
        this.hours = timeCode.hours;
        this.minutes = timeCode.minutes;
        this.seconds = timeCode.seconds;
        this.frames = timeCode.frames;
        this._timeCodeToFrameCount();
    }
    else if (typeof timeCode === 'undefined') {
        this.frameCount = 0;
    }
    else {
        throw new Error('Timecode() constructor expects a number, timecode string, or Date()');
    }

    this._validate(timeCode);

    return this;
};

/**
 * Validates timecode
 * @private
 * @param {number|String|Date|Object} timeCode for the reference
 */
Timecode.prototype._validate = function (timeCode) {

    // Make sure dropFrame is only for 29.97 & 59.94
    if (this.dropFrame && this.frameRateDen != 1001) {
        throw new Error('Drop frame is only supported for 23.976, 29.97, and 59.94 fps');
    }

    // make sure the numbers make sense
    if (this.hours > 23 || this.minutes > 59 || this.seconds > 59 || this.frames >= this.frameRate ||
        (this.dropFrame && this.seconds === 0 && this.minutes % 10 && this.frames < 2 * (this.frameRate / 29.97))) {
        throw new Error("Invalid timecode" + JSON.stringify(timeCode));
    }
};

/**
 * Calculate timecode based on frame count
 * @private
 */
Timecode.prototype._frameCountToTimeCode = function() {
    var fc = this.frameCount;
    // adjust for dropFrame
    if (this.dropFrame) {
        var df = this.frameRate<=30 ? 2 : 4; // 59.94 skips 4 frames
        var d = Math.floor(this.frameCount / (17982*df/2));
        var m = this.frameCount % (17982*df/2);
        if (m<df) m=m+df;
        fc += 9*df*d + df*Math.floor((m-df)/(1798*df/2));
    }
    var fps = Math.round(this.frameRate);
    this.frames = fc % fps;
    this.seconds = Math.floor(fc/fps) % 60;
    this.minutes = Math.floor(fc/(fps*60)) % 60;
    this.hours = Math.floor(fc/(fps*3600)) % 24;
};

/**
 * Calculate frame count based on time Timecode
 * @private
 */
Timecode.prototype._timeCodeToFrameCount = function() {
    this.frameCount = (this.hours*3600 + this.minutes*60 + this.seconds) * Math.round(this.frameRate) + this.frames;
    // adjust for dropFrame
    if (this.dropFrame) {
        var totalMinutes = this.hours*60 + this.minutes;
        var df = this.frameRate < 30 ? 2 : 4;
        this.frameCount -= df * (totalMinutes - Math.floor(totalMinutes/10));    
    }
    
};

/**
 * Convert Timecode to String
 * @param {String} format output format
 * @returns {string} timecode
 */
Timecode.prototype.toString = function TimeCodeToString(format) {
    var frames = this.frames;
    var field = '';
    if (typeof format === 'string') {
        if (format === 'field') {
            if (this.frameRate<=30) field = '.0';
            else {
                frames = Math.floor(frames/2);
                field = '.'.concat((this.frameCount%2).toString());
            }
        }
        else throw new Error('Unsupported string format');
    }
    return "".concat(
        this.hours<10 ? '0' : '',
        this.hours.toString(),
        ':',
        this.minutes<10 ? '0' : '',
        this.minutes.toString(),
        ':',
        this.seconds<10 ? '0' : '',
        this.seconds.toString(),
        this.dropFrame ? ';' : ':',
        frames<10 ? '0' : '',
        frames.toString(),
        field
    );
};

/**
 * @returns {Number} the frame count when Timecode() object is used as a number
 */
Timecode.prototype.valueOf = function() {
    return this.frameCount;
};

/**
 * Adds t to timecode, in-place (i.e. the object itself changes)
 * @param {number|string|Date|Timecode} t How much to add
 * @param {boolean} [negative=false] Whether we are adding or subtracting
 * @param {Number} [rollOverMaxHours] allow rollovers
 * @returns {Timecode} timecode
 */
Timecode.prototype.add = function (t, negative, rollOverMaxHours) {
    if (typeof t === 'number') {
        var newFrameCount = this.frameCount + Math.round(t) * (negative?-1:1);
        if (newFrameCount<0 && rollOverMaxHours > 0) {
            newFrameCount = (Math.round(this.frameRate*86400)) + newFrameCount;
            if (((newFrameCount / this.frameRate) / 3600) > rollOverMaxHours) {
                throw new Error('Rollover arithmetic exceeds max permitted');
            }
        }
        if (newFrameCount<0) {
            throw new Error("Negative timecodes not supported");
        }
        this.frameCount = newFrameCount;
    }
    else {
        if (!(t instanceof Timecode)) t = new Timecode(t, [this.frameRateNum,this.frameRateDen], this.dropFrame);
        return this.add(t.frameCount,negative,rollOverMaxHours);
    }

    this.frameCount = this.frameCount % (Math.round(this.frameRate*86400)); // wraparound 24h
    this._frameCountToTimeCode();
    return this;
};


Timecode.prototype.subtract = function(t, rollOverMaxHours) {
    return this.add(t,true,rollOverMaxHours);
};

/**
 * Converts timecode to a Date() object
 * @returns {Date} date
 */
Timecode.prototype.toDate = function() {
    var ms = this.frameCount/(this.frameRateNum/this.frameRateDen)*1000;
    var midnight = new Date();
    midnight.setHours(0);
    midnight.setMinutes(0);
    midnight.setSeconds(0);
    midnight.setMilliseconds(0);

    var d = new Date( midnight.valueOf() + ms );
    var midnight_tz = midnight.getTimezoneOffset() * 60 * 1000;
    var timecode_tz = d.getTimezoneOffset() * 60 * 1000;
    return new Date( midnight.valueOf() + ms + (timecode_tz-midnight_tz));
};