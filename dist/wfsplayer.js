(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WfsPlayer = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * A stream-based aac to mp4 converter. This utility can be used to
 * deliver mp4s to a SourceBuffer on platforms that support native
 * Media Source Extensions.
 */
'use strict';
var Stream = require('../utils/stream.js');
var aacUtils = require('./utils');

// Constants
var AacStream;

/**
 * Splits an incoming stream of binary data into ADTS and ID3 Frames.
 */

AacStream = function() {
  var
    everything = new Uint8Array(),
    timeStamp = 0;

  AacStream.prototype.init.call(this);

  this.setTimestamp = function(timestamp) {
    timeStamp = timestamp;
  };

  this.push = function(bytes) {
    var
      frameSize = 0,
      byteIndex = 0,
      bytesLeft,
      chunk,
      packet,
      tempLength;

    // If there are bytes remaining from the last segment, prepend them to the
    // bytes that were pushed in
    if (everything.length) {
      tempLength = everything.length;
      everything = new Uint8Array(bytes.byteLength + tempLength);
      everything.set(everything.subarray(0, tempLength));
      everything.set(bytes, tempLength);
    } else {
      everything = bytes;
    }

    while (everything.length - byteIndex >= 3) {
      if ((everything[byteIndex] === 'I'.charCodeAt(0)) &&
          (everything[byteIndex + 1] === 'D'.charCodeAt(0)) &&
          (everything[byteIndex + 2] === '3'.charCodeAt(0))) {

        // Exit early because we don't have enough to parse
        // the ID3 tag header
        if (everything.length - byteIndex < 10) {
          break;
        }

        // check framesize
        frameSize = aacUtils.parseId3TagSize(everything, byteIndex);

        // Exit early if we don't have enough in the buffer
        // to emit a full packet
        // Add to byteIndex to support multiple ID3 tags in sequence
        if (byteIndex + frameSize > everything.length) {
          break;
        }
        chunk = {
          type: 'timed-metadata',
          data: everything.subarray(byteIndex, byteIndex + frameSize)
        };
        this.trigger('data', chunk);
        byteIndex += frameSize;
        continue;
      } else if (((everything[byteIndex] & 0xff) === 0xff) &&
                 ((everything[byteIndex + 1] & 0xf0) === 0xf0)) {

        // Exit early because we don't have enough to parse
        // the ADTS frame header
        if (everything.length - byteIndex < 7) {
          break;
        }

        frameSize = aacUtils.parseAdtsSize(everything, byteIndex);

        // Exit early if we don't have enough in the buffer
        // to emit a full packet
        if (byteIndex + frameSize > everything.length) {
          break;
        }

        packet = {
          type: 'audio',
          data: everything.subarray(byteIndex, byteIndex + frameSize),
          pts: timeStamp,
          dts: timeStamp
        };
        this.trigger('data', packet);
        byteIndex += frameSize;
        continue;
      }
      byteIndex++;
    }
    bytesLeft = everything.length - byteIndex;

    if (bytesLeft > 0) {
      everything = everything.subarray(byteIndex);
    } else {
      everything = new Uint8Array();
    }
  };

  this.reset = function() {
    everything = new Uint8Array();
    this.trigger('reset');
  };

  this.endTimeline = function() {
    everything = new Uint8Array();
    this.trigger('endedtimeline');
  };
};

AacStream.prototype = new Stream();

module.exports = AacStream;

},{"../utils/stream.js":50,"./utils":3}],3:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Utilities to detect basic properties and metadata about Aac data.
 */
'use strict';

var ADTS_SAMPLING_FREQUENCIES = [
  96000,
  88200,
  64000,
  48000,
  44100,
  32000,
  24000,
  22050,
  16000,
  12000,
  11025,
  8000,
  7350
];

var parseId3TagSize = function(header, byteIndex) {
  var
    returnSize = (header[byteIndex + 6] << 21) |
                 (header[byteIndex + 7] << 14) |
                 (header[byteIndex + 8] << 7) |
                 (header[byteIndex + 9]),
    flags = header[byteIndex + 5],
    footerPresent = (flags & 16) >> 4;

  // if we get a negative returnSize clamp it to 0
  returnSize = returnSize >= 0 ? returnSize : 0;

  if (footerPresent) {
    return returnSize + 20;
  }
  return returnSize + 10;
};

var getId3Offset = function(data, offset) {
  if (data.length - offset < 10 ||
      data[offset] !== 'I'.charCodeAt(0) ||
      data[offset + 1] !== 'D'.charCodeAt(0) ||
      data[offset + 2] !== '3'.charCodeAt(0)) {
    return offset;
  }

  offset += parseId3TagSize(data, offset);

  return getId3Offset(data, offset);
};


// TODO: use vhs-utils
var isLikelyAacData = function(data) {
  var offset = getId3Offset(data, 0);

  return data.length >= offset + 2 &&
    (data[offset] & 0xFF) === 0xFF &&
    (data[offset + 1] & 0xF0) === 0xF0 &&
    // verify that the 2 layer bits are 0, aka this
    // is not mp3 data but aac data.
    (data[offset + 1] & 0x16) === 0x10;
};

var parseSyncSafeInteger = function(data) {
  return (data[0] << 21) |
          (data[1] << 14) |
          (data[2] << 7) |
          (data[3]);
};

// return a percent-encoded representation of the specified byte range
// @see http://en.wikipedia.org/wiki/Percent-encoding
var percentEncode = function(bytes, start, end) {
  var i, result = '';
  for (i = start; i < end; i++) {
    result += '%' + ('00' + bytes[i].toString(16)).slice(-2);
  }
  return result;
};

// return the string representation of the specified byte range,
// interpreted as ISO-8859-1.
var parseIso88591 = function(bytes, start, end) {
  return unescape(percentEncode(bytes, start, end)); // jshint ignore:line
};

var parseAdtsSize = function(header, byteIndex) {
  var
    lowThree = (header[byteIndex + 5] & 0xE0) >> 5,
    middle = header[byteIndex + 4] << 3,
    highTwo = header[byteIndex + 3] & 0x3 << 11;

  return (highTwo | middle) | lowThree;
};

var parseType = function(header, byteIndex) {
  if ((header[byteIndex] === 'I'.charCodeAt(0)) &&
      (header[byteIndex + 1] === 'D'.charCodeAt(0)) &&
      (header[byteIndex + 2] === '3'.charCodeAt(0))) {
    return 'timed-metadata';
  } else if ((header[byteIndex] & 0xff === 0xff) &&
             ((header[byteIndex + 1] & 0xf0) === 0xf0)) {
    return 'audio';
  }
  return null;
};

var parseSampleRate = function(packet) {
  var i = 0;

  while (i + 5 < packet.length) {
    if (packet[i] !== 0xFF || (packet[i + 1] & 0xF6) !== 0xF0) {
      // If a valid header was not found,  jump one forward and attempt to
      // find a valid ADTS header starting at the next byte
      i++;
      continue;
    }
    return ADTS_SAMPLING_FREQUENCIES[(packet[i + 2] & 0x3c) >>> 2];
  }

  return null;
};

var parseAacTimestamp = function(packet) {
  var frameStart, frameSize, frame, frameHeader;

  // find the start of the first frame and the end of the tag
  frameStart = 10;
  if (packet[5] & 0x40) {
    // advance the frame start past the extended header
    frameStart += 4; // header size field
    frameStart += parseSyncSafeInteger(packet.subarray(10, 14));
  }

  // parse one or more ID3 frames
  // http://id3.org/id3v2.3.0#ID3v2_frame_overview
  do {
    // determine the number of bytes in this frame
    frameSize = parseSyncSafeInteger(packet.subarray(frameStart + 4, frameStart + 8));
    if (frameSize < 1) {
      return null;
    }
    frameHeader = String.fromCharCode(packet[frameStart],
                                      packet[frameStart + 1],
                                      packet[frameStart + 2],
                                      packet[frameStart + 3]);

    if (frameHeader === 'PRIV') {
      frame = packet.subarray(frameStart + 10, frameStart + frameSize + 10);

      for (var i = 0; i < frame.byteLength; i++) {
        if (frame[i] === 0) {
          var owner = parseIso88591(frame, 0, i);
          if (owner === 'com.apple.streaming.transportStreamTimestamp') {
            var d = frame.subarray(i + 1);
            var size = ((d[3] & 0x01)  << 30) |
                       (d[4]  << 22) |
                       (d[5] << 14) |
                       (d[6] << 6) |
                       (d[7] >>> 2);
            size *= 4;
            size += d[7] & 0x03;

            return size;
          }
          break;
        }
      }
    }

    frameStart += 10; // advance past the frame header
    frameStart += frameSize; // advance past the frame body
  } while (frameStart < packet.byteLength);
  return null;
};

module.exports = {
  isLikelyAacData: isLikelyAacData,
  parseId3TagSize: parseId3TagSize,
  parseAdtsSize: parseAdtsSize,
  parseType: parseType,
  parseSampleRate: parseSampleRate,
  parseAacTimestamp: parseAacTimestamp
};

},{}],4:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var Stream = require('../utils/stream.js');
var ONE_SECOND_IN_TS = require('../utils/clock').ONE_SECOND_IN_TS;

var AdtsStream;

var
  ADTS_SAMPLING_FREQUENCIES = [
    96000,
    88200,
    64000,
    48000,
    44100,
    32000,
    24000,
    22050,
    16000,
    12000,
    11025,
    8000,
    7350
  ];

/*
 * Accepts a ElementaryStream and emits data events with parsed
 * AAC Audio Frames of the individual packets. Input audio in ADTS
 * format is unpacked and re-emitted as AAC frames.
 *
 * @see http://wiki.multimedia.cx/index.php?title=ADTS
 * @see http://wiki.multimedia.cx/?title=Understanding_AAC
 */
AdtsStream = function(handlePartialSegments) {
  var
    buffer,
    frameNum = 0;

  AdtsStream.prototype.init.call(this);

  this.push = function(packet) {
    var
      i = 0,
      frameLength,
      protectionSkipBytes,
      frameEnd,
      oldBuffer,
      sampleCount,
      adtsFrameDuration;

    if (!handlePartialSegments) {
      frameNum = 0;
    }

    if (packet.type !== 'audio') {
      // ignore non-audio data
      return;
    }

    // Prepend any data in the buffer to the input data so that we can parse
    // aac frames the cross a PES packet boundary
    if (buffer) {
      oldBuffer = buffer;
      buffer = new Uint8Array(oldBuffer.byteLength + packet.data.byteLength);
      buffer.set(oldBuffer);
      buffer.set(packet.data, oldBuffer.byteLength);
    } else {
      buffer = packet.data;
    }

    // unpack any ADTS frames which have been fully received
    // for details on the ADTS header, see http://wiki.multimedia.cx/index.php?title=ADTS
    while (i + 5 < buffer.length) {

      // Look for the start of an ADTS header..
      if ((buffer[i] !== 0xFF) || (buffer[i + 1] & 0xF6) !== 0xF0) {
        // If a valid header was not found,  jump one forward and attempt to
        // find a valid ADTS header starting at the next byte
        i++;
        continue;
      }

      // The protection skip bit tells us if we have 2 bytes of CRC data at the
      // end of the ADTS header
      protectionSkipBytes = (~buffer[i + 1] & 0x01) * 2;

      // Frame length is a 13 bit integer starting 16 bits from the
      // end of the sync sequence
      frameLength = ((buffer[i + 3] & 0x03) << 11) |
        (buffer[i + 4] << 3) |
        ((buffer[i + 5] & 0xe0) >> 5);

      sampleCount = ((buffer[i + 6] & 0x03) + 1) * 1024;
      adtsFrameDuration = (sampleCount * ONE_SECOND_IN_TS) /
        ADTS_SAMPLING_FREQUENCIES[(buffer[i + 2] & 0x3c) >>> 2];

      frameEnd = i + frameLength;

      // If we don't have enough data to actually finish this ADTS frame, return
      // and wait for more data
      if (buffer.byteLength < frameEnd) {
        return;
      }

      // Otherwise, deliver the complete AAC frame
      this.trigger('data', {
        pts: packet.pts + (frameNum * adtsFrameDuration),
        dts: packet.dts + (frameNum * adtsFrameDuration),
        sampleCount: sampleCount,
        audioobjecttype: ((buffer[i + 2] >>> 6) & 0x03) + 1,
        channelcount: ((buffer[i + 2] & 1) << 2) |
          ((buffer[i + 3] & 0xc0) >>> 6),
        samplerate: ADTS_SAMPLING_FREQUENCIES[(buffer[i + 2] & 0x3c) >>> 2],
        samplingfrequencyindex: (buffer[i + 2] & 0x3c) >>> 2,
        // assume ISO/IEC 14496-12 AudioSampleEntry default of 16
        samplesize: 16,
        data: buffer.subarray(i + 7 + protectionSkipBytes, frameEnd)
      });

      frameNum++;

      // If the buffer is empty, clear it and return
      if (buffer.byteLength === frameEnd) {
        buffer = undefined;
        return;
      }

      // Remove the finished frame from the buffer and start the process again
      buffer = buffer.subarray(frameEnd);
    }
  };

  this.flush = function() {
    frameNum = 0;
    this.trigger('done');
  };

  this.reset = function() {
    buffer = void 0;
    this.trigger('reset');
  };

  this.endTimeline = function() {
    buffer = void 0;
    this.trigger('endedtimeline');
  };
};

AdtsStream.prototype = new Stream();

module.exports = AdtsStream;

},{"../utils/clock":48,"../utils/stream.js":50}],5:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var Stream = require('../utils/stream.js');
var ExpGolomb = require('../utils/exp-golomb.js');

var H264Stream, NalByteStream;
var PROFILES_WITH_OPTIONAL_SPS_DATA;

/**
 * Accepts a NAL unit byte stream and unpacks the embedded NAL units.
 */
NalByteStream = function() {
  var
    syncPoint = 0,
    i,
    buffer;
  NalByteStream.prototype.init.call(this);

  /*
   * Scans a byte stream and triggers a data event with the NAL units found.
   * @param {Object} data Event received from H264Stream
   * @param {Uint8Array} data.data The h264 byte stream to be scanned
   *
   * @see H264Stream.push
   */
  this.push = function(data) {
    var swapBuffer;

    if (!buffer) {
      buffer = data.data;
    } else {
      swapBuffer = new Uint8Array(buffer.byteLength + data.data.byteLength);
      swapBuffer.set(buffer);
      swapBuffer.set(data.data, buffer.byteLength);
      buffer = swapBuffer;
    }
    var len = buffer.byteLength;

    // Rec. ITU-T H.264, Annex B
    // scan for NAL unit boundaries

    // a match looks like this:
    // 0 0 1 .. NAL .. 0 0 1
    // ^ sync point        ^ i
    // or this:
    // 0 0 1 .. NAL .. 0 0 0
    // ^ sync point        ^ i

    // advance the sync point to a NAL start, if necessary
    for (; syncPoint < len - 3; syncPoint++) {
      if (buffer[syncPoint + 2] === 1) {
        // the sync point is properly aligned
        i = syncPoint + 5;
        break;
      }
    }

    while (i < len) {
      // look at the current byte to determine if we've hit the end of
      // a NAL unit boundary
      switch (buffer[i]) {
      case 0:
        // skip past non-sync sequences
        if (buffer[i - 1] !== 0) {
          i += 2;
          break;
        } else if (buffer[i - 2] !== 0) {
          i++;
          break;
        }

        // deliver the NAL unit if it isn't empty
        if (syncPoint + 3 !== i - 2) {
          this.trigger('data', buffer.subarray(syncPoint + 3, i - 2));
        }

        // drop trailing zeroes
        do {
          i++;
        } while (buffer[i] !== 1 && i < len);
        syncPoint = i - 2;
        i += 3;
        break;
      case 1:
        // skip past non-sync sequences
        if (buffer[i - 1] !== 0 ||
            buffer[i - 2] !== 0) {
          i += 3;
          break;
        }

        // deliver the NAL unit
        this.trigger('data', buffer.subarray(syncPoint + 3, i - 2));
        syncPoint = i - 2;
        i += 3;
        break;
      default:
        // the current byte isn't a one or zero, so it cannot be part
        // of a sync sequence
        i += 3;
        break;
      }
    }
    // filter out the NAL units that were delivered
    buffer = buffer.subarray(syncPoint);
    i -= syncPoint;
    syncPoint = 0;
  };

  this.reset = function() {
    buffer = null;
    syncPoint = 0;
    this.trigger('reset');
  };

  this.flush = function() {
    // deliver the last buffered NAL unit
    if (buffer && buffer.byteLength > 3) {
      this.trigger('data', buffer.subarray(syncPoint + 3));
    }
    // reset the stream state
    buffer = null;
    syncPoint = 0;
    this.trigger('done');
  };

  this.endTimeline = function() {
    this.flush();
    this.trigger('endedtimeline');
  };
};
NalByteStream.prototype = new Stream();

// values of profile_idc that indicate additional fields are included in the SPS
// see Recommendation ITU-T H.264 (4/2013),
// 7.3.2.1.1 Sequence parameter set data syntax
PROFILES_WITH_OPTIONAL_SPS_DATA = {
  100: true,
  110: true,
  122: true,
  244: true,
  44: true,
  83: true,
  86: true,
  118: true,
  128: true,
  138: true,
  139: true,
  134: true
};

/**
 * Accepts input from a ElementaryStream and produces H.264 NAL unit data
 * events.
 */
H264Stream = function() {
  var
    nalByteStream = new NalByteStream(),
    self,
    trackId,
    currentPts,
    currentDts,

    discardEmulationPreventionBytes,
    readSequenceParameterSet,
    skipScalingList;

  H264Stream.prototype.init.call(this);
  self = this;

  /*
   * Pushes a packet from a stream onto the NalByteStream
   *
   * @param {Object} packet - A packet received from a stream
   * @param {Uint8Array} packet.data - The raw bytes of the packet
   * @param {Number} packet.dts - Decode timestamp of the packet
   * @param {Number} packet.pts - Presentation timestamp of the packet
   * @param {Number} packet.trackId - The id of the h264 track this packet came from
   * @param {('video'|'audio')} packet.type - The type of packet
   *
   */
  this.push = function(packet) {
    if (packet.type !== 'video') {
      return;
    }
    trackId = packet.trackId;
    currentPts = packet.pts;
    currentDts = packet.dts;

    nalByteStream.push(packet);
  };

  /*
   * Identify NAL unit types and pass on the NALU, trackId, presentation and decode timestamps
   * for the NALUs to the next stream component.
   * Also, preprocess caption and sequence parameter NALUs.
   *
   * @param {Uint8Array} data - A NAL unit identified by `NalByteStream.push`
   * @see NalByteStream.push
   */
  nalByteStream.on('data', function(data) {
    var
      event = {
        trackId: trackId,
        pts: currentPts,
        dts: currentDts,
        data: data
      };

    switch (data[0] & 0x1f) {
    case 0x05:
      event.nalUnitType = 'slice_layer_without_partitioning_rbsp_idr';
      break;
    case 0x06:
      event.nalUnitType = 'sei_rbsp';
      event.escapedRBSP = discardEmulationPreventionBytes(data.subarray(1));
      break;
    case 0x07:
      event.nalUnitType = 'seq_parameter_set_rbsp';
      event.escapedRBSP = discardEmulationPreventionBytes(data.subarray(1));
      event.config = readSequenceParameterSet(event.escapedRBSP);
      break;
    case 0x08:
      event.nalUnitType = 'pic_parameter_set_rbsp';
      break;
    case 0x09:
      event.nalUnitType = 'access_unit_delimiter_rbsp';
      break;

    default:
      break;
    }
    // This triggers data on the H264Stream
    self.trigger('data', event);
  });
  nalByteStream.on('done', function() {
    self.trigger('done');
  });
  nalByteStream.on('partialdone', function() {
    self.trigger('partialdone');
  });
  nalByteStream.on('reset', function() {
    self.trigger('reset');
  });
  nalByteStream.on('endedtimeline', function() {
    self.trigger('endedtimeline');
  });

  this.flush = function() {
    nalByteStream.flush();
  };

  this.partialFlush = function() {
    nalByteStream.partialFlush();
  };

  this.reset = function() {
    nalByteStream.reset();
  };

  this.endTimeline = function() {
    nalByteStream.endTimeline();
  };

  /**
   * Advance the ExpGolomb decoder past a scaling list. The scaling
   * list is optionally transmitted as part of a sequence parameter
   * set and is not relevant to transmuxing.
   * @param count {number} the number of entries in this scaling list
   * @param expGolombDecoder {object} an ExpGolomb pointed to the
   * start of a scaling list
   * @see Recommendation ITU-T H.264, Section 7.3.2.1.1.1
   */
  skipScalingList = function(count, expGolombDecoder) {
    var
      lastScale = 8,
      nextScale = 8,
      j,
      deltaScale;

    for (j = 0; j < count; j++) {
      if (nextScale !== 0) {
        deltaScale = expGolombDecoder.readExpGolomb();
        nextScale = (lastScale + deltaScale + 256) % 256;
      }

      lastScale = (nextScale === 0) ? lastScale : nextScale;
    }
  };

  /**
   * Expunge any "Emulation Prevention" bytes from a "Raw Byte
   * Sequence Payload"
   * @param data {Uint8Array} the bytes of a RBSP from a NAL
   * unit
   * @return {Uint8Array} the RBSP without any Emulation
   * Prevention Bytes
   */
  discardEmulationPreventionBytes = function(data) {
    var
      length = data.byteLength,
      emulationPreventionBytesPositions = [],
      i = 1,
      newLength, newData;

    // Find all `Emulation Prevention Bytes`
    while (i < length - 2) {
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0x03) {
        emulationPreventionBytesPositions.push(i + 2);
        i += 2;
      } else {
        i++;
      }
    }

    // If no Emulation Prevention Bytes were found just return the original
    // array
    if (emulationPreventionBytesPositions.length === 0) {
      return data;
    }

    // Create a new array to hold the NAL unit data
    newLength = length - emulationPreventionBytesPositions.length;
    newData = new Uint8Array(newLength);
    var sourceIndex = 0;

    for (i = 0; i < newLength; sourceIndex++, i++) {
      if (sourceIndex === emulationPreventionBytesPositions[0]) {
        // Skip this byte
        sourceIndex++;
        // Remove this position index
        emulationPreventionBytesPositions.shift();
      }
      newData[i] = data[sourceIndex];
    }

    return newData;
  };

  /**
   * Read a sequence parameter set and return some interesting video
   * properties. A sequence parameter set is the H264 metadata that
   * describes the properties of upcoming video frames.
   * @param data {Uint8Array} the bytes of a sequence parameter set
   * @return {object} an object with configuration parsed from the
   * sequence parameter set, including the dimensions of the
   * associated video frames.
   */
  readSequenceParameterSet = function(data) {
    var
      frameCropLeftOffset = 0,
      frameCropRightOffset = 0,
      frameCropTopOffset = 0,
      frameCropBottomOffset = 0,
      sarScale = 1,
      expGolombDecoder, profileIdc, levelIdc, profileCompatibility,
      chromaFormatIdc, picOrderCntType,
      numRefFramesInPicOrderCntCycle, picWidthInMbsMinus1,
      picHeightInMapUnitsMinus1,
      frameMbsOnlyFlag,
      scalingListCount,
      sarRatio,
      aspectRatioIdc,
      i;

    expGolombDecoder = new ExpGolomb(data);
    profileIdc = expGolombDecoder.readUnsignedByte(); // profile_idc
    profileCompatibility = expGolombDecoder.readUnsignedByte(); // constraint_set[0-5]_flag
    levelIdc = expGolombDecoder.readUnsignedByte(); // level_idc u(8)
    expGolombDecoder.skipUnsignedExpGolomb(); // seq_parameter_set_id

    // some profiles have more optional data we don't need
    if (PROFILES_WITH_OPTIONAL_SPS_DATA[profileIdc]) {
      chromaFormatIdc = expGolombDecoder.readUnsignedExpGolomb();
      if (chromaFormatIdc === 3) {
        expGolombDecoder.skipBits(1); // separate_colour_plane_flag
      }
      expGolombDecoder.skipUnsignedExpGolomb(); // bit_depth_luma_minus8
      expGolombDecoder.skipUnsignedExpGolomb(); // bit_depth_chroma_minus8
      expGolombDecoder.skipBits(1); // qpprime_y_zero_transform_bypass_flag
      if (expGolombDecoder.readBoolean()) { // seq_scaling_matrix_present_flag
        scalingListCount = (chromaFormatIdc !== 3) ? 8 : 12;
        for (i = 0; i < scalingListCount; i++) {
          if (expGolombDecoder.readBoolean()) { // seq_scaling_list_present_flag[ i ]
            if (i < 6) {
              skipScalingList(16, expGolombDecoder);
            } else {
              skipScalingList(64, expGolombDecoder);
            }
          }
        }
      }
    }

    expGolombDecoder.skipUnsignedExpGolomb(); // log2_max_frame_num_minus4
    picOrderCntType = expGolombDecoder.readUnsignedExpGolomb();

    if (picOrderCntType === 0) {
      expGolombDecoder.readUnsignedExpGolomb(); // log2_max_pic_order_cnt_lsb_minus4
    } else if (picOrderCntType === 1) {
      expGolombDecoder.skipBits(1); // delta_pic_order_always_zero_flag
      expGolombDecoder.skipExpGolomb(); // offset_for_non_ref_pic
      expGolombDecoder.skipExpGolomb(); // offset_for_top_to_bottom_field
      numRefFramesInPicOrderCntCycle = expGolombDecoder.readUnsignedExpGolomb();
      for (i = 0; i < numRefFramesInPicOrderCntCycle; i++) {
        expGolombDecoder.skipExpGolomb(); // offset_for_ref_frame[ i ]
      }
    }

    expGolombDecoder.skipUnsignedExpGolomb(); // max_num_ref_frames
    expGolombDecoder.skipBits(1); // gaps_in_frame_num_value_allowed_flag

    picWidthInMbsMinus1 = expGolombDecoder.readUnsignedExpGolomb();
    picHeightInMapUnitsMinus1 = expGolombDecoder.readUnsignedExpGolomb();

    frameMbsOnlyFlag = expGolombDecoder.readBits(1);
    if (frameMbsOnlyFlag === 0) {
      expGolombDecoder.skipBits(1); // mb_adaptive_frame_field_flag
    }

    expGolombDecoder.skipBits(1); // direct_8x8_inference_flag
    if (expGolombDecoder.readBoolean()) { // frame_cropping_flag
      frameCropLeftOffset = expGolombDecoder.readUnsignedExpGolomb();
      frameCropRightOffset = expGolombDecoder.readUnsignedExpGolomb();
      frameCropTopOffset = expGolombDecoder.readUnsignedExpGolomb();
      frameCropBottomOffset = expGolombDecoder.readUnsignedExpGolomb();
    }
    if (expGolombDecoder.readBoolean()) {
      // vui_parameters_present_flag
      if (expGolombDecoder.readBoolean()) {
        // aspect_ratio_info_present_flag
        aspectRatioIdc = expGolombDecoder.readUnsignedByte();
        switch (aspectRatioIdc) {
          case 1: sarRatio = [1, 1]; break;
          case 2: sarRatio = [12, 11]; break;
          case 3: sarRatio = [10, 11]; break;
          case 4: sarRatio = [16, 11]; break;
          case 5: sarRatio = [40, 33]; break;
          case 6: sarRatio = [24, 11]; break;
          case 7: sarRatio = [20, 11]; break;
          case 8: sarRatio = [32, 11]; break;
          case 9: sarRatio = [80, 33]; break;
          case 10: sarRatio = [18, 11]; break;
          case 11: sarRatio = [15, 11]; break;
          case 12: sarRatio = [64, 33]; break;
          case 13: sarRatio = [160, 99]; break;
          case 14: sarRatio = [4, 3]; break;
          case 15: sarRatio = [3, 2]; break;
          case 16: sarRatio = [2, 1]; break;
          case 255: {
            sarRatio = [expGolombDecoder.readUnsignedByte() << 8 |
                        expGolombDecoder.readUnsignedByte(),
                        expGolombDecoder.readUnsignedByte() << 8 |
                        expGolombDecoder.readUnsignedByte() ];
            break;
          }
        }
        if (sarRatio) {
          sarScale = sarRatio[0] / sarRatio[1];
        }
      }
    }
    return {
      profileIdc: profileIdc,
      levelIdc: levelIdc,
      profileCompatibility: profileCompatibility,
      width: Math.ceil((((picWidthInMbsMinus1 + 1) * 16) - frameCropLeftOffset * 2 - frameCropRightOffset * 2) * sarScale),
      height: ((2 - frameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16) - (frameCropTopOffset * 2) - (frameCropBottomOffset * 2),
      sarRatio: sarRatio
    };
  };

};
H264Stream.prototype = new Stream();

module.exports = {
  H264Stream: H264Stream,
  NalByteStream: NalByteStream
};

},{"../utils/exp-golomb.js":49,"../utils/stream.js":50}],6:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
module.exports = {
  Adts: require('./adts'),
  h264: require('./h264')
};

},{"./adts":4,"./h264":5}],7:[function(require,module,exports){
// constants
var AUDIO_PROPERTIES = [
  'audioobjecttype',
  'channelcount',
  'samplerate',
  'samplingfrequencyindex',
  'samplesize'
];

module.exports = AUDIO_PROPERTIES;

},{}],8:[function(require,module,exports){
var VIDEO_PROPERTIES = [
  'width',
  'height',
  'profileIdc',
  'levelIdc',
  'profileCompatibility',
  'sarRatio'
];


module.exports = VIDEO_PROPERTIES;

},{}],9:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
var highPrefix = [33, 16, 5, 32, 164, 27];
var lowPrefix = [33, 65, 108, 84, 1, 2, 4, 8, 168, 2, 4, 8, 17, 191, 252];
var zeroFill = function(count) {
  var a = [];
  while (count--) {
    a.push(0);
  }
  return a;
};

var makeTable = function(metaTable) {
  return Object.keys(metaTable).reduce(function(obj, key) {
    obj[key] = new Uint8Array(metaTable[key].reduce(function(arr, part) {
      return arr.concat(part);
    }, []));
    return obj;
  }, {});
};


var silence;

module.exports = function() {
  if (!silence) {
    // Frames-of-silence to use for filling in missing AAC frames
    var coneOfSilence = {
      96000: [highPrefix, [227, 64], zeroFill(154), [56]],
      88200: [highPrefix, [231], zeroFill(170), [56]],
      64000: [highPrefix, [248, 192], zeroFill(240), [56]],
      48000: [highPrefix, [255, 192], zeroFill(268), [55, 148, 128], zeroFill(54), [112]],
      44100: [highPrefix, [255, 192], zeroFill(268), [55, 163, 128], zeroFill(84), [112]],
      32000: [highPrefix, [255, 192], zeroFill(268), [55, 234], zeroFill(226), [112]],
      24000: [highPrefix, [255, 192], zeroFill(268), [55, 255, 128], zeroFill(268), [111, 112], zeroFill(126), [224]],
      16000: [highPrefix, [255, 192], zeroFill(268), [55, 255, 128], zeroFill(268), [111, 255], zeroFill(269), [223, 108], zeroFill(195), [1, 192]],
      12000: [lowPrefix, zeroFill(268), [3, 127, 248], zeroFill(268), [6, 255, 240], zeroFill(268), [13, 255, 224], zeroFill(268), [27, 253, 128], zeroFill(259), [56]],
      11025: [lowPrefix, zeroFill(268), [3, 127, 248], zeroFill(268), [6, 255, 240], zeroFill(268), [13, 255, 224], zeroFill(268), [27, 255, 192], zeroFill(268), [55, 175, 128], zeroFill(108), [112]],
      8000: [lowPrefix, zeroFill(268), [3, 121, 16], zeroFill(47), [7]]
    };
    silence = makeTable(coneOfSilence);
  }
  return silence;
};

},{}],10:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var Stream = require('../utils/stream.js');

/**
 * The final stage of the transmuxer that emits the flv tags
 * for audio, video, and metadata. Also tranlates in time and
 * outputs caption data and id3 cues.
 */
var CoalesceStream = function(options) {
  // Number of Tracks per output segment
  // If greater than 1, we combine multiple
  // tracks into a single segment
  this.numberOfTracks = 0;
  this.metadataStream = options.metadataStream;

  this.videoTags = [];
  this.audioTags = [];
  this.videoTrack = null;
  this.audioTrack = null;
  this.pendingCaptions = [];
  this.pendingMetadata = [];
  this.pendingTracks = 0;
  this.processedTracks = 0;

  CoalesceStream.prototype.init.call(this);

  // Take output from multiple
  this.push = function(output) {
    // buffer incoming captions until the associated video segment
    // finishes
    if (output.text) {
      return this.pendingCaptions.push(output);
    }
    // buffer incoming id3 tags until the final flush
    if (output.frames) {
      return this.pendingMetadata.push(output);
    }

    if (output.track.type === 'video') {
      this.videoTrack = output.track;
      this.videoTags = output.tags;
      this.pendingTracks++;
    }
    if (output.track.type === 'audio') {
      this.audioTrack = output.track;
      this.audioTags = output.tags;
      this.pendingTracks++;
    }
  };
};

CoalesceStream.prototype = new Stream();
CoalesceStream.prototype.flush = function(flushSource) {
  var
    id3,
    caption,
    i,
    timelineStartPts,
    event = {
      tags: {},
      captions: [],
      captionStreams: {},
      metadata: []
    };

  if (this.pendingTracks < this.numberOfTracks) {
    if (flushSource !== 'VideoSegmentStream' &&
        flushSource !== 'AudioSegmentStream') {
      // Return because we haven't received a flush from a data-generating
      // portion of the segment (meaning that we have only recieved meta-data
      // or captions.)
      return;
    } else if (this.pendingTracks === 0) {
      // In the case where we receive a flush without any data having been
      // received we consider it an emitted track for the purposes of coalescing
      // `done` events.
      // We do this for the case where there is an audio and video track in the
      // segment but no audio data. (seen in several playlists with alternate
      // audio tracks and no audio present in the main TS segments.)
      this.processedTracks++;

      if (this.processedTracks < this.numberOfTracks) {
        return;
      }
    }
  }

  this.processedTracks += this.pendingTracks;
  this.pendingTracks = 0;

  if (this.processedTracks < this.numberOfTracks) {
    return;
  }

  if (this.videoTrack) {
    timelineStartPts = this.videoTrack.timelineStartInfo.pts;
  } else if (this.audioTrack) {
    timelineStartPts = this.audioTrack.timelineStartInfo.pts;
  }

  event.tags.videoTags = this.videoTags;
  event.tags.audioTags = this.audioTags;

  // Translate caption PTS times into second offsets into the
  // video timeline for the segment, and add track info
  for (i = 0; i < this.pendingCaptions.length; i++) {
    caption = this.pendingCaptions[i];
    caption.startTime = caption.startPts - timelineStartPts;
    caption.startTime /= 90e3;
    caption.endTime = caption.endPts - timelineStartPts;
    caption.endTime /= 90e3;
    event.captionStreams[caption.stream] = true;
    event.captions.push(caption);
  }

  // Translate ID3 frame PTS times into second offsets into the
  // video timeline for the segment
  for (i = 0; i < this.pendingMetadata.length; i++) {
    id3 = this.pendingMetadata[i];
    id3.cueTime = id3.pts - timelineStartPts;
    id3.cueTime /= 90e3;
    event.metadata.push(id3);
  }
  // We add this to every single emitted segment even though we only need
  // it for the first
  event.metadata.dispatchType = this.metadataStream.dispatchType;

  // Reset stream state
  this.videoTrack = null;
  this.audioTrack = null;
  this.videoTags = [];
  this.audioTags = [];
  this.pendingCaptions.length = 0;
  this.pendingMetadata.length = 0;
  this.pendingTracks = 0;
  this.processedTracks = 0;

  // Emit the final segment
  this.trigger('data', event);

  this.trigger('done');
};

module.exports = CoalesceStream;

},{"../utils/stream.js":50}],11:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var FlvTag = require('./flv-tag.js');

// For information on the FLV format, see
// http://download.macromedia.com/f4v/video_file_format_spec_v10_1.pdf.
// Technically, this function returns the header and a metadata FLV tag
// if duration is greater than zero
// duration in seconds
// @return {object} the bytes of the FLV header as a Uint8Array
var getFlvHeader = function(duration, audio, video) { // :ByteArray {
  var
    headBytes = new Uint8Array(3 + 1 + 1 + 4),
    head = new DataView(headBytes.buffer),
    metadata,
    result,
    metadataLength;

  // default arguments
  duration = duration || 0;
  audio = audio === undefined ? true : audio;
  video = video === undefined ? true : video;

  // signature
  head.setUint8(0, 0x46); // 'F'
  head.setUint8(1, 0x4c); // 'L'
  head.setUint8(2, 0x56); // 'V'

  // version
  head.setUint8(3, 0x01);

  // flags
  head.setUint8(4, (audio ? 0x04 : 0x00) | (video ? 0x01 : 0x00));

  // data offset, should be 9 for FLV v1
  head.setUint32(5, headBytes.byteLength);

  // init the first FLV tag
  if (duration <= 0) {
    // no duration available so just write the first field of the first
    // FLV tag
    result = new Uint8Array(headBytes.byteLength + 4);
    result.set(headBytes);
    result.set([0, 0, 0, 0], headBytes.byteLength);
    return result;
  }

  // write out the duration metadata tag
  metadata = new FlvTag(FlvTag.METADATA_TAG);
  metadata.pts = metadata.dts = 0;
  metadata.writeMetaDataDouble('duration', duration);
  metadataLength = metadata.finalize().length;
  result = new Uint8Array(headBytes.byteLength + metadataLength);
  result.set(headBytes);
  result.set(head.byteLength, metadataLength);

  return result;
};

module.exports = getFlvHeader;

},{"./flv-tag.js":12}],12:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * An object that stores the bytes of an FLV tag and methods for
 * querying and manipulating that data.
 * @see http://download.macromedia.com/f4v/video_file_format_spec_v10_1.pdf
 */
'use strict';

var FlvTag;

// (type:uint, extraData:Boolean = false) extends ByteArray
FlvTag = function(type, extraData) {
  var
    // Counter if this is a metadata tag, nal start marker if this is a video
    // tag. unused if this is an audio tag
    adHoc = 0, // :uint

    // The default size is 16kb but this is not enough to hold iframe
    // data and the resizing algorithm costs a bit so we create a larger
    // starting buffer for video tags
    bufferStartSize = 16384,

    // checks whether the FLV tag has enough capacity to accept the proposed
    // write and re-allocates the internal buffers if necessary
    prepareWrite = function(flv, count) {
      var
        bytes,
        minLength = flv.position + count;
      if (minLength < flv.bytes.byteLength) {
        // there's enough capacity so do nothing
        return;
      }

      // allocate a new buffer and copy over the data that will not be modified
      bytes = new Uint8Array(minLength * 2);
      bytes.set(flv.bytes.subarray(0, flv.position), 0);
      flv.bytes = bytes;
      flv.view = new DataView(flv.bytes.buffer);
    },

    // commonly used metadata properties
    widthBytes = FlvTag.widthBytes || new Uint8Array('width'.length),
    heightBytes = FlvTag.heightBytes || new Uint8Array('height'.length),
    videocodecidBytes = FlvTag.videocodecidBytes || new Uint8Array('videocodecid'.length),
    i;

  if (!FlvTag.widthBytes) {
    // calculating the bytes of common metadata names ahead of time makes the
    // corresponding writes faster because we don't have to loop over the
    // characters
    // re-test with test/perf.html if you're planning on changing this
    for (i = 0; i < 'width'.length; i++) {
      widthBytes[i] = 'width'.charCodeAt(i);
    }
    for (i = 0; i < 'height'.length; i++) {
      heightBytes[i] = 'height'.charCodeAt(i);
    }
    for (i = 0; i < 'videocodecid'.length; i++) {
      videocodecidBytes[i] = 'videocodecid'.charCodeAt(i);
    }

    FlvTag.widthBytes = widthBytes;
    FlvTag.heightBytes = heightBytes;
    FlvTag.videocodecidBytes = videocodecidBytes;
  }

  this.keyFrame = false; // :Boolean

  switch (type) {
  case FlvTag.VIDEO_TAG:
    this.length = 16;
    // Start the buffer at 256k
    bufferStartSize *= 6;
    break;
  case FlvTag.AUDIO_TAG:
    this.length = 13;
    this.keyFrame = true;
    break;
  case FlvTag.METADATA_TAG:
    this.length = 29;
    this.keyFrame = true;
    break;
  default:
    throw new Error('Unknown FLV tag type');
  }

  this.bytes = new Uint8Array(bufferStartSize);
  this.view = new DataView(this.bytes.buffer);
  this.bytes[0] = type;
  this.position = this.length;
  this.keyFrame = extraData; // Defaults to false

  // presentation timestamp
  this.pts = 0;
  // decoder timestamp
  this.dts = 0;

  // ByteArray#writeBytes(bytes:ByteArray, offset:uint = 0, length:uint = 0)
  this.writeBytes = function(bytes, offset, length) {
    var
      start = offset || 0,
      end;
    length = length || bytes.byteLength;
    end = start + length;

    prepareWrite(this, length);
    this.bytes.set(bytes.subarray(start, end), this.position);

    this.position += length;
    this.length = Math.max(this.length, this.position);
  };

  // ByteArray#writeByte(value:int):void
  this.writeByte = function(byte) {
    prepareWrite(this, 1);
    this.bytes[this.position] = byte;
    this.position++;
    this.length = Math.max(this.length, this.position);
  };

  // ByteArray#writeShort(value:int):void
  this.writeShort = function(short) {
    prepareWrite(this, 2);
    this.view.setUint16(this.position, short);
    this.position += 2;
    this.length = Math.max(this.length, this.position);
  };

  // Negative index into array
  // (pos:uint):int
  this.negIndex = function(pos) {
    return this.bytes[this.length - pos];
  };

  // The functions below ONLY work when this[0] == VIDEO_TAG.
  // We are not going to check for that because we dont want the overhead
  // (nal:ByteArray = null):int
  this.nalUnitSize = function() {
    if (adHoc === 0) {
      return 0;
    }

    return this.length - (adHoc + 4);
  };

  this.startNalUnit = function() {
    // remember position and add 4 bytes
    if (adHoc > 0) {
      throw new Error('Attempted to create new NAL wihout closing the old one');
    }

    // reserve 4 bytes for nal unit size
    adHoc = this.length;
    this.length += 4;
    this.position = this.length;
  };

  // (nal:ByteArray = null):void
  this.endNalUnit = function(nalContainer) {
    var
      nalStart, // :uint
      nalLength; // :uint

    // Rewind to the marker and write the size
    if (this.length === adHoc + 4) {
      // we started a nal unit, but didnt write one, so roll back the 4 byte size value
      this.length -= 4;
    } else if (adHoc > 0) {
      nalStart = adHoc + 4;
      nalLength = this.length - nalStart;

      this.position = adHoc;
      this.view.setUint32(this.position, nalLength);
      this.position = this.length;

      if (nalContainer) {
        // Add the tag to the NAL unit
        nalContainer.push(this.bytes.subarray(nalStart, nalStart + nalLength));
      }
    }

    adHoc = 0;
  };

  /**
   * Write out a 64-bit floating point valued metadata property. This method is
   * called frequently during a typical parse and needs to be fast.
   */
  // (key:String, val:Number):void
  this.writeMetaDataDouble = function(key, val) {
    var i;
    prepareWrite(this, 2 + key.length + 9);

    // write size of property name
    this.view.setUint16(this.position, key.length);
    this.position += 2;

    // this next part looks terrible but it improves parser throughput by
    // 10kB/s in my testing

    // write property name
    if (key === 'width') {
      this.bytes.set(widthBytes, this.position);
      this.position += 5;
    } else if (key === 'height') {
      this.bytes.set(heightBytes, this.position);
      this.position += 6;
    } else if (key === 'videocodecid') {
      this.bytes.set(videocodecidBytes, this.position);
      this.position += 12;
    } else {
      for (i = 0; i < key.length; i++) {
        this.bytes[this.position] = key.charCodeAt(i);
        this.position++;
      }
    }

    // skip null byte
    this.position++;

    // write property value
    this.view.setFloat64(this.position, val);
    this.position += 8;

    // update flv tag length
    this.length = Math.max(this.length, this.position);
    ++adHoc;
  };

  // (key:String, val:Boolean):void
  this.writeMetaDataBoolean = function(key, val) {
    var i;
    prepareWrite(this, 2);
    this.view.setUint16(this.position, key.length);
    this.position += 2;
    for (i = 0; i < key.length; i++) {
      // if key.charCodeAt(i) >= 255, handle error
      prepareWrite(this, 1);
      this.bytes[this.position] = key.charCodeAt(i);
      this.position++;
    }
    prepareWrite(this, 2);
    this.view.setUint8(this.position, 0x01);
    this.position++;
    this.view.setUint8(this.position, val ? 0x01 : 0x00);
    this.position++;
    this.length = Math.max(this.length, this.position);
    ++adHoc;
  };

  // ():ByteArray
  this.finalize = function() {
    var
      dtsDelta, // :int
      len; // :int

    switch (this.bytes[0]) {
      // Video Data
    case FlvTag.VIDEO_TAG:
       // We only support AVC, 1 = key frame (for AVC, a seekable
       // frame), 2 = inter frame (for AVC, a non-seekable frame)
      this.bytes[11] = ((this.keyFrame || extraData) ? 0x10 : 0x20) | 0x07;
      this.bytes[12] = extraData ?  0x00 : 0x01;

      dtsDelta = this.pts - this.dts;
      this.bytes[13] = (dtsDelta & 0x00FF0000) >>> 16;
      this.bytes[14] = (dtsDelta & 0x0000FF00) >>>  8;
      this.bytes[15] = (dtsDelta & 0x000000FF) >>>  0;
      break;

    case FlvTag.AUDIO_TAG:
      this.bytes[11] = 0xAF; // 44 kHz, 16-bit stereo
      this.bytes[12] = extraData ? 0x00 : 0x01;
      break;

    case FlvTag.METADATA_TAG:
      this.position = 11;
      this.view.setUint8(this.position, 0x02); // String type
      this.position++;
      this.view.setUint16(this.position, 0x0A); // 10 Bytes
      this.position += 2;
      // set "onMetaData"
      this.bytes.set([0x6f, 0x6e, 0x4d, 0x65,
                      0x74, 0x61, 0x44, 0x61,
                      0x74, 0x61], this.position);
      this.position += 10;
      this.bytes[this.position] = 0x08; // Array type
      this.position++;
      this.view.setUint32(this.position, adHoc);
      this.position = this.length;
      this.bytes.set([0, 0, 9], this.position);
      this.position += 3; // End Data Tag
      this.length = this.position;
      break;
    }

    len = this.length - 11;

    // write the DataSize field
    this.bytes[ 1] = (len & 0x00FF0000) >>> 16;
    this.bytes[ 2] = (len & 0x0000FF00) >>>  8;
    this.bytes[ 3] = (len & 0x000000FF) >>>  0;
    // write the Timestamp
    this.bytes[ 4] = (this.dts & 0x00FF0000) >>> 16;
    this.bytes[ 5] = (this.dts & 0x0000FF00) >>>  8;
    this.bytes[ 6] = (this.dts & 0x000000FF) >>>  0;
    this.bytes[ 7] = (this.dts & 0xFF000000) >>> 24;
    // write the StreamID
    this.bytes[ 8] = 0;
    this.bytes[ 9] = 0;
    this.bytes[10] = 0;

    // Sometimes we're at the end of the view and have one slot to write a
    // uint32, so, prepareWrite of count 4, since, view is uint8
    prepareWrite(this, 4);
    this.view.setUint32(this.length, this.length);
    this.length += 4;
    this.position += 4;

    // trim down the byte buffer to what is actually being used
    this.bytes = this.bytes.subarray(0, this.length);
    this.frameTime = FlvTag.frameTime(this.bytes);
    // if bytes.bytelength isn't equal to this.length, handle error
    return this;
  };
};

FlvTag.AUDIO_TAG = 0x08; // == 8, :uint
FlvTag.VIDEO_TAG = 0x09; // == 9, :uint
FlvTag.METADATA_TAG = 0x12; // == 18, :uint

// (tag:ByteArray):Boolean {
FlvTag.isAudioFrame = function(tag) {
  return FlvTag.AUDIO_TAG === tag[0];
};

// (tag:ByteArray):Boolean {
FlvTag.isVideoFrame = function(tag) {
  return FlvTag.VIDEO_TAG === tag[0];
};

// (tag:ByteArray):Boolean {
FlvTag.isMetaData = function(tag) {
  return FlvTag.METADATA_TAG === tag[0];
};

// (tag:ByteArray):Boolean {
FlvTag.isKeyFrame = function(tag) {
  if (FlvTag.isVideoFrame(tag)) {
    return tag[11] === 0x17;
  }

  if (FlvTag.isAudioFrame(tag)) {
    return true;
  }

  if (FlvTag.isMetaData(tag)) {
    return true;
  }

  return false;
};

// (tag:ByteArray):uint {
FlvTag.frameTime = function(tag) {
  var pts = tag[ 4] << 16; // :uint
  pts |= tag[ 5] <<  8;
  pts |= tag[ 6] <<  0;
  pts |= tag[ 7] << 24;
  return pts;
};

module.exports = FlvTag;

},{}],13:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
module.exports = {
  tag: require('./flv-tag'),
  Transmuxer: require('./transmuxer'),
  getFlvHeader: require('./flv-header')
};

},{"./flv-header":11,"./flv-tag":12,"./transmuxer":15}],14:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var TagList = function() {
  var self = this;

  this.list = [];

  this.push = function(tag) {
    this.list.push({
      bytes: tag.bytes,
      dts: tag.dts,
      pts: tag.pts,
      keyFrame: tag.keyFrame,
      metaDataTag: tag.metaDataTag
    });
  };

  Object.defineProperty(this, 'length', {
    get: function() {
      return self.list.length;
    }
  });
};

module.exports = TagList;

},{}],15:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var Stream = require('../utils/stream.js');
var FlvTag = require('./flv-tag.js');
var m2ts = require('../m2ts/m2ts.js');
var AdtsStream = require('../codecs/adts.js');
var H264Stream = require('../codecs/h264').H264Stream;
var CoalesceStream = require('./coalesce-stream.js');
var TagList = require('./tag-list.js');

var
  Transmuxer,
  VideoSegmentStream,
  AudioSegmentStream,
  collectTimelineInfo,
  metaDataTag,
  extraDataTag;

/**
 * Store information about the start and end of the tracka and the
 * duration for each frame/sample we process in order to calculate
 * the baseMediaDecodeTime
 */
collectTimelineInfo = function(track, data) {
  if (typeof data.pts === 'number') {
    if (track.timelineStartInfo.pts === undefined) {
      track.timelineStartInfo.pts = data.pts;
    } else {
      track.timelineStartInfo.pts =
        Math.min(track.timelineStartInfo.pts, data.pts);
    }
  }

  if (typeof data.dts === 'number') {
    if (track.timelineStartInfo.dts === undefined) {
      track.timelineStartInfo.dts = data.dts;
    } else {
      track.timelineStartInfo.dts =
        Math.min(track.timelineStartInfo.dts, data.dts);
    }
  }
};

metaDataTag = function(track, pts) {
  var
    tag = new FlvTag(FlvTag.METADATA_TAG); // :FlvTag

  tag.dts = pts;
  tag.pts = pts;

  tag.writeMetaDataDouble('videocodecid', 7);
  tag.writeMetaDataDouble('width', track.width);
  tag.writeMetaDataDouble('height', track.height);

  return tag;
};

extraDataTag = function(track, pts) {
  var
    i,
    tag = new FlvTag(FlvTag.VIDEO_TAG, true);

  tag.dts = pts;
  tag.pts = pts;

  tag.writeByte(0x01);// version
  tag.writeByte(track.profileIdc);// profile
  tag.writeByte(track.profileCompatibility);// compatibility
  tag.writeByte(track.levelIdc);// level
  tag.writeByte(0xFC | 0x03); // reserved (6 bits), NULA length size - 1 (2 bits)
  tag.writeByte(0xE0 | 0x01); // reserved (3 bits), num of SPS (5 bits)
  tag.writeShort(track.sps[0].length); // data of SPS
  tag.writeBytes(track.sps[0]); // SPS

  tag.writeByte(track.pps.length); // num of PPS (will there ever be more that 1 PPS?)
  for (i = 0; i < track.pps.length; ++i) {
    tag.writeShort(track.pps[i].length); // 2 bytes for length of PPS
    tag.writeBytes(track.pps[i]); // data of PPS
  }

  return tag;
};

/**
 * Constructs a single-track, media segment from AAC data
 * events. The output of this stream can be fed to flash.
 */
AudioSegmentStream = function(track) {
  var
    adtsFrames = [],
    videoKeyFrames = [],
    oldExtraData;

  AudioSegmentStream.prototype.init.call(this);

  this.push = function(data) {
    collectTimelineInfo(track, data);

    if (track) {
      track.audioobjecttype = data.audioobjecttype;
      track.channelcount = data.channelcount;
      track.samplerate = data.samplerate;
      track.samplingfrequencyindex = data.samplingfrequencyindex;
      track.samplesize = data.samplesize;
      track.extraData = (track.audioobjecttype << 11) |
                        (track.samplingfrequencyindex << 7) |
                        (track.channelcount << 3);
    }

    data.pts = Math.round(data.pts / 90);
    data.dts = Math.round(data.dts / 90);

    // buffer audio data until end() is called
    adtsFrames.push(data);
  };

  this.flush = function() {
    var currentFrame, adtsFrame, lastMetaPts, tags = new TagList();
    // return early if no audio data has been observed
    if (adtsFrames.length === 0) {
      this.trigger('done', 'AudioSegmentStream');
      return;
    }

    lastMetaPts = -Infinity;

    while (adtsFrames.length) {
      currentFrame = adtsFrames.shift();

      // write out a metadata frame at every video key frame
      if (videoKeyFrames.length && currentFrame.pts >= videoKeyFrames[0]) {
        lastMetaPts = videoKeyFrames.shift();
        this.writeMetaDataTags(tags, lastMetaPts);
      }

      // also write out metadata tags every 1 second so that the decoder
      // is re-initialized quickly after seeking into a different
      // audio configuration.
      if (track.extraData !== oldExtraData || currentFrame.pts - lastMetaPts >= 1000) {
        this.writeMetaDataTags(tags, currentFrame.pts);
        oldExtraData = track.extraData;
        lastMetaPts = currentFrame.pts;
      }

      adtsFrame = new FlvTag(FlvTag.AUDIO_TAG);
      adtsFrame.pts = currentFrame.pts;
      adtsFrame.dts = currentFrame.dts;

      adtsFrame.writeBytes(currentFrame.data);

      tags.push(adtsFrame.finalize());
    }

    videoKeyFrames.length = 0;
    oldExtraData = null;
    this.trigger('data', {track: track, tags: tags.list});

    this.trigger('done', 'AudioSegmentStream');
  };

  this.writeMetaDataTags = function(tags, pts) {
    var adtsFrame;

    adtsFrame = new FlvTag(FlvTag.METADATA_TAG);
    // For audio, DTS is always the same as PTS. We want to set the DTS
    // however so we can compare with video DTS to determine approximate
    // packet order
    adtsFrame.pts = pts;
    adtsFrame.dts = pts;

    // AAC is always 10
    adtsFrame.writeMetaDataDouble('audiocodecid', 10);
    adtsFrame.writeMetaDataBoolean('stereo', track.channelcount === 2);
    adtsFrame.writeMetaDataDouble('audiosamplerate', track.samplerate);
    // Is AAC always 16 bit?
    adtsFrame.writeMetaDataDouble('audiosamplesize', 16);

    tags.push(adtsFrame.finalize());

    adtsFrame = new FlvTag(FlvTag.AUDIO_TAG, true);
    // For audio, DTS is always the same as PTS. We want to set the DTS
    // however so we can compare with video DTS to determine approximate
    // packet order
    adtsFrame.pts = pts;
    adtsFrame.dts = pts;

    adtsFrame.view.setUint16(adtsFrame.position, track.extraData);
    adtsFrame.position += 2;
    adtsFrame.length = Math.max(adtsFrame.length, adtsFrame.position);

    tags.push(adtsFrame.finalize());
  };

  this.onVideoKeyFrame = function(pts) {
    videoKeyFrames.push(pts);
  };
};
AudioSegmentStream.prototype = new Stream();

/**
 * Store FlvTags for the h264 stream
 * @param track {object} track metadata configuration
 */
VideoSegmentStream = function(track) {
  var
    nalUnits = [],
    config,
    h264Frame;
  VideoSegmentStream.prototype.init.call(this);

  this.finishFrame = function(tags, frame) {
    if (!frame) {
      return;
    }
    // Check if keyframe and the length of tags.
    // This makes sure we write metadata on the first frame of a segment.
    if (config && track && track.newMetadata &&
        (frame.keyFrame || tags.length === 0)) {
      // Push extra data on every IDR frame in case we did a stream change + seek
      var metaTag = metaDataTag(config, frame.dts).finalize();
      var extraTag = extraDataTag(track, frame.dts).finalize();

      metaTag.metaDataTag = extraTag.metaDataTag = true;

      tags.push(metaTag);
      tags.push(extraTag);
      track.newMetadata = false;

      this.trigger('keyframe', frame.dts);
    }

    frame.endNalUnit();
    tags.push(frame.finalize());
    h264Frame = null;
  };

  this.push = function(data) {
    collectTimelineInfo(track, data);

    data.pts = Math.round(data.pts / 90);
    data.dts = Math.round(data.dts / 90);

    // buffer video until flush() is called
    nalUnits.push(data);
  };

  this.flush = function() {
    var
      currentNal,
      tags = new TagList();

    // Throw away nalUnits at the start of the byte stream until we find
    // the first AUD
    while (nalUnits.length) {
      if (nalUnits[0].nalUnitType === 'access_unit_delimiter_rbsp') {
        break;
      }
      nalUnits.shift();
    }

    // return early if no video data has been observed
    if (nalUnits.length === 0) {
      this.trigger('done', 'VideoSegmentStream');
      return;
    }

    while (nalUnits.length) {
      currentNal = nalUnits.shift();

      // record the track config
      if (currentNal.nalUnitType === 'seq_parameter_set_rbsp') {
        track.newMetadata = true;
        config = currentNal.config;
        track.width = config.width;
        track.height = config.height;
        track.sps = [currentNal.data];
        track.profileIdc = config.profileIdc;
        track.levelIdc = config.levelIdc;
        track.profileCompatibility = config.profileCompatibility;
        h264Frame.endNalUnit();
      } else if (currentNal.nalUnitType === 'pic_parameter_set_rbsp') {
        track.newMetadata = true;
        track.pps = [currentNal.data];
        h264Frame.endNalUnit();
      } else if (currentNal.nalUnitType === 'access_unit_delimiter_rbsp') {
        if (h264Frame) {
          this.finishFrame(tags, h264Frame);
        }
        h264Frame = new FlvTag(FlvTag.VIDEO_TAG);
        h264Frame.pts = currentNal.pts;
        h264Frame.dts = currentNal.dts;
      } else {
        if (currentNal.nalUnitType === 'slice_layer_without_partitioning_rbsp_idr') {
          // the current sample is a key frame
          h264Frame.keyFrame = true;
        }
        h264Frame.endNalUnit();
      }
      h264Frame.startNalUnit();
      h264Frame.writeBytes(currentNal.data);
    }
    if (h264Frame) {
      this.finishFrame(tags, h264Frame);
    }

    this.trigger('data', {track: track, tags: tags.list});

    // Continue with the flush process now
    this.trigger('done', 'VideoSegmentStream');
  };
};

VideoSegmentStream.prototype = new Stream();

/**
 * An object that incrementally transmuxes MPEG2 Trasport Stream
 * chunks into an FLV.
 */
Transmuxer = function(options) {
  var
    self = this,

    packetStream, parseStream, elementaryStream,
    videoTimestampRolloverStream, audioTimestampRolloverStream,
    timedMetadataTimestampRolloverStream,
    adtsStream, h264Stream,
    videoSegmentStream, audioSegmentStream, captionStream,
    coalesceStream;

  Transmuxer.prototype.init.call(this);

  options = options || {};

  // expose the metadata stream
  this.metadataStream = new m2ts.MetadataStream();

  options.metadataStream = this.metadataStream;

  // set up the parsing pipeline
  packetStream = new m2ts.TransportPacketStream();
  parseStream = new m2ts.TransportParseStream();
  elementaryStream = new m2ts.ElementaryStream();
  videoTimestampRolloverStream = new m2ts.TimestampRolloverStream('video');
  audioTimestampRolloverStream = new m2ts.TimestampRolloverStream('audio');
  timedMetadataTimestampRolloverStream = new m2ts.TimestampRolloverStream('timed-metadata');

  adtsStream = new AdtsStream();
  h264Stream = new H264Stream();
  coalesceStream = new CoalesceStream(options);

  // disassemble MPEG2-TS packets into elementary streams
  packetStream
    .pipe(parseStream)
    .pipe(elementaryStream);

  // !!THIS ORDER IS IMPORTANT!!
  // demux the streams
  elementaryStream
    .pipe(videoTimestampRolloverStream)
    .pipe(h264Stream);
  elementaryStream
    .pipe(audioTimestampRolloverStream)
    .pipe(adtsStream);

  elementaryStream
    .pipe(timedMetadataTimestampRolloverStream)
    .pipe(this.metadataStream)
    .pipe(coalesceStream);
  // if CEA-708 parsing is available, hook up a caption stream
  captionStream = new m2ts.CaptionStream();
  h264Stream.pipe(captionStream)
    .pipe(coalesceStream);

  // hook up the segment streams once track metadata is delivered
  elementaryStream.on('data', function(data) {
    var i, videoTrack, audioTrack;

    if (data.type === 'metadata') {
      i = data.tracks.length;

      // scan the tracks listed in the metadata
      while (i--) {
        if (data.tracks[i].type === 'video') {
          videoTrack = data.tracks[i];
        } else if (data.tracks[i].type === 'audio') {
          audioTrack = data.tracks[i];
        }
      }

      // hook up the video segment stream to the first track with h264 data
      if (videoTrack && !videoSegmentStream) {
        coalesceStream.numberOfTracks++;
        videoSegmentStream = new VideoSegmentStream(videoTrack);

        // Set up the final part of the video pipeline
        h264Stream
          .pipe(videoSegmentStream)
          .pipe(coalesceStream);
      }

      if (audioTrack && !audioSegmentStream) {
        // hook up the audio segment stream to the first track with aac data
        coalesceStream.numberOfTracks++;
        audioSegmentStream = new AudioSegmentStream(audioTrack);

        // Set up the final part of the audio pipeline
        adtsStream
          .pipe(audioSegmentStream)
          .pipe(coalesceStream);

        if (videoSegmentStream) {
          videoSegmentStream.on('keyframe', audioSegmentStream.onVideoKeyFrame);
        }
      }
    }
  });

  // feed incoming data to the front of the parsing pipeline
  this.push = function(data) {
    packetStream.push(data);
  };

  // flush any buffered data
  this.flush = function() {
    // Start at the top of the pipeline and flush all pending work
    packetStream.flush();
  };

  // Caption data has to be reset when seeking outside buffered range
  this.resetCaptions = function() {
    captionStream.reset();
  };

  // Re-emit any data coming from the coalesce stream to the outside world
  coalesceStream.on('data', function(event) {
    self.trigger('data', event);
  });

  // Let the consumer know we have finished flushing the entire pipeline
  coalesceStream.on('done', function() {
    self.trigger('done');
  });
};
Transmuxer.prototype = new Stream();

// forward compatibility
module.exports = Transmuxer;

},{"../codecs/adts.js":4,"../codecs/h264":5,"../m2ts/m2ts.js":19,"../utils/stream.js":50,"./coalesce-stream.js":10,"./flv-tag.js":12,"./tag-list.js":14}],16:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var muxjs = {
  codecs: require('./codecs'),
  mp4: require('./mp4'),
  flv: require('./flv'),
  mp2t: require('./m2ts'),
  partial: require('./partial')
};

// include all the tools when the full library is required
muxjs.mp4.tools = require('./tools/mp4-inspector');
muxjs.flv.tools = require('./tools/flv-inspector');
muxjs.mp2t.tools = require('./tools/ts-inspector');


module.exports = muxjs;

},{"./codecs":6,"./flv":13,"./m2ts":18,"./mp4":28,"./partial":35,"./tools/flv-inspector":39,"./tools/mp4-inspector":40,"./tools/ts-inspector":46}],17:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Reads in-band caption information from a video elementary
 * stream. Captions must follow the CEA-708 standard for injection
 * into an MPEG-2 transport streams.
 * @see https://en.wikipedia.org/wiki/CEA-708
 * @see https://www.gpo.gov/fdsys/pkg/CFR-2007-title47-vol1/pdf/CFR-2007-title47-vol1-sec15-119.pdf
 */

'use strict';

// -----------------
// Link To Transport
// -----------------

var Stream = require('../utils/stream');
var cea708Parser = require('../tools/caption-packet-parser');

var CaptionStream = function() {

  CaptionStream.prototype.init.call(this);

  this.captionPackets_ = [];

  this.ccStreams_ = [
    new Cea608Stream(0, 0), // eslint-disable-line no-use-before-define
    new Cea608Stream(0, 1), // eslint-disable-line no-use-before-define
    new Cea608Stream(1, 0), // eslint-disable-line no-use-before-define
    new Cea608Stream(1, 1) // eslint-disable-line no-use-before-define
  ];

  this.reset();

  // forward data and done events from CCs to this CaptionStream
  this.ccStreams_.forEach(function(cc) {
    cc.on('data', this.trigger.bind(this, 'data'));
    cc.on('partialdone', this.trigger.bind(this, 'partialdone'));
    cc.on('done', this.trigger.bind(this, 'done'));
  }, this);

};

CaptionStream.prototype = new Stream();
CaptionStream.prototype.push = function(event) {
  var sei, userData, newCaptionPackets;

  // only examine SEI NALs
  if (event.nalUnitType !== 'sei_rbsp') {
    return;
  }

  // parse the sei
  sei = cea708Parser.parseSei(event.escapedRBSP);

  // ignore everything but user_data_registered_itu_t_t35
  if (sei.payloadType !== cea708Parser.USER_DATA_REGISTERED_ITU_T_T35) {
    return;
  }

  // parse out the user data payload
  userData = cea708Parser.parseUserData(sei);

  // ignore unrecognized userData
  if (!userData) {
    return;
  }

  // Sometimes, the same segment # will be downloaded twice. To stop the
  // caption data from being processed twice, we track the latest dts we've
  // received and ignore everything with a dts before that. However, since
  // data for a specific dts can be split across packets on either side of
  // a segment boundary, we need to make sure we *don't* ignore the packets
  // from the *next* segment that have dts === this.latestDts_. By constantly
  // tracking the number of packets received with dts === this.latestDts_, we
  // know how many should be ignored once we start receiving duplicates.
  if (event.dts < this.latestDts_) {
    // We've started getting older data, so set the flag.
    this.ignoreNextEqualDts_ = true;
    return;
  } else if ((event.dts === this.latestDts_) && (this.ignoreNextEqualDts_)) {
    this.numSameDts_--;
    if (!this.numSameDts_) {
      // We've received the last duplicate packet, time to start processing again
      this.ignoreNextEqualDts_ = false;
    }
    return;
  }

  // parse out CC data packets and save them for later
  newCaptionPackets = cea708Parser.parseCaptionPackets(event.pts, userData);
  this.captionPackets_ = this.captionPackets_.concat(newCaptionPackets);
  if (this.latestDts_ !== event.dts) {
    this.numSameDts_ = 0;
  }
  this.numSameDts_++;
  this.latestDts_ = event.dts;
};

CaptionStream.prototype.flushCCStreams = function(flushType) {
  this.ccStreams_.forEach(function(cc) {
    return flushType === 'flush' ? cc.flush() : cc.partialFlush();
  }, this);
};

CaptionStream.prototype.flushStream = function(flushType) {
  // make sure we actually parsed captions before proceeding
  if (!this.captionPackets_.length) {
    this.flushCCStreams(flushType);
    return;
  }

  // In Chrome, the Array#sort function is not stable so add a
  // presortIndex that we can use to ensure we get a stable-sort
  this.captionPackets_.forEach(function(elem, idx) {
    elem.presortIndex = idx;
  });

  // sort caption byte-pairs based on their PTS values
  this.captionPackets_.sort(function(a, b) {
    if (a.pts === b.pts) {
      return a.presortIndex - b.presortIndex;
    }
    return a.pts - b.pts;
  });

  this.captionPackets_.forEach(function(packet) {
    if (packet.type < 2) {
      // Dispatch packet to the right Cea608Stream
      this.dispatchCea608Packet(packet);
    }
    // this is where an 'else' would go for a dispatching packets
    // to a theoretical Cea708Stream that handles SERVICEn data
  }, this);

  this.captionPackets_.length = 0;
  this.flushCCStreams(flushType);
};

CaptionStream.prototype.flush = function() {
  return this.flushStream('flush');
};

// Only called if handling partial data
CaptionStream.prototype.partialFlush = function() {
  return this.flushStream('partialFlush');
};

CaptionStream.prototype.reset = function() {
  this.latestDts_ = null;
  this.ignoreNextEqualDts_ = false;
  this.numSameDts_ = 0;
  this.activeCea608Channel_ = [null, null];
  this.ccStreams_.forEach(function(ccStream) {
    ccStream.reset();
  });
};

// From the CEA-608 spec:
/*
 * When XDS sub-packets are interleaved with other services, the end of each sub-packet shall be followed
 * by a control pair to change to a different service. When any of the control codes from 0x10 to 0x1F is
 * used to begin a control code pair, it indicates the return to captioning or Text data. The control code pair
 * and subsequent data should then be processed according to the FCC rules. It may be necessary for the
 * line 21 data encoder to automatically insert a control code pair (i.e. RCL, RU2, RU3, RU4, RDC, or RTD)
 * to switch to captioning or Text.
*/
// With that in mind, we ignore any data between an XDS control code and a
// subsequent closed-captioning control code.
CaptionStream.prototype.dispatchCea608Packet = function(packet) {
  // NOTE: packet.type is the CEA608 field
  if (this.setsTextOrXDSActive(packet)) {
    this.activeCea608Channel_[packet.type] = null;
  } else if (this.setsChannel1Active(packet)) {
    this.activeCea608Channel_[packet.type] = 0;
  } else if (this.setsChannel2Active(packet)) {
    this.activeCea608Channel_[packet.type] = 1;
  }
  if (this.activeCea608Channel_[packet.type] === null) {
    // If we haven't received anything to set the active channel, or the
    // packets are Text/XDS data, discard the data; we don't want jumbled
    // captions
    return;
  }
  this.ccStreams_[(packet.type << 1) + this.activeCea608Channel_[packet.type]].push(packet);
};

CaptionStream.prototype.setsChannel1Active = function(packet) {
  return ((packet.ccData & 0x7800) === 0x1000);
};
CaptionStream.prototype.setsChannel2Active = function(packet) {
  return ((packet.ccData & 0x7800) === 0x1800);
};
CaptionStream.prototype.setsTextOrXDSActive = function(packet) {
  return ((packet.ccData & 0x7100) === 0x0100) ||
    ((packet.ccData & 0x78fe) === 0x102a) ||
    ((packet.ccData & 0x78fe) === 0x182a);
};

// ----------------------
// Session to Application
// ----------------------

// This hash maps non-ASCII, special, and extended character codes to their
// proper Unicode equivalent. The first keys that are only a single byte
// are the non-standard ASCII characters, which simply map the CEA608 byte
// to the standard ASCII/Unicode. The two-byte keys that follow are the CEA608
// character codes, but have their MSB bitmasked with 0x03 so that a lookup
// can be performed regardless of the field and data channel on which the
// character code was received.
var CHARACTER_TRANSLATION = {
  0x2a: 0xe1,     // á
  0x5c: 0xe9,     // é
  0x5e: 0xed,     // í
  0x5f: 0xf3,     // ó
  0x60: 0xfa,     // ú
  0x7b: 0xe7,     // ç
  0x7c: 0xf7,     // ÷
  0x7d: 0xd1,     // Ñ
  0x7e: 0xf1,     // ñ
  0x7f: 0x2588,   // █
  0x0130: 0xae,   // ®
  0x0131: 0xb0,   // °
  0x0132: 0xbd,   // ½
  0x0133: 0xbf,   // ¿
  0x0134: 0x2122, // ™
  0x0135: 0xa2,   // ¢
  0x0136: 0xa3,   // £
  0x0137: 0x266a, // ♪
  0x0138: 0xe0,   // à
  0x0139: 0xa0,   //
  0x013a: 0xe8,   // è
  0x013b: 0xe2,   // â
  0x013c: 0xea,   // ê
  0x013d: 0xee,   // î
  0x013e: 0xf4,   // ô
  0x013f: 0xfb,   // û
  0x0220: 0xc1,   // Á
  0x0221: 0xc9,   // É
  0x0222: 0xd3,   // Ó
  0x0223: 0xda,   // Ú
  0x0224: 0xdc,   // Ü
  0x0225: 0xfc,   // ü
  0x0226: 0x2018, // ‘
  0x0227: 0xa1,   // ¡
  0x0228: 0x2a,   // *
  0x0229: 0x27,   // '
  0x022a: 0x2014, // —
  0x022b: 0xa9,   // ©
  0x022c: 0x2120, // ℠
  0x022d: 0x2022, // •
  0x022e: 0x201c, // “
  0x022f: 0x201d, // ”
  0x0230: 0xc0,   // À
  0x0231: 0xc2,   // Â
  0x0232: 0xc7,   // Ç
  0x0233: 0xc8,   // È
  0x0234: 0xca,   // Ê
  0x0235: 0xcb,   // Ë
  0x0236: 0xeb,   // ë
  0x0237: 0xce,   // Î
  0x0238: 0xcf,   // Ï
  0x0239: 0xef,   // ï
  0x023a: 0xd4,   // Ô
  0x023b: 0xd9,   // Ù
  0x023c: 0xf9,   // ù
  0x023d: 0xdb,   // Û
  0x023e: 0xab,   // «
  0x023f: 0xbb,   // »
  0x0320: 0xc3,   // Ã
  0x0321: 0xe3,   // ã
  0x0322: 0xcd,   // Í
  0x0323: 0xcc,   // Ì
  0x0324: 0xec,   // ì
  0x0325: 0xd2,   // Ò
  0x0326: 0xf2,   // ò
  0x0327: 0xd5,   // Õ
  0x0328: 0xf5,   // õ
  0x0329: 0x7b,   // {
  0x032a: 0x7d,   // }
  0x032b: 0x5c,   // \
  0x032c: 0x5e,   // ^
  0x032d: 0x5f,   // _
  0x032e: 0x7c,   // |
  0x032f: 0x7e,   // ~
  0x0330: 0xc4,   // Ä
  0x0331: 0xe4,   // ä
  0x0332: 0xd6,   // Ö
  0x0333: 0xf6,   // ö
  0x0334: 0xdf,   // ß
  0x0335: 0xa5,   // ¥
  0x0336: 0xa4,   // ¤
  0x0337: 0x2502, // │
  0x0338: 0xc5,   // Å
  0x0339: 0xe5,   // å
  0x033a: 0xd8,   // Ø
  0x033b: 0xf8,   // ø
  0x033c: 0x250c, // ┌
  0x033d: 0x2510, // ┐
  0x033e: 0x2514, // └
  0x033f: 0x2518  // ┘
};

var getCharFromCode = function(code) {
  if (code === null) {
    return '';
  }
  code = CHARACTER_TRANSLATION[code] || code;
  return String.fromCharCode(code);
};

// the index of the last row in a CEA-608 display buffer
var BOTTOM_ROW = 14;

// This array is used for mapping PACs -> row #, since there's no way of
// getting it through bit logic.
var ROWS = [0x1100, 0x1120, 0x1200, 0x1220, 0x1500, 0x1520, 0x1600, 0x1620,
            0x1700, 0x1720, 0x1000, 0x1300, 0x1320, 0x1400, 0x1420];

// CEA-608 captions are rendered onto a 34x15 matrix of character
// cells. The "bottom" row is the last element in the outer array.
var createDisplayBuffer = function() {
  var result = [], i = BOTTOM_ROW + 1;
  while (i--) {
    result.push('');
  }
  return result;
};

var Cea608Stream = function(field, dataChannel) {
  Cea608Stream.prototype.init.call(this);

  this.field_ = field || 0;
  this.dataChannel_ = dataChannel || 0;

  this.name_ = 'CC' + (((this.field_ << 1) | this.dataChannel_) + 1);

  this.setConstants();
  this.reset();

  this.push = function(packet) {
    var data, swap, char0, char1, text;
    // remove the parity bits
    data = packet.ccData & 0x7f7f;

    // ignore duplicate control codes; the spec demands they're sent twice
    if (data === this.lastControlCode_) {
      this.lastControlCode_ = null;
      return;
    }

    // Store control codes
    if ((data & 0xf000) === 0x1000) {
      this.lastControlCode_ = data;
    } else if (data !== this.PADDING_) {
      this.lastControlCode_ = null;
    }

    char0 = data >>> 8;
    char1 = data & 0xff;

    if (data === this.PADDING_) {
      return;

    } else if (data === this.RESUME_CAPTION_LOADING_) {
      this.mode_ = 'popOn';

    } else if (data === this.END_OF_CAPTION_) {
      // If an EOC is received while in paint-on mode, the displayed caption
      // text should be swapped to non-displayed memory as if it was a pop-on
      // caption. Because of that, we should explicitly switch back to pop-on
      // mode
      this.mode_ = 'popOn';
      this.clearFormatting(packet.pts);
      // if a caption was being displayed, it's gone now
      this.flushDisplayed(packet.pts);

      // flip memory
      swap = this.displayed_;
      this.displayed_ = this.nonDisplayed_;
      this.nonDisplayed_ = swap;

      // start measuring the time to display the caption
      this.startPts_ = packet.pts;

    } else if (data === this.ROLL_UP_2_ROWS_) {
      this.rollUpRows_ = 2;
      this.setRollUp(packet.pts);
    } else if (data === this.ROLL_UP_3_ROWS_) {
      this.rollUpRows_ = 3;
      this.setRollUp(packet.pts);
    } else if (data === this.ROLL_UP_4_ROWS_) {
      this.rollUpRows_ = 4;
      this.setRollUp(packet.pts);
    } else if (data === this.CARRIAGE_RETURN_) {
      this.clearFormatting(packet.pts);
      this.flushDisplayed(packet.pts);
      this.shiftRowsUp_();
      this.startPts_ = packet.pts;

    } else if (data === this.BACKSPACE_) {
      if (this.mode_ === 'popOn') {
        this.nonDisplayed_[this.row_] = this.nonDisplayed_[this.row_].slice(0, -1);
      } else {
        this.displayed_[this.row_] = this.displayed_[this.row_].slice(0, -1);
      }
    } else if (data === this.ERASE_DISPLAYED_MEMORY_) {
      this.flushDisplayed(packet.pts);
      this.displayed_ = createDisplayBuffer();
    } else if (data === this.ERASE_NON_DISPLAYED_MEMORY_) {
      this.nonDisplayed_ = createDisplayBuffer();

    } else if (data === this.RESUME_DIRECT_CAPTIONING_) {
      if (this.mode_ !== 'paintOn') {
        // NOTE: This should be removed when proper caption positioning is
        // implemented
        this.flushDisplayed(packet.pts);
        this.displayed_ = createDisplayBuffer();
      }
      this.mode_ = 'paintOn';
      this.startPts_ = packet.pts;

    // Append special characters to caption text
    } else if (this.isSpecialCharacter(char0, char1)) {
      // Bitmask char0 so that we can apply character transformations
      // regardless of field and data channel.
      // Then byte-shift to the left and OR with char1 so we can pass the
      // entire character code to `getCharFromCode`.
      char0 = (char0 & 0x03) << 8;
      text = getCharFromCode(char0 | char1);
      this[this.mode_](packet.pts, text);
      this.column_++;

    // Append extended characters to caption text
    } else if (this.isExtCharacter(char0, char1)) {
      // Extended characters always follow their "non-extended" equivalents.
      // IE if a "è" is desired, you'll always receive "eè"; non-compliant
      // decoders are supposed to drop the "è", while compliant decoders
      // backspace the "e" and insert "è".

      // Delete the previous character
      if (this.mode_ === 'popOn') {
        this.nonDisplayed_[this.row_] = this.nonDisplayed_[this.row_].slice(0, -1);
      } else {
        this.displayed_[this.row_] = this.displayed_[this.row_].slice(0, -1);
      }

      // Bitmask char0 so that we can apply character transformations
      // regardless of field and data channel.
      // Then byte-shift to the left and OR with char1 so we can pass the
      // entire character code to `getCharFromCode`.
      char0 = (char0 & 0x03) << 8;
      text = getCharFromCode(char0 | char1);
      this[this.mode_](packet.pts, text);
      this.column_++;

    // Process mid-row codes
    } else if (this.isMidRowCode(char0, char1)) {
      // Attributes are not additive, so clear all formatting
      this.clearFormatting(packet.pts);

      // According to the standard, mid-row codes
      // should be replaced with spaces, so add one now
      this[this.mode_](packet.pts, ' ');
      this.column_++;

      if ((char1 & 0xe) === 0xe) {
        this.addFormatting(packet.pts, ['i']);
      }

      if ((char1 & 0x1) === 0x1) {
        this.addFormatting(packet.pts, ['u']);
      }

    // Detect offset control codes and adjust cursor
    } else if (this.isOffsetControlCode(char0, char1)) {
      // Cursor position is set by indent PAC (see below) in 4-column
      // increments, with an additional offset code of 1-3 to reach any
      // of the 32 columns specified by CEA-608. So all we need to do
      // here is increment the column cursor by the given offset.
      this.column_ += (char1 & 0x03);

    // Detect PACs (Preamble Address Codes)
    } else if (this.isPAC(char0, char1)) {

      // There's no logic for PAC -> row mapping, so we have to just
      // find the row code in an array and use its index :(
      var row = ROWS.indexOf(data & 0x1f20);

      // Configure the caption window if we're in roll-up mode
      if (this.mode_ === 'rollUp') {
        // This implies that the base row is incorrectly set.
        // As per the recommendation in CEA-608(Base Row Implementation), defer to the number
        // of roll-up rows set.
        if (row - this.rollUpRows_ + 1 < 0) {
          row = this.rollUpRows_ - 1;
        }

        this.setRollUp(packet.pts, row);
      }

      if (row !== this.row_) {
        // formatting is only persistent for current row
        this.clearFormatting(packet.pts);
        this.row_ = row;
      }
      // All PACs can apply underline, so detect and apply
      // (All odd-numbered second bytes set underline)
      if ((char1 & 0x1) && (this.formatting_.indexOf('u') === -1)) {
          this.addFormatting(packet.pts, ['u']);
      }

      if ((data & 0x10) === 0x10) {
        // We've got an indent level code. Each successive even number
        // increments the column cursor by 4, so we can get the desired
        // column position by bit-shifting to the right (to get n/2)
        // and multiplying by 4.
        this.column_ = ((data & 0xe) >> 1) * 4;
      }

      if (this.isColorPAC(char1)) {
        // it's a color code, though we only support white, which
        // can be either normal or italicized. white italics can be
        // either 0x4e or 0x6e depending on the row, so we just
        // bitwise-and with 0xe to see if italics should be turned on
        if ((char1 & 0xe) === 0xe) {
          this.addFormatting(packet.pts, ['i']);
        }
      }

    // We have a normal character in char0, and possibly one in char1
    } else if (this.isNormalChar(char0)) {
      if (char1 === 0x00) {
        char1 = null;
      }
      text = getCharFromCode(char0);
      text += getCharFromCode(char1);
      this[this.mode_](packet.pts, text);
      this.column_ += text.length;

    } // finish data processing

  };
};
Cea608Stream.prototype = new Stream();
// Trigger a cue point that captures the current state of the
// display buffer
Cea608Stream.prototype.flushDisplayed = function(pts) {
  var content = this.displayed_
    // remove spaces from the start and end of the string
    .map(function(row) {
      try {
        return row.trim();
      } catch (e) {
        // Ordinarily, this shouldn't happen. However, caption
        // parsing errors should not throw exceptions and
        // break playback.
        // eslint-disable-next-line no-console
        console.error('Skipping malformed caption.');
        return '';
      }
    })
    // combine all text rows to display in one cue
    .join('\n')
    // and remove blank rows from the start and end, but not the middle
    .replace(/^\n+|\n+$/g, '');

  if (content.length) {
    this.trigger('data', {
      startPts: this.startPts_,
      endPts: pts,
      text: content,
      stream: this.name_
    });
  }
};

/**
 * Zero out the data, used for startup and on seek
 */
Cea608Stream.prototype.reset = function() {
  this.mode_ = 'popOn';
  // When in roll-up mode, the index of the last row that will
  // actually display captions. If a caption is shifted to a row
  // with a lower index than this, it is cleared from the display
  // buffer
  this.topRow_ = 0;
  this.startPts_ = 0;
  this.displayed_ = createDisplayBuffer();
  this.nonDisplayed_ = createDisplayBuffer();
  this.lastControlCode_ = null;

  // Track row and column for proper line-breaking and spacing
  this.column_ = 0;
  this.row_ = BOTTOM_ROW;
  this.rollUpRows_ = 2;

  // This variable holds currently-applied formatting
  this.formatting_ = [];
};

/**
 * Sets up control code and related constants for this instance
 */
Cea608Stream.prototype.setConstants = function() {
  // The following attributes have these uses:
  // ext_ :    char0 for mid-row codes, and the base for extended
  //           chars (ext_+0, ext_+1, and ext_+2 are char0s for
  //           extended codes)
  // control_: char0 for control codes, except byte-shifted to the
  //           left so that we can do this.control_ | CONTROL_CODE
  // offset_:  char0 for tab offset codes
  //
  // It's also worth noting that control codes, and _only_ control codes,
  // differ between field 1 and field2. Field 2 control codes are always
  // their field 1 value plus 1. That's why there's the "| field" on the
  // control value.
  if (this.dataChannel_ === 0) {
    this.BASE_     = 0x10;
    this.EXT_      = 0x11;
    this.CONTROL_  = (0x14 | this.field_) << 8;
    this.OFFSET_   = 0x17;
  } else if (this.dataChannel_ === 1) {
    this.BASE_     = 0x18;
    this.EXT_      = 0x19;
    this.CONTROL_  = (0x1c | this.field_) << 8;
    this.OFFSET_   = 0x1f;
  }

  // Constants for the LSByte command codes recognized by Cea608Stream. This
  // list is not exhaustive. For a more comprehensive listing and semantics see
  // http://www.gpo.gov/fdsys/pkg/CFR-2010-title47-vol1/pdf/CFR-2010-title47-vol1-sec15-119.pdf
  // Padding
  this.PADDING_                    = 0x0000;
  // Pop-on Mode
  this.RESUME_CAPTION_LOADING_     = this.CONTROL_ | 0x20;
  this.END_OF_CAPTION_             = this.CONTROL_ | 0x2f;
  // Roll-up Mode
  this.ROLL_UP_2_ROWS_             = this.CONTROL_ | 0x25;
  this.ROLL_UP_3_ROWS_             = this.CONTROL_ | 0x26;
  this.ROLL_UP_4_ROWS_             = this.CONTROL_ | 0x27;
  this.CARRIAGE_RETURN_            = this.CONTROL_ | 0x2d;
  // paint-on mode
  this.RESUME_DIRECT_CAPTIONING_   = this.CONTROL_ | 0x29;
  // Erasure
  this.BACKSPACE_                  = this.CONTROL_ | 0x21;
  this.ERASE_DISPLAYED_MEMORY_     = this.CONTROL_ | 0x2c;
  this.ERASE_NON_DISPLAYED_MEMORY_ = this.CONTROL_ | 0x2e;
};

/**
 * Detects if the 2-byte packet data is a special character
 *
 * Special characters have a second byte in the range 0x30 to 0x3f,
 * with the first byte being 0x11 (for data channel 1) or 0x19 (for
 * data channel 2).
 *
 * @param  {Integer} char0 The first byte
 * @param  {Integer} char1 The second byte
 * @return {Boolean}       Whether the 2 bytes are an special character
 */
Cea608Stream.prototype.isSpecialCharacter = function(char0, char1) {
  return (char0 === this.EXT_ && char1 >= 0x30 && char1 <= 0x3f);
};

/**
 * Detects if the 2-byte packet data is an extended character
 *
 * Extended characters have a second byte in the range 0x20 to 0x3f,
 * with the first byte being 0x12 or 0x13 (for data channel 1) or
 * 0x1a or 0x1b (for data channel 2).
 *
 * @param  {Integer} char0 The first byte
 * @param  {Integer} char1 The second byte
 * @return {Boolean}       Whether the 2 bytes are an extended character
 */
Cea608Stream.prototype.isExtCharacter = function(char0, char1) {
  return ((char0 === (this.EXT_ + 1) || char0 === (this.EXT_ + 2)) &&
    (char1 >= 0x20 && char1 <= 0x3f));
};

/**
 * Detects if the 2-byte packet is a mid-row code
 *
 * Mid-row codes have a second byte in the range 0x20 to 0x2f, with
 * the first byte being 0x11 (for data channel 1) or 0x19 (for data
 * channel 2).
 *
 * @param  {Integer} char0 The first byte
 * @param  {Integer} char1 The second byte
 * @return {Boolean}       Whether the 2 bytes are a mid-row code
 */
Cea608Stream.prototype.isMidRowCode = function(char0, char1) {
  return (char0 === this.EXT_ && (char1 >= 0x20 && char1 <= 0x2f));
};

/**
 * Detects if the 2-byte packet is an offset control code
 *
 * Offset control codes have a second byte in the range 0x21 to 0x23,
 * with the first byte being 0x17 (for data channel 1) or 0x1f (for
 * data channel 2).
 *
 * @param  {Integer} char0 The first byte
 * @param  {Integer} char1 The second byte
 * @return {Boolean}       Whether the 2 bytes are an offset control code
 */
Cea608Stream.prototype.isOffsetControlCode = function(char0, char1) {
  return (char0 === this.OFFSET_ && (char1 >= 0x21 && char1 <= 0x23));
};

/**
 * Detects if the 2-byte packet is a Preamble Address Code
 *
 * PACs have a first byte in the range 0x10 to 0x17 (for data channel 1)
 * or 0x18 to 0x1f (for data channel 2), with the second byte in the
 * range 0x40 to 0x7f.
 *
 * @param  {Integer} char0 The first byte
 * @param  {Integer} char1 The second byte
 * @return {Boolean}       Whether the 2 bytes are a PAC
 */
Cea608Stream.prototype.isPAC = function(char0, char1) {
  return (char0 >= this.BASE_ && char0 < (this.BASE_ + 8) &&
    (char1 >= 0x40 && char1 <= 0x7f));
};

/**
 * Detects if a packet's second byte is in the range of a PAC color code
 *
 * PAC color codes have the second byte be in the range 0x40 to 0x4f, or
 * 0x60 to 0x6f.
 *
 * @param  {Integer} char1 The second byte
 * @return {Boolean}       Whether the byte is a color PAC
 */
Cea608Stream.prototype.isColorPAC = function(char1) {
  return ((char1 >= 0x40 && char1 <= 0x4f) || (char1 >= 0x60 && char1 <= 0x7f));
};

/**
 * Detects if a single byte is in the range of a normal character
 *
 * Normal text bytes are in the range 0x20 to 0x7f.
 *
 * @param  {Integer} char  The byte
 * @return {Boolean}       Whether the byte is a normal character
 */
Cea608Stream.prototype.isNormalChar = function(char) {
  return (char >= 0x20 && char <= 0x7f);
};

/**
 * Configures roll-up
 *
 * @param  {Integer} pts         Current PTS
 * @param  {Integer} newBaseRow  Used by PACs to slide the current window to
 *                               a new position
 */
Cea608Stream.prototype.setRollUp = function(pts, newBaseRow) {
  // Reset the base row to the bottom row when switching modes
  if (this.mode_ !== 'rollUp') {
    this.row_ = BOTTOM_ROW;
    this.mode_ = 'rollUp';
    // Spec says to wipe memories when switching to roll-up
    this.flushDisplayed(pts);
    this.nonDisplayed_ = createDisplayBuffer();
    this.displayed_ = createDisplayBuffer();
  }

  if (newBaseRow !== undefined && newBaseRow !== this.row_) {
    // move currently displayed captions (up or down) to the new base row
    for (var i = 0; i < this.rollUpRows_; i++) {
      this.displayed_[newBaseRow - i] = this.displayed_[this.row_ - i];
      this.displayed_[this.row_ - i] = '';
    }
  }

  if (newBaseRow === undefined) {
    newBaseRow = this.row_;
  }

  this.topRow_ = newBaseRow - this.rollUpRows_ + 1;
};

// Adds the opening HTML tag for the passed character to the caption text,
// and keeps track of it for later closing
Cea608Stream.prototype.addFormatting = function(pts, format) {
  this.formatting_ = this.formatting_.concat(format);
  var text = format.reduce(function(text, format) {
    return text + '<' + format + '>';
  }, '');
  this[this.mode_](pts, text);
};

// Adds HTML closing tags for current formatting to caption text and
// clears remembered formatting
Cea608Stream.prototype.clearFormatting = function(pts) {
  if (!this.formatting_.length) {
    return;
  }
  var text = this.formatting_.reverse().reduce(function(text, format) {
    return text + '</' + format + '>';
  }, '');
  this.formatting_ = [];
  this[this.mode_](pts, text);
};

// Mode Implementations
Cea608Stream.prototype.popOn = function(pts, text) {
  var baseRow = this.nonDisplayed_[this.row_];

  // buffer characters
  baseRow += text;
  this.nonDisplayed_[this.row_] = baseRow;
};

Cea608Stream.prototype.rollUp = function(pts, text) {
  var baseRow = this.displayed_[this.row_];

  baseRow += text;
  this.displayed_[this.row_] = baseRow;

};

Cea608Stream.prototype.shiftRowsUp_ = function() {
  var i;
  // clear out inactive rows
  for (i = 0; i < this.topRow_; i++) {
    this.displayed_[i] = '';
  }
  for (i = this.row_ + 1; i < BOTTOM_ROW + 1; i++) {
    this.displayed_[i] = '';
  }
  // shift displayed rows up
  for (i = this.topRow_; i < this.row_; i++) {
    this.displayed_[i] = this.displayed_[i + 1];
  }
  // clear out the bottom row
  this.displayed_[this.row_] = '';
};

Cea608Stream.prototype.paintOn = function(pts, text) {
  var baseRow = this.displayed_[this.row_];

  baseRow += text;
  this.displayed_[this.row_] = baseRow;
};

// exports
module.exports = {
  CaptionStream: CaptionStream,
  Cea608Stream: Cea608Stream
};

},{"../tools/caption-packet-parser":38,"../utils/stream":50}],18:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
module.exports = require('./m2ts');

},{"./m2ts":19}],19:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * A stream-based mp2t to mp4 converter. This utility can be used to
 * deliver mp4s to a SourceBuffer on platforms that support native
 * Media Source Extensions.
 */
'use strict';
var Stream = require('../utils/stream.js'),
  CaptionStream = require('./caption-stream'),
  StreamTypes = require('./stream-types'),
  TimestampRolloverStream = require('./timestamp-rollover-stream').TimestampRolloverStream;

// object types
var TransportPacketStream, TransportParseStream, ElementaryStream;

// constants
var
  MP2T_PACKET_LENGTH = 188, // bytes
  SYNC_BYTE = 0x47;

/**
 * Splits an incoming stream of binary data into MPEG-2 Transport
 * Stream packets.
 */
TransportPacketStream = function() {
  var
    buffer = new Uint8Array(MP2T_PACKET_LENGTH),
    bytesInBuffer = 0;

  TransportPacketStream.prototype.init.call(this);

   // Deliver new bytes to the stream.

  /**
   * Split a stream of data into M2TS packets
  **/
  this.push = function(bytes) {
    var
      startIndex = 0,
      endIndex = MP2T_PACKET_LENGTH,
      everything;

    // If there are bytes remaining from the last segment, prepend them to the
    // bytes that were pushed in
    if (bytesInBuffer) {
      everything = new Uint8Array(bytes.byteLength + bytesInBuffer);
      everything.set(buffer.subarray(0, bytesInBuffer));
      everything.set(bytes, bytesInBuffer);
      bytesInBuffer = 0;
    } else {
      everything = bytes;
    }

    // While we have enough data for a packet
    while (endIndex < everything.byteLength) {
      // Look for a pair of start and end sync bytes in the data..
      if (everything[startIndex] === SYNC_BYTE && everything[endIndex] === SYNC_BYTE) {
        // We found a packet so emit it and jump one whole packet forward in
        // the stream
        this.trigger('data', everything.subarray(startIndex, endIndex));
        startIndex += MP2T_PACKET_LENGTH;
        endIndex += MP2T_PACKET_LENGTH;
        continue;
      }
      // If we get here, we have somehow become de-synchronized and we need to step
      // forward one byte at a time until we find a pair of sync bytes that denote
      // a packet
      startIndex++;
      endIndex++;
    }

    // If there was some data left over at the end of the segment that couldn't
    // possibly be a whole packet, keep it because it might be the start of a packet
    // that continues in the next segment
    if (startIndex < everything.byteLength) {
      buffer.set(everything.subarray(startIndex), 0);
      bytesInBuffer = everything.byteLength - startIndex;
    }
  };

  /**
   * Passes identified M2TS packets to the TransportParseStream to be parsed
  **/
  this.flush = function() {
    // If the buffer contains a whole packet when we are being flushed, emit it
    // and empty the buffer. Otherwise hold onto the data because it may be
    // important for decoding the next segment
    if (bytesInBuffer === MP2T_PACKET_LENGTH && buffer[0] === SYNC_BYTE) {
      this.trigger('data', buffer);
      bytesInBuffer = 0;
    }
    this.trigger('done');
  };

  this.endTimeline = function() {
    this.flush();
    this.trigger('endedtimeline');
  };

  this.reset = function() {
    bytesInBuffer = 0;
    this.trigger('reset');
  };
};
TransportPacketStream.prototype = new Stream();

/**
 * Accepts an MP2T TransportPacketStream and emits data events with parsed
 * forms of the individual transport stream packets.
 */
TransportParseStream = function() {
  var parsePsi, parsePat, parsePmt, self;
  TransportParseStream.prototype.init.call(this);
  self = this;

  this.packetsWaitingForPmt = [];
  this.programMapTable = undefined;

  parsePsi = function(payload, psi) {
    var offset = 0;

    // PSI packets may be split into multiple sections and those
    // sections may be split into multiple packets. If a PSI
    // section starts in this packet, the payload_unit_start_indicator
    // will be true and the first byte of the payload will indicate
    // the offset from the current position to the start of the
    // section.
    if (psi.payloadUnitStartIndicator) {
      offset += payload[offset] + 1;
    }

    if (psi.type === 'pat') {
      parsePat(payload.subarray(offset), psi);
    } else {
      parsePmt(payload.subarray(offset), psi);
    }
  };

  parsePat = function(payload, pat) {
    pat.section_number = payload[7]; // eslint-disable-line camelcase
    pat.last_section_number = payload[8]; // eslint-disable-line camelcase

    // skip the PSI header and parse the first PMT entry
    self.pmtPid = (payload[10] & 0x1F) << 8 | payload[11];
    pat.pmtPid = self.pmtPid;
  };

  /**
   * Parse out the relevant fields of a Program Map Table (PMT).
   * @param payload {Uint8Array} the PMT-specific portion of an MP2T
   * packet. The first byte in this array should be the table_id
   * field.
   * @param pmt {object} the object that should be decorated with
   * fields parsed from the PMT.
   */
  parsePmt = function(payload, pmt) {
    var sectionLength, tableEnd, programInfoLength, offset;

    // PMTs can be sent ahead of the time when they should actually
    // take effect. We don't believe this should ever be the case
    // for HLS but we'll ignore "forward" PMT declarations if we see
    // them. Future PMT declarations have the current_next_indicator
    // set to zero.
    if (!(payload[5] & 0x01)) {
      return;
    }

    // overwrite any existing program map table
    self.programMapTable = {
      video: null,
      audio: null,
      'timed-metadata': {}
    };

    // the mapping table ends at the end of the current section
    sectionLength = (payload[1] & 0x0f) << 8 | payload[2];
    tableEnd = 3 + sectionLength - 4;

    // to determine where the table is, we have to figure out how
    // long the program info descriptors are
    programInfoLength = (payload[10] & 0x0f) << 8 | payload[11];

    // advance the offset to the first entry in the mapping table
    offset = 12 + programInfoLength;
    while (offset < tableEnd) {
      var streamType = payload[offset];
      var pid = (payload[offset + 1] & 0x1F) << 8 | payload[offset + 2];

      // only map a single elementary_pid for audio and video stream types
      // TODO: should this be done for metadata too? for now maintain behavior of
      //       multiple metadata streams
      if (streamType === StreamTypes.H264_STREAM_TYPE &&
          self.programMapTable.video === null) {
        self.programMapTable.video = pid;
      } else if (streamType === StreamTypes.ADTS_STREAM_TYPE &&
                 self.programMapTable.audio === null) {
        self.programMapTable.audio = pid;
      } else if (streamType === StreamTypes.METADATA_STREAM_TYPE) {
        // map pid to stream type for metadata streams
        self.programMapTable['timed-metadata'][pid] = streamType;
      }

      // move to the next table entry
      // skip past the elementary stream descriptors, if present
      offset += ((payload[offset + 3] & 0x0F) << 8 | payload[offset + 4]) + 5;
    }

    // record the map on the packet as well
    pmt.programMapTable = self.programMapTable;
  };

  /**
   * Deliver a new MP2T packet to the next stream in the pipeline.
   */
  this.push = function(packet) {
    var
      result = {},
      offset = 4;

    result.payloadUnitStartIndicator = !!(packet[1] & 0x40);

    // pid is a 13-bit field starting at the last bit of packet[1]
    result.pid = packet[1] & 0x1f;
    result.pid <<= 8;
    result.pid |= packet[2];

    // if an adaption field is present, its length is specified by the
    // fifth byte of the TS packet header. The adaptation field is
    // used to add stuffing to PES packets that don't fill a complete
    // TS packet, and to specify some forms of timing and control data
    // that we do not currently use.
    if (((packet[3] & 0x30) >>> 4) > 0x01) {
      offset += packet[offset] + 1;
    }

    // parse the rest of the packet based on the type
    if (result.pid === 0) {
      result.type = 'pat';
      parsePsi(packet.subarray(offset), result);
      this.trigger('data', result);
    } else if (result.pid === this.pmtPid) {
      result.type = 'pmt';
      parsePsi(packet.subarray(offset), result);
      this.trigger('data', result);

      // if there are any packets waiting for a PMT to be found, process them now
      while (this.packetsWaitingForPmt.length) {
        this.processPes_.apply(this, this.packetsWaitingForPmt.shift());
      }
    } else if (this.programMapTable === undefined) {
      // When we have not seen a PMT yet, defer further processing of
      // PES packets until one has been parsed
      this.packetsWaitingForPmt.push([packet, offset, result]);
    } else {
      this.processPes_(packet, offset, result);
    }
  };

  this.processPes_ = function(packet, offset, result) {
    // set the appropriate stream type
    if (result.pid === this.programMapTable.video) {
      result.streamType = StreamTypes.H264_STREAM_TYPE;
    } else if (result.pid === this.programMapTable.audio) {
      result.streamType = StreamTypes.ADTS_STREAM_TYPE;
    } else {
      // if not video or audio, it is timed-metadata or unknown
      // if unknown, streamType will be undefined
      result.streamType = this.programMapTable['timed-metadata'][result.pid];
    }

    result.type = 'pes';
    result.data = packet.subarray(offset);
    this.trigger('data', result);
  };
};
TransportParseStream.prototype = new Stream();
TransportParseStream.STREAM_TYPES  = {
  h264: 0x1b,
  adts: 0x0f
};

/**
 * Reconsistutes program elementary stream (PES) packets from parsed
 * transport stream packets. That is, if you pipe an
 * mp2t.TransportParseStream into a mp2t.ElementaryStream, the output
 * events will be events which capture the bytes for individual PES
 * packets plus relevant metadata that has been extracted from the
 * container.
 */
ElementaryStream = function() {
  var
    self = this,
    // PES packet fragments
    video = {
      data: [],
      size: 0
    },
    audio = {
      data: [],
      size: 0
    },
    timedMetadata = {
      data: [],
      size: 0
    },
    programMapTable,
    parsePes = function(payload, pes) {
      var ptsDtsFlags;

      // get the packet length, this will be 0 for video
      pes.packetLength = 6 + ((payload[4] << 8) | payload[5]);

      // find out if this packets starts a new keyframe
      pes.dataAlignmentIndicator = (payload[6] & 0x04) !== 0;
      // PES packets may be annotated with a PTS value, or a PTS value
      // and a DTS value. Determine what combination of values is
      // available to work with.
      ptsDtsFlags = payload[7];

      // PTS and DTS are normally stored as a 33-bit number.  Javascript
      // performs all bitwise operations on 32-bit integers but javascript
      // supports a much greater range (52-bits) of integer using standard
      // mathematical operations.
      // We construct a 31-bit value using bitwise operators over the 31
      // most significant bits and then multiply by 4 (equal to a left-shift
      // of 2) before we add the final 2 least significant bits of the
      // timestamp (equal to an OR.)
      if (ptsDtsFlags & 0xC0) {
        // the PTS and DTS are not written out directly. For information
        // on how they are encoded, see
        // http://dvd.sourceforge.net/dvdinfo/pes-hdr.html
        pes.pts = (payload[9] & 0x0E) << 27 |
          (payload[10] & 0xFF) << 20 |
          (payload[11] & 0xFE) << 12 |
          (payload[12] & 0xFF) <<  5 |
          (payload[13] & 0xFE) >>>  3;
        pes.pts *= 4; // Left shift by 2
        pes.pts += (payload[13] & 0x06) >>> 1; // OR by the two LSBs
        pes.dts = pes.pts;
        if (ptsDtsFlags & 0x40) {
          pes.dts = (payload[14] & 0x0E) << 27 |
            (payload[15] & 0xFF) << 20 |
            (payload[16] & 0xFE) << 12 |
            (payload[17] & 0xFF) << 5 |
            (payload[18] & 0xFE) >>> 3;
          pes.dts *= 4; // Left shift by 2
          pes.dts += (payload[18] & 0x06) >>> 1; // OR by the two LSBs
        }
      }
      // the data section starts immediately after the PES header.
      // pes_header_data_length specifies the number of header bytes
      // that follow the last byte of the field.
      pes.data = payload.subarray(9 + payload[8]);
    },
    /**
      * Pass completely parsed PES packets to the next stream in the pipeline
     **/
    flushStream = function(stream, type, forceFlush) {
      var
        packetData = new Uint8Array(stream.size),
        event = {
          type: type
        },
        i = 0,
        offset = 0,
        packetFlushable = false,
        fragment;

      // do nothing if there is not enough buffered data for a complete
      // PES header
      if (!stream.data.length || stream.size < 9) {
        return;
      }
      event.trackId = stream.data[0].pid;

      // reassemble the packet
      for (i = 0; i < stream.data.length; i++) {
        fragment = stream.data[i];

        packetData.set(fragment.data, offset);
        offset += fragment.data.byteLength;
      }

      // parse assembled packet's PES header
      parsePes(packetData, event);

      // non-video PES packets MUST have a non-zero PES_packet_length
      // check that there is enough stream data to fill the packet
      packetFlushable = type === 'video' || event.packetLength <= stream.size;

      // flush pending packets if the conditions are right
      if (forceFlush || packetFlushable) {
        stream.size = 0;
        stream.data.length = 0;
      }

      // only emit packets that are complete. this is to avoid assembling
      // incomplete PES packets due to poor segmentation
      if (packetFlushable) {
        self.trigger('data', event);
      }
    };

  ElementaryStream.prototype.init.call(this);

  /**
   * Identifies M2TS packet types and parses PES packets using metadata
   * parsed from the PMT
   **/
  this.push = function(data) {
    ({
      pat: function() {
        // we have to wait for the PMT to arrive as well before we
        // have any meaningful metadata
      },
      pes: function() {
        var stream, streamType;

        switch (data.streamType) {
        case StreamTypes.H264_STREAM_TYPE:
          stream = video;
          streamType = 'video';
          break;
        case StreamTypes.ADTS_STREAM_TYPE:
          stream = audio;
          streamType = 'audio';
          break;
        case StreamTypes.METADATA_STREAM_TYPE:
          stream = timedMetadata;
          streamType = 'timed-metadata';
          break;
        default:
          // ignore unknown stream types
          return;
        }

        // if a new packet is starting, we can flush the completed
        // packet
        if (data.payloadUnitStartIndicator) {
          flushStream(stream, streamType, true);
        }

        // buffer this fragment until we are sure we've received the
        // complete payload
        stream.data.push(data);
        stream.size += data.data.byteLength;
      },
      pmt: function() {
        var
          event = {
            type: 'metadata',
            tracks: []
          };

        programMapTable = data.programMapTable;

        // translate audio and video streams to tracks
        if (programMapTable.video !== null) {
          event.tracks.push({
            timelineStartInfo: {
              baseMediaDecodeTime: 0
            },
            id: +programMapTable.video,
            codec: 'avc',
            type: 'video'
          });
        }
        if (programMapTable.audio !== null) {
          event.tracks.push({
            timelineStartInfo: {
              baseMediaDecodeTime: 0
            },
            id: +programMapTable.audio,
            codec: 'adts',
            type: 'audio'
          });
        }

        self.trigger('data', event);
      }
    })[data.type]();
  };

  this.reset = function() {
    video.size = 0;
    video.data.length = 0;
    audio.size = 0;
    audio.data.length = 0;
    this.trigger('reset');
  };

  /**
   * Flush any remaining input. Video PES packets may be of variable
   * length. Normally, the start of a new video packet can trigger the
   * finalization of the previous packet. That is not possible if no
   * more video is forthcoming, however. In that case, some other
   * mechanism (like the end of the file) has to be employed. When it is
   * clear that no additional data is forthcoming, calling this method
   * will flush the buffered packets.
   */
  this.flushStreams_ = function() {
    // !!THIS ORDER IS IMPORTANT!!
    // video first then audio
    flushStream(video, 'video');
    flushStream(audio, 'audio');
    flushStream(timedMetadata, 'timed-metadata');
  };

  this.flush = function() {
    this.flushStreams_();
    this.trigger('done');
  };
};
ElementaryStream.prototype = new Stream();

var m2ts = {
  PAT_PID: 0x0000,
  MP2T_PACKET_LENGTH: MP2T_PACKET_LENGTH,
  TransportPacketStream: TransportPacketStream,
  TransportParseStream: TransportParseStream,
  ElementaryStream: ElementaryStream,
  TimestampRolloverStream: TimestampRolloverStream,
  CaptionStream: CaptionStream.CaptionStream,
  Cea608Stream: CaptionStream.Cea608Stream,
  MetadataStream: require('./metadata-stream')
};

for (var type in StreamTypes) {
  if (StreamTypes.hasOwnProperty(type)) {
    m2ts[type] = StreamTypes[type];
  }
}

module.exports = m2ts;

},{"../utils/stream.js":50,"./caption-stream":17,"./metadata-stream":20,"./stream-types":22,"./timestamp-rollover-stream":23}],20:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Accepts program elementary stream (PES) data events and parses out
 * ID3 metadata from them, if present.
 * @see http://id3.org/id3v2.3.0
 */
'use strict';
var
  Stream = require('../utils/stream'),
  StreamTypes = require('./stream-types'),
  // return a percent-encoded representation of the specified byte range
  // @see http://en.wikipedia.org/wiki/Percent-encoding
  percentEncode = function(bytes, start, end) {
    var i, result = '';
    for (i = start; i < end; i++) {
      result += '%' + ('00' + bytes[i].toString(16)).slice(-2);
    }
    return result;
  },
  // return the string representation of the specified byte range,
  // interpreted as UTf-8.
  parseUtf8 = function(bytes, start, end) {
    return decodeURIComponent(percentEncode(bytes, start, end));
  },
  // return the string representation of the specified byte range,
  // interpreted as ISO-8859-1.
  parseIso88591 = function(bytes, start, end) {
    return unescape(percentEncode(bytes, start, end)); // jshint ignore:line
  },
  parseSyncSafeInteger = function(data) {
    return (data[0] << 21) |
            (data[1] << 14) |
            (data[2] << 7) |
            (data[3]);
  },
  tagParsers = {
    TXXX: function(tag) {
      var i;
      if (tag.data[0] !== 3) {
        // ignore frames with unrecognized character encodings
        return;
      }

      for (i = 1; i < tag.data.length; i++) {
        if (tag.data[i] === 0) {
          // parse the text fields
          tag.description = parseUtf8(tag.data, 1, i);
          // do not include the null terminator in the tag value
          tag.value = parseUtf8(tag.data, i + 1, tag.data.length).replace(/\0*$/, '');
          break;
        }
      }
      tag.data = tag.value;
    },
    WXXX: function(tag) {
      var i;
      if (tag.data[0] !== 3) {
        // ignore frames with unrecognized character encodings
        return;
      }

      for (i = 1; i < tag.data.length; i++) {
        if (tag.data[i] === 0) {
          // parse the description and URL fields
          tag.description = parseUtf8(tag.data, 1, i);
          tag.url = parseUtf8(tag.data, i + 1, tag.data.length);
          break;
        }
      }
    },
    PRIV: function(tag) {
      var i;

      for (i = 0; i < tag.data.length; i++) {
        if (tag.data[i] === 0) {
          // parse the description and URL fields
          tag.owner = parseIso88591(tag.data, 0, i);
          break;
        }
      }
      tag.privateData = tag.data.subarray(i + 1);
      tag.data = tag.privateData;
    }
  },
  MetadataStream;

MetadataStream = function(options) {
  var
    settings = {
      debug: !!(options && options.debug),

      // the bytes of the program-level descriptor field in MP2T
      // see ISO/IEC 13818-1:2013 (E), section 2.6 "Program and
      // program element descriptors"
      descriptor: options && options.descriptor
    },
    // the total size in bytes of the ID3 tag being parsed
    tagSize = 0,
    // tag data that is not complete enough to be parsed
    buffer = [],
    // the total number of bytes currently in the buffer
    bufferSize = 0,
    i;

  MetadataStream.prototype.init.call(this);

  // calculate the text track in-band metadata track dispatch type
  // https://html.spec.whatwg.org/multipage/embedded-content.html#steps-to-expose-a-media-resource-specific-text-track
  this.dispatchType = StreamTypes.METADATA_STREAM_TYPE.toString(16);
  if (settings.descriptor) {
    for (i = 0; i < settings.descriptor.length; i++) {
      this.dispatchType += ('00' + settings.descriptor[i].toString(16)).slice(-2);
    }
  }

  this.push = function(chunk) {
    var tag, frameStart, frameSize, frame, i, frameHeader;
    if (chunk.type !== 'timed-metadata') {
      return;
    }

    // if data_alignment_indicator is set in the PES header,
    // we must have the start of a new ID3 tag. Assume anything
    // remaining in the buffer was malformed and throw it out
    if (chunk.dataAlignmentIndicator) {
      bufferSize = 0;
      buffer.length = 0;
    }

    // ignore events that don't look like ID3 data
    if (buffer.length === 0 &&
        (chunk.data.length < 10 ||
          chunk.data[0] !== 'I'.charCodeAt(0) ||
          chunk.data[1] !== 'D'.charCodeAt(0) ||
          chunk.data[2] !== '3'.charCodeAt(0))) {
      if (settings.debug) {
        // eslint-disable-next-line no-console
        console.log('Skipping unrecognized metadata packet');
      }
      return;
    }

    // add this chunk to the data we've collected so far

    buffer.push(chunk);
    bufferSize += chunk.data.byteLength;

    // grab the size of the entire frame from the ID3 header
    if (buffer.length === 1) {
      // the frame size is transmitted as a 28-bit integer in the
      // last four bytes of the ID3 header.
      // The most significant bit of each byte is dropped and the
      // results concatenated to recover the actual value.
      tagSize = parseSyncSafeInteger(chunk.data.subarray(6, 10));

      // ID3 reports the tag size excluding the header but it's more
      // convenient for our comparisons to include it
      tagSize += 10;
    }

    // if the entire frame has not arrived, wait for more data
    if (bufferSize < tagSize) {
      return;
    }

    // collect the entire frame so it can be parsed
    tag = {
      data: new Uint8Array(tagSize),
      frames: [],
      pts: buffer[0].pts,
      dts: buffer[0].dts
    };
    for (i = 0; i < tagSize;) {
      tag.data.set(buffer[0].data.subarray(0, tagSize - i), i);
      i += buffer[0].data.byteLength;
      bufferSize -= buffer[0].data.byteLength;
      buffer.shift();
    }

    // find the start of the first frame and the end of the tag
    frameStart = 10;
    if (tag.data[5] & 0x40) {
      // advance the frame start past the extended header
      frameStart += 4; // header size field
      frameStart += parseSyncSafeInteger(tag.data.subarray(10, 14));

      // clip any padding off the end
      tagSize -= parseSyncSafeInteger(tag.data.subarray(16, 20));
    }

    // parse one or more ID3 frames
    // http://id3.org/id3v2.3.0#ID3v2_frame_overview
    do {
      // determine the number of bytes in this frame
      frameSize = parseSyncSafeInteger(tag.data.subarray(frameStart + 4, frameStart + 8));
      if (frameSize < 1) {
         // eslint-disable-next-line no-console
        return console.log('Malformed ID3 frame encountered. Skipping metadata parsing.');
      }
      frameHeader = String.fromCharCode(tag.data[frameStart],
                                        tag.data[frameStart + 1],
                                        tag.data[frameStart + 2],
                                        tag.data[frameStart + 3]);


      frame = {
        id: frameHeader,
        data: tag.data.subarray(frameStart + 10, frameStart + frameSize + 10)
      };
      frame.key = frame.id;
      if (tagParsers[frame.id]) {
        tagParsers[frame.id](frame);

        // handle the special PRIV frame used to indicate the start
        // time for raw AAC data
        if (frame.owner === 'com.apple.streaming.transportStreamTimestamp') {
          var
            d = frame.data,
            size = ((d[3] & 0x01)  << 30) |
                   (d[4]  << 22) |
                   (d[5] << 14) |
                   (d[6] << 6) |
                   (d[7] >>> 2);

          size *= 4;
          size += d[7] & 0x03;
          frame.timeStamp = size;
          // in raw AAC, all subsequent data will be timestamped based
          // on the value of this frame
          // we couldn't have known the appropriate pts and dts before
          // parsing this ID3 tag so set those values now
          if (tag.pts === undefined && tag.dts === undefined) {
            tag.pts = frame.timeStamp;
            tag.dts = frame.timeStamp;
          }
          this.trigger('timestamp', frame);
        }
      }
      tag.frames.push(frame);

      frameStart += 10; // advance past the frame header
      frameStart += frameSize; // advance past the frame body
    } while (frameStart < tagSize);
    this.trigger('data', tag);
  };
};
MetadataStream.prototype = new Stream();

module.exports = MetadataStream;

},{"../utils/stream":50,"./stream-types":22}],21:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Utilities to detect basic properties and metadata about TS Segments.
 */
'use strict';

var StreamTypes = require('./stream-types.js');

var parsePid = function(packet) {
  var pid = packet[1] & 0x1f;
  pid <<= 8;
  pid |= packet[2];
  return pid;
};

var parsePayloadUnitStartIndicator = function(packet) {
  return !!(packet[1] & 0x40);
};

var parseAdaptionField = function(packet) {
  var offset = 0;
  // if an adaption field is present, its length is specified by the
  // fifth byte of the TS packet header. The adaptation field is
  // used to add stuffing to PES packets that don't fill a complete
  // TS packet, and to specify some forms of timing and control data
  // that we do not currently use.
  if (((packet[3] & 0x30) >>> 4) > 0x01) {
    offset += packet[4] + 1;
  }
  return offset;
};

var parseType = function(packet, pmtPid) {
  var pid = parsePid(packet);
  if (pid === 0) {
    return 'pat';
  } else if (pid === pmtPid) {
    return 'pmt';
  } else if (pmtPid) {
    return 'pes';
  }
  return null;
};

var parsePat = function(packet) {
  var pusi = parsePayloadUnitStartIndicator(packet);
  var offset = 4 + parseAdaptionField(packet);

  if (pusi) {
    offset += packet[offset] + 1;
  }

  return (packet[offset + 10] & 0x1f) << 8 | packet[offset + 11];
};

var parsePmt = function(packet) {
  var programMapTable = {};
  var pusi = parsePayloadUnitStartIndicator(packet);
  var payloadOffset = 4 + parseAdaptionField(packet);

  if (pusi) {
    payloadOffset += packet[payloadOffset] + 1;
  }

  // PMTs can be sent ahead of the time when they should actually
  // take effect. We don't believe this should ever be the case
  // for HLS but we'll ignore "forward" PMT declarations if we see
  // them. Future PMT declarations have the current_next_indicator
  // set to zero.
  if (!(packet[payloadOffset + 5] & 0x01)) {
    return;
  }

  var sectionLength, tableEnd, programInfoLength;
  // the mapping table ends at the end of the current section
  sectionLength = (packet[payloadOffset + 1] & 0x0f) << 8 | packet[payloadOffset + 2];
  tableEnd = 3 + sectionLength - 4;

  // to determine where the table is, we have to figure out how
  // long the program info descriptors are
  programInfoLength = (packet[payloadOffset + 10] & 0x0f) << 8 | packet[payloadOffset + 11];

  // advance the offset to the first entry in the mapping table
  var offset = 12 + programInfoLength;
  while (offset < tableEnd) {
    var i = payloadOffset + offset;
    // add an entry that maps the elementary_pid to the stream_type
    programMapTable[(packet[i + 1] & 0x1F) << 8 | packet[i + 2]] = packet[i];

    // move to the next table entry
    // skip past the elementary stream descriptors, if present
    offset += ((packet[i + 3] & 0x0F) << 8 | packet[i + 4]) + 5;
  }
  return programMapTable;
};

var parsePesType = function(packet, programMapTable) {
  var pid = parsePid(packet);
  var type = programMapTable[pid];
  switch (type) {
    case StreamTypes.H264_STREAM_TYPE:
      return 'video';
    case StreamTypes.ADTS_STREAM_TYPE:
      return 'audio';
    case StreamTypes.METADATA_STREAM_TYPE:
      return 'timed-metadata';
    default:
      return null;
  }
};

var parsePesTime = function(packet) {
  var pusi = parsePayloadUnitStartIndicator(packet);
  if (!pusi) {
    return null;
  }

  var offset = 4 + parseAdaptionField(packet);

  if (offset >= packet.byteLength) {
    // From the H 222.0 MPEG-TS spec
    // "For transport stream packets carrying PES packets, stuffing is needed when there
    //  is insufficient PES packet data to completely fill the transport stream packet
    //  payload bytes. Stuffing is accomplished by defining an adaptation field longer than
    //  the sum of the lengths of the data elements in it, so that the payload bytes
    //  remaining after the adaptation field exactly accommodates the available PES packet
    //  data."
    //
    // If the offset is >= the length of the packet, then the packet contains no data
    // and instead is just adaption field stuffing bytes
    return null;
  }

  var pes = null;
  var ptsDtsFlags;

  // PES packets may be annotated with a PTS value, or a PTS value
  // and a DTS value. Determine what combination of values is
  // available to work with.
  ptsDtsFlags = packet[offset + 7];

  // PTS and DTS are normally stored as a 33-bit number.  Javascript
  // performs all bitwise operations on 32-bit integers but javascript
  // supports a much greater range (52-bits) of integer using standard
  // mathematical operations.
  // We construct a 31-bit value using bitwise operators over the 31
  // most significant bits and then multiply by 4 (equal to a left-shift
  // of 2) before we add the final 2 least significant bits of the
  // timestamp (equal to an OR.)
  if (ptsDtsFlags & 0xC0) {
    pes = {};
    // the PTS and DTS are not written out directly. For information
    // on how they are encoded, see
    // http://dvd.sourceforge.net/dvdinfo/pes-hdr.html
    pes.pts = (packet[offset + 9] & 0x0E) << 27 |
      (packet[offset + 10] & 0xFF) << 20 |
      (packet[offset + 11] & 0xFE) << 12 |
      (packet[offset + 12] & 0xFF) <<  5 |
      (packet[offset + 13] & 0xFE) >>>  3;
    pes.pts *= 4; // Left shift by 2
    pes.pts += (packet[offset + 13] & 0x06) >>> 1; // OR by the two LSBs
    pes.dts = pes.pts;
    if (ptsDtsFlags & 0x40) {
      pes.dts = (packet[offset + 14] & 0x0E) << 27 |
        (packet[offset + 15] & 0xFF) << 20 |
        (packet[offset + 16] & 0xFE) << 12 |
        (packet[offset + 17] & 0xFF) << 5 |
        (packet[offset + 18] & 0xFE) >>> 3;
      pes.dts *= 4; // Left shift by 2
      pes.dts += (packet[offset + 18] & 0x06) >>> 1; // OR by the two LSBs
    }
  }
  return pes;
};

var parseNalUnitType = function(type) {
  switch (type) {
    case 0x05:
      return 'slice_layer_without_partitioning_rbsp_idr';
    case 0x06:
      return 'sei_rbsp';
    case 0x07:
      return 'seq_parameter_set_rbsp';
    case 0x08:
      return 'pic_parameter_set_rbsp';
    case 0x09:
      return 'access_unit_delimiter_rbsp';
    default:
      return null;
  }
};

var videoPacketContainsKeyFrame = function(packet) {
  var offset = 4 + parseAdaptionField(packet);
  var frameBuffer = packet.subarray(offset);
  var frameI = 0;
  var frameSyncPoint = 0;
  var foundKeyFrame = false;
  var nalType;

  // advance the sync point to a NAL start, if necessary
  for (; frameSyncPoint < frameBuffer.byteLength - 3; frameSyncPoint++) {
    if (frameBuffer[frameSyncPoint + 2] === 1) {
      // the sync point is properly aligned
      frameI = frameSyncPoint + 5;
      break;
    }
  }

  while (frameI < frameBuffer.byteLength) {
    // look at the current byte to determine if we've hit the end of
    // a NAL unit boundary
    switch (frameBuffer[frameI]) {
    case 0:
      // skip past non-sync sequences
      if (frameBuffer[frameI - 1] !== 0) {
        frameI += 2;
        break;
      } else if (frameBuffer[frameI - 2] !== 0) {
        frameI++;
        break;
      }

      if (frameSyncPoint + 3 !== frameI - 2) {
        nalType = parseNalUnitType(frameBuffer[frameSyncPoint + 3] & 0x1f);
        if (nalType === 'slice_layer_without_partitioning_rbsp_idr') {
          foundKeyFrame = true;
        }
      }

      // drop trailing zeroes
      do {
        frameI++;
      } while (frameBuffer[frameI] !== 1 && frameI < frameBuffer.length);
      frameSyncPoint = frameI - 2;
      frameI += 3;
      break;
    case 1:
      // skip past non-sync sequences
      if (frameBuffer[frameI - 1] !== 0 ||
          frameBuffer[frameI - 2] !== 0) {
        frameI += 3;
        break;
      }

      nalType = parseNalUnitType(frameBuffer[frameSyncPoint + 3] & 0x1f);
      if (nalType === 'slice_layer_without_partitioning_rbsp_idr') {
        foundKeyFrame = true;
      }
      frameSyncPoint = frameI - 2;
      frameI += 3;
      break;
    default:
      // the current byte isn't a one or zero, so it cannot be part
      // of a sync sequence
      frameI += 3;
      break;
    }
  }
  frameBuffer = frameBuffer.subarray(frameSyncPoint);
  frameI -= frameSyncPoint;
  frameSyncPoint = 0;
  // parse the final nal
  if (frameBuffer && frameBuffer.byteLength > 3) {
    nalType = parseNalUnitType(frameBuffer[frameSyncPoint + 3] & 0x1f);
    if (nalType === 'slice_layer_without_partitioning_rbsp_idr') {
      foundKeyFrame = true;
    }
  }

  return foundKeyFrame;
};


module.exports = {
  parseType: parseType,
  parsePat: parsePat,
  parsePmt: parsePmt,
  parsePayloadUnitStartIndicator: parsePayloadUnitStartIndicator,
  parsePesType: parsePesType,
  parsePesTime: parsePesTime,
  videoPacketContainsKeyFrame: videoPacketContainsKeyFrame
};

},{"./stream-types.js":22}],22:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

module.exports = {
  H264_STREAM_TYPE: 0x1B,
  ADTS_STREAM_TYPE: 0x0F,
  METADATA_STREAM_TYPE: 0x15
};

},{}],23:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Accepts program elementary stream (PES) data events and corrects
 * decode and presentation time stamps to account for a rollover
 * of the 33 bit value.
 */

'use strict';

var Stream = require('../utils/stream');

var MAX_TS = 8589934592;

var RO_THRESH = 4294967296;

var TYPE_SHARED = 'shared';

var handleRollover = function(value, reference) {
  var direction = 1;

  if (value > reference) {
    // If the current timestamp value is greater than our reference timestamp and we detect a
    // timestamp rollover, this means the roll over is happening in the opposite direction.
    // Example scenario: Enter a long stream/video just after a rollover occurred. The reference
    // point will be set to a small number, e.g. 1. The user then seeks backwards over the
    // rollover point. In loading this segment, the timestamp values will be very large,
    // e.g. 2^33 - 1. Since this comes before the data we loaded previously, we want to adjust
    // the time stamp to be `value - 2^33`.
    direction = -1;
  }

  // Note: A seek forwards or back that is greater than the RO_THRESH (2^32, ~13 hours) will
  // cause an incorrect adjustment.
  while (Math.abs(reference - value) > RO_THRESH) {
    value += (direction * MAX_TS);
  }

  return value;
};

var TimestampRolloverStream = function(type) {
  var lastDTS, referenceDTS;

  TimestampRolloverStream.prototype.init.call(this);

  // The "shared" type is used in cases where a stream will contain muxed
  // video and audio. We could use `undefined` here, but having a string
  // makes debugging a little clearer.
  this.type_ = type || TYPE_SHARED;

  this.push = function(data) {

    // Any "shared" rollover streams will accept _all_ data. Otherwise,
    // streams will only accept data that matches their type.
    if (this.type_ !== TYPE_SHARED && data.type !== this.type_) {
      return;
    }

    if (referenceDTS === undefined) {
      referenceDTS = data.dts;
    }

    data.dts = handleRollover(data.dts, referenceDTS);
    data.pts = handleRollover(data.pts, referenceDTS);

    lastDTS = data.dts;

    this.trigger('data', data);
  };

  this.flush = function() {
    referenceDTS = lastDTS;
    this.trigger('done');
  };

  this.endTimeline = function() {
    this.flush();
    this.trigger('endedtimeline');
  };

  this.discontinuity = function() {
    referenceDTS = void 0;
    lastDTS = void 0;
  };

  this.reset = function() {
    this.discontinuity();
    this.trigger('reset');
  };
};

TimestampRolloverStream.prototype = new Stream();

module.exports = {
  TimestampRolloverStream: TimestampRolloverStream,
  handleRollover: handleRollover
};

},{"../utils/stream":50}],24:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
var coneOfSilence = require('../data/silence');
var clock = require('../utils/clock');

/**
 * Sum the `byteLength` properties of the data in each AAC frame
 */
var sumFrameByteLengths = function(array) {
  var
    i,
    currentObj,
    sum = 0;

  // sum the byteLength's all each nal unit in the frame
  for (i = 0; i < array.length; i++) {
    currentObj = array[i];
    sum += currentObj.data.byteLength;
  }

  return sum;
};

// Possibly pad (prefix) the audio track with silence if appending this track
// would lead to the introduction of a gap in the audio buffer
var prefixWithSilence = function(
  track,
  frames,
  audioAppendStartTs,
  videoBaseMediaDecodeTime
) {
  var
    baseMediaDecodeTimeTs,
    frameDuration = 0,
    audioGapDuration = 0,
    audioFillFrameCount = 0,
    audioFillDuration = 0,
    silentFrame,
    i,
    firstFrame;

  if (!frames.length) {
    return;
  }

  baseMediaDecodeTimeTs =
    clock.audioTsToVideoTs(track.baseMediaDecodeTime, track.samplerate);
  // determine frame clock duration based on sample rate, round up to avoid overfills
  frameDuration = Math.ceil(clock.ONE_SECOND_IN_TS / (track.samplerate / 1024));

  if (audioAppendStartTs && videoBaseMediaDecodeTime) {
    // insert the shortest possible amount (audio gap or audio to video gap)
    audioGapDuration =
      baseMediaDecodeTimeTs - Math.max(audioAppendStartTs, videoBaseMediaDecodeTime);
    // number of full frames in the audio gap
    audioFillFrameCount = Math.floor(audioGapDuration / frameDuration);
    audioFillDuration = audioFillFrameCount * frameDuration;
  }

  // don't attempt to fill gaps smaller than a single frame or larger
  // than a half second
  if (audioFillFrameCount < 1 || audioFillDuration > clock.ONE_SECOND_IN_TS / 2) {
    return;
  }

  silentFrame = coneOfSilence()[track.samplerate];

  if (!silentFrame) {
    // we don't have a silent frame pregenerated for the sample rate, so use a frame
    // from the content instead
    silentFrame = frames[0].data;
  }

  for (i = 0; i < audioFillFrameCount; i++) {
    firstFrame = frames[0];

    frames.splice(0, 0, {
      data: silentFrame,
      dts: firstFrame.dts - frameDuration,
      pts: firstFrame.pts - frameDuration
    });
  }

  track.baseMediaDecodeTime -=
    Math.floor(clock.videoTsToAudioTs(audioFillDuration, track.samplerate));
};

// If the audio segment extends before the earliest allowed dts
// value, remove AAC frames until starts at or after the earliest
// allowed DTS so that we don't end up with a negative baseMedia-
// DecodeTime for the audio track
var trimAdtsFramesByEarliestDts = function(adtsFrames, track, earliestAllowedDts) {
  if (track.minSegmentDts >= earliestAllowedDts) {
    return adtsFrames;
  }

  // We will need to recalculate the earliest segment Dts
  track.minSegmentDts = Infinity;

  return adtsFrames.filter(function(currentFrame) {
    // If this is an allowed frame, keep it and record it's Dts
    if (currentFrame.dts >= earliestAllowedDts) {
      track.minSegmentDts = Math.min(track.minSegmentDts, currentFrame.dts);
      track.minSegmentPts = track.minSegmentDts;
      return true;
    }
    // Otherwise, discard it
    return false;
  });
};

// generate the track's raw mdat data from an array of frames
var generateSampleTable = function(frames) {
  var
    i,
    currentFrame,
    samples = [];

  for (i = 0; i < frames.length; i++) {
    currentFrame = frames[i];
    samples.push({
      size: currentFrame.data.byteLength,
      duration: 1024 // For AAC audio, all samples contain 1024 samples
    });
  }
  return samples;
};

// generate the track's sample table from an array of frames
var concatenateFrameData = function(frames) {
  var
    i,
    currentFrame,
    dataOffset = 0,
    data = new Uint8Array(sumFrameByteLengths(frames));

  for (i = 0; i < frames.length; i++) {
    currentFrame = frames[i];

    data.set(currentFrame.data, dataOffset);
    dataOffset += currentFrame.data.byteLength;
  }
  return data;
};

module.exports = {
  prefixWithSilence: prefixWithSilence,
  trimAdtsFramesByEarliestDts: trimAdtsFramesByEarliestDts,
  generateSampleTable: generateSampleTable,
  concatenateFrameData: concatenateFrameData
};

},{"../data/silence":9,"../utils/clock":48}],25:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Reads in-band CEA-708 captions out of FMP4 segments.
 * @see https://en.wikipedia.org/wiki/CEA-708
 */
'use strict';

var discardEmulationPreventionBytes = require('../tools/caption-packet-parser').discardEmulationPreventionBytes;
var CaptionStream = require('../m2ts/caption-stream').CaptionStream;
var findBox = require('../mp4/find-box.js');
var parseTfdt = require('../tools/parse-tfdt.js');
var parseTrun = require('../tools/parse-trun.js');
var parseTfhd = require('../tools/parse-tfhd.js');

/**
  * Maps an offset in the mdat to a sample based on the the size of the samples.
  * Assumes that `parseSamples` has been called first.
  *
  * @param {Number} offset - The offset into the mdat
  * @param {Object[]} samples - An array of samples, parsed using `parseSamples`
  * @return {?Object} The matching sample, or null if no match was found.
  *
  * @see ISO-BMFF-12/2015, Section 8.8.8
 **/
var mapToSample = function(offset, samples) {
  var approximateOffset = offset;

  for (var i = 0; i < samples.length; i++) {
    var sample = samples[i];

    if (approximateOffset < sample.size) {
      return sample;
    }

    approximateOffset -= sample.size;
  }

  return null;
};

/**
  * Finds SEI nal units contained in a Media Data Box.
  * Assumes that `parseSamples` has been called first.
  *
  * @param {Uint8Array} avcStream - The bytes of the mdat
  * @param {Object[]} samples - The samples parsed out by `parseSamples`
  * @param {Number} trackId - The trackId of this video track
  * @return {Object[]} seiNals - the parsed SEI NALUs found.
  *   The contents of the seiNal should match what is expected by
  *   CaptionStream.push (nalUnitType, size, data, escapedRBSP, pts, dts)
  *
  * @see ISO-BMFF-12/2015, Section 8.1.1
  * @see Rec. ITU-T H.264, 7.3.2.3.1
 **/
var findSeiNals = function(avcStream, samples, trackId) {
  var
    avcView = new DataView(avcStream.buffer, avcStream.byteOffset, avcStream.byteLength),
    result = [],
    seiNal,
    i,
    length,
    lastMatchedSample;

  for (i = 0; i + 4 < avcStream.length; i += length) {
    length = avcView.getUint32(i);
    i += 4;

    // Bail if this doesn't appear to be an H264 stream
    if (length <= 0) {
      continue;
    }

    switch (avcStream[i] & 0x1F) {
    case 0x06:
      var data = avcStream.subarray(i + 1, i + 1 + length);
      var matchingSample = mapToSample(i, samples);

      seiNal = {
        nalUnitType: 'sei_rbsp',
        size: length,
        data: data,
        escapedRBSP: discardEmulationPreventionBytes(data),
        trackId: trackId
      };

      if (matchingSample) {
        seiNal.pts = matchingSample.pts;
        seiNal.dts = matchingSample.dts;
        lastMatchedSample = matchingSample;
      } else if (lastMatchedSample) {
        // If a matching sample cannot be found, use the last
        // sample's values as they should be as close as possible
        seiNal.pts = lastMatchedSample.pts;
        seiNal.dts = lastMatchedSample.dts;
      } else {
        // eslint-disable-next-line no-console
        console.log("We've encountered a nal unit without data. See mux.js#233.");
        break;
      }

      result.push(seiNal);
      break;
    default:
      break;
    }
  }

  return result;
};

/**
  * Parses sample information out of Track Run Boxes and calculates
  * the absolute presentation and decode timestamps of each sample.
  *
  * @param {Array<Uint8Array>} truns - The Trun Run boxes to be parsed
  * @param {Number} baseMediaDecodeTime - base media decode time from tfdt
      @see ISO-BMFF-12/2015, Section 8.8.12
  * @param {Object} tfhd - The parsed Track Fragment Header
  *   @see inspect.parseTfhd
  * @return {Object[]} the parsed samples
  *
  * @see ISO-BMFF-12/2015, Section 8.8.8
 **/
var parseSamples = function(truns, baseMediaDecodeTime, tfhd) {
  var currentDts = baseMediaDecodeTime;
  var defaultSampleDuration = tfhd.defaultSampleDuration || 0;
  var defaultSampleSize = tfhd.defaultSampleSize || 0;
  var trackId = tfhd.trackId;
  var allSamples = [];

  truns.forEach(function(trun) {
    // Note: We currently do not parse the sample table as well
    // as the trun. It's possible some sources will require this.
    // moov > trak > mdia > minf > stbl
    var trackRun = parseTrun(trun);
    var samples = trackRun.samples;

    samples.forEach(function(sample) {
      if (sample.duration === undefined) {
        sample.duration = defaultSampleDuration;
      }
      if (sample.size === undefined) {
        sample.size = defaultSampleSize;
      }
      sample.trackId = trackId;
      sample.dts = currentDts;
      if (sample.compositionTimeOffset === undefined) {
        sample.compositionTimeOffset = 0;
      }
      sample.pts = currentDts + sample.compositionTimeOffset;

      currentDts += sample.duration;
    });

    allSamples = allSamples.concat(samples);
  });

  return allSamples;
};

/**
  * Parses out caption nals from an FMP4 segment's video tracks.
  *
  * @param {Uint8Array} segment - The bytes of a single segment
  * @param {Number} videoTrackId - The trackId of a video track in the segment
  * @return {Object.<Number, Object[]>} A mapping of video trackId to
  *   a list of seiNals found in that track
 **/
var parseCaptionNals = function(segment, videoTrackId) {
  // To get the samples
  var trafs = findBox(segment, ['moof', 'traf']);
  // To get SEI NAL units
  var mdats = findBox(segment, ['mdat']);
  var captionNals = {};
  var mdatTrafPairs = [];

  // Pair up each traf with a mdat as moofs and mdats are in pairs
  mdats.forEach(function(mdat, index) {
    var matchingTraf = trafs[index];
    mdatTrafPairs.push({
      mdat: mdat,
      traf: matchingTraf
    });
  });

  mdatTrafPairs.forEach(function(pair) {
    var mdat = pair.mdat;
    var traf = pair.traf;
    var tfhd = findBox(traf, ['tfhd']);
    // Exactly 1 tfhd per traf
    var headerInfo = parseTfhd(tfhd[0]);
    var trackId = headerInfo.trackId;
    var tfdt = findBox(traf, ['tfdt']);
    // Either 0 or 1 tfdt per traf
    var baseMediaDecodeTime = (tfdt.length > 0) ? parseTfdt(tfdt[0]).baseMediaDecodeTime : 0;
    var truns = findBox(traf, ['trun']);
    var samples;
    var seiNals;

    // Only parse video data for the chosen video track
    if (videoTrackId === trackId && truns.length > 0) {
      samples = parseSamples(truns, baseMediaDecodeTime, headerInfo);

      seiNals = findSeiNals(mdat, samples, trackId);

      if (!captionNals[trackId]) {
        captionNals[trackId] = [];
      }

      captionNals[trackId] = captionNals[trackId].concat(seiNals);
    }
  });

  return captionNals;
};

/**
  * Parses out inband captions from an MP4 container and returns
  * caption objects that can be used by WebVTT and the TextTrack API.
  * @see https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
  * @see https://developer.mozilla.org/en-US/docs/Web/API/TextTrack
  * Assumes that `probe.getVideoTrackIds` and `probe.timescale` have been called first
  *
  * @param {Uint8Array} segment - The fmp4 segment containing embedded captions
  * @param {Number} trackId - The id of the video track to parse
  * @param {Number} timescale - The timescale for the video track from the init segment
  *
  * @return {?Object[]} parsedCaptions - A list of captions or null if no video tracks
  * @return {Number} parsedCaptions[].startTime - The time to show the caption in seconds
  * @return {Number} parsedCaptions[].endTime - The time to stop showing the caption in seconds
  * @return {String} parsedCaptions[].text - The visible content of the caption
 **/
var parseEmbeddedCaptions = function(segment, trackId, timescale) {
  var seiNals;

  // the ISO-BMFF spec says that trackId can't be zero, but there's some broken content out there
  if (trackId === null) {
    return null;
  }

  seiNals = parseCaptionNals(segment, trackId);

  return {
    seiNals: seiNals[trackId],
    timescale: timescale
  };
};

/**
  * Converts SEI NALUs into captions that can be used by video.js
 **/
var CaptionParser = function() {
  var isInitialized = false;
  var captionStream;

  // Stores segments seen before trackId and timescale are set
  var segmentCache;
  // Stores video track ID of the track being parsed
  var trackId;
  // Stores the timescale of the track being parsed
  var timescale;
  // Stores captions parsed so far
  var parsedCaptions;
  // Stores whether we are receiving partial data or not
  var parsingPartial;

  /**
    * A method to indicate whether a CaptionParser has been initalized
    * @returns {Boolean}
   **/
  this.isInitialized = function() {
    return isInitialized;
  };

  /**
    * Initializes the underlying CaptionStream, SEI NAL parsing
    * and management, and caption collection
   **/
  this.init = function(options) {
    captionStream = new CaptionStream();
    isInitialized = true;
    parsingPartial = options ? options.isPartial : false;

    // Collect dispatched captions
    captionStream.on('data', function(event) {
      // Convert to seconds in the source's timescale
      event.startTime = event.startPts / timescale;
      event.endTime = event.endPts / timescale;

      parsedCaptions.captions.push(event);
      parsedCaptions.captionStreams[event.stream] = true;
    });
  };

  /**
    * Determines if a new video track will be selected
    * or if the timescale changed
    * @return {Boolean}
   **/
  this.isNewInit = function(videoTrackIds, timescales) {
    if ((videoTrackIds && videoTrackIds.length === 0) ||
        (timescales && typeof timescales === 'object' &&
          Object.keys(timescales).length === 0)) {
      return false;
    }

    return trackId !== videoTrackIds[0] ||
      timescale !== timescales[trackId];
  };

  /**
    * Parses out SEI captions and interacts with underlying
    * CaptionStream to return dispatched captions
    *
    * @param {Uint8Array} segment - The fmp4 segment containing embedded captions
    * @param {Number[]} videoTrackIds - A list of video tracks found in the init segment
    * @param {Object.<Number, Number>} timescales - The timescales found in the init segment
    * @see parseEmbeddedCaptions
    * @see m2ts/caption-stream.js
   **/
  this.parse = function(segment, videoTrackIds, timescales) {
    var parsedData;

    if (!this.isInitialized()) {
      return null;

    // This is not likely to be a video segment
    } else if (!videoTrackIds || !timescales) {
      return null;

    } else if (this.isNewInit(videoTrackIds, timescales)) {
      // Use the first video track only as there is no
      // mechanism to switch to other video tracks
      trackId = videoTrackIds[0];
      timescale = timescales[trackId];

    // If an init segment has not been seen yet, hold onto segment
    // data until we have one.
    // the ISO-BMFF spec says that trackId can't be zero, but there's some broken content out there
    } else if (trackId === null || !timescale) {
      segmentCache.push(segment);
      return null;
    }

    // Now that a timescale and trackId is set, parse cached segments
    while (segmentCache.length > 0) {
      var cachedSegment = segmentCache.shift();

      this.parse(cachedSegment, videoTrackIds, timescales);
    }

    parsedData = parseEmbeddedCaptions(segment, trackId, timescale);

    if (parsedData === null || !parsedData.seiNals) {
      return null;
    }

    this.pushNals(parsedData.seiNals);
    // Force the parsed captions to be dispatched
    this.flushStream();

    return parsedCaptions;
  };

  /**
    * Pushes SEI NALUs onto CaptionStream
    * @param {Object[]} nals - A list of SEI nals parsed using `parseCaptionNals`
    * Assumes that `parseCaptionNals` has been called first
    * @see m2ts/caption-stream.js
    **/
  this.pushNals = function(nals) {
    if (!this.isInitialized() || !nals || nals.length === 0) {
      return null;
    }

    nals.forEach(function(nal) {
      captionStream.push(nal);
    });
  };

  /**
    * Flushes underlying CaptionStream to dispatch processed, displayable captions
    * @see m2ts/caption-stream.js
   **/
  this.flushStream = function() {
    if (!this.isInitialized()) {
      return null;
    }

    if (!parsingPartial) {
      captionStream.flush();
    } else {
      captionStream.partialFlush();
    }
  };

  /**
    * Reset caption buckets for new data
   **/
  this.clearParsedCaptions = function() {
    parsedCaptions.captions = [];
    parsedCaptions.captionStreams = {};
  };

  /**
    * Resets underlying CaptionStream
    * @see m2ts/caption-stream.js
   **/
  this.resetCaptionStream = function() {
    if (!this.isInitialized()) {
      return null;
    }

    captionStream.reset();
  };

  /**
    * Convenience method to clear all captions flushed from the
    * CaptionStream and still being parsed
    * @see m2ts/caption-stream.js
   **/
  this.clearAllCaptions = function() {
    this.clearParsedCaptions();
    this.resetCaptionStream();
  };

  /**
    * Reset caption parser
   **/
  this.reset = function() {
    segmentCache = [];
    trackId = null;
    timescale = null;

    if (!parsedCaptions) {
      parsedCaptions = {
        captions: [],
        // CC1, CC2, CC3, CC4
        captionStreams: {}
      };
    } else {
      this.clearParsedCaptions();
    }

    this.resetCaptionStream();
  };

  this.reset();
};

module.exports = CaptionParser;

},{"../m2ts/caption-stream":17,"../mp4/find-box.js":26,"../tools/caption-packet-parser":38,"../tools/parse-tfdt.js":43,"../tools/parse-tfhd.js":44,"../tools/parse-trun.js":45}],26:[function(require,module,exports){
var toUnsigned = require('../utils/bin').toUnsigned;
var parseType = require('./parse-type.js');

var findBox = function(data, path) {
  var results = [],
    i, size, type, end, subresults;

  if (!path.length) {
    // short-circuit the search for empty paths
    return null;
  }

  for (i = 0; i < data.byteLength;) {
    size = toUnsigned(data[i]     << 24 |
      data[i + 1] << 16 |
      data[i + 2] <<  8 |
      data[i + 3]);

    type = parseType(data.subarray(i + 4, i + 8));

    end = size > 1 ? i + size : data.byteLength;

    if (type === path[0]) {
      if (path.length === 1) {
        // this is the end of the path and we've found the box we were
        // looking for
        results.push(data.subarray(i + 8, end));
      } else {
        // recursively search for the next box along the path
        subresults = findBox(data.subarray(i + 8, end), path.slice(1));
        if (subresults.length) {
          results = results.concat(subresults);
        }
      }
    }
    i = end;
  }

  // we've finished searching all of data
  return results;
};

module.exports = findBox;


},{"../utils/bin":47,"./parse-type.js":30}],27:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
// Convert an array of nal units into an array of frames with each frame being
// composed of the nal units that make up that frame
// Also keep track of cummulative data about the frame from the nal units such
// as the frame duration, starting pts, etc.
var groupNalsIntoFrames = function(nalUnits) {
  var
    i,
    currentNal,
    currentFrame = [],
    frames = [];

  // TODO added for LHLS, make sure this is OK
  frames.byteLength = 0;
  frames.nalCount = 0;
  frames.duration = 0;

  currentFrame.byteLength = 0;

  for (i = 0; i < nalUnits.length; i++) {
    currentNal = nalUnits[i];

    // Split on 'aud'-type nal units
    if (currentNal.nalUnitType === 'access_unit_delimiter_rbsp') {
      // Since the very first nal unit is expected to be an AUD
      // only push to the frames array when currentFrame is not empty
      if (currentFrame.length) {
        currentFrame.duration = currentNal.dts - currentFrame.dts;
        // TODO added for LHLS, make sure this is OK
        frames.byteLength += currentFrame.byteLength;
        frames.nalCount += currentFrame.length;
        frames.duration += currentFrame.duration;
        frames.push(currentFrame);
      }
      currentFrame = [currentNal];
      currentFrame.byteLength = currentNal.data.byteLength;
      currentFrame.pts = currentNal.pts;
      currentFrame.dts = currentNal.dts;
    } else {
      // Specifically flag key frames for ease of use later
      if (currentNal.nalUnitType === 'slice_layer_without_partitioning_rbsp_idr') {
        currentFrame.keyFrame = true;
      }
      currentFrame.duration = currentNal.dts - currentFrame.dts;
      currentFrame.byteLength += currentNal.data.byteLength;
      currentFrame.push(currentNal);
    }
  }

  // For the last frame, use the duration of the previous frame if we
  // have nothing better to go on
  if (frames.length &&
      (!currentFrame.duration ||
       currentFrame.duration <= 0)) {
    currentFrame.duration = frames[frames.length - 1].duration;
  }

  // Push the final frame
  // TODO added for LHLS, make sure this is OK
  frames.byteLength += currentFrame.byteLength;
  frames.nalCount += currentFrame.length;
  frames.duration += currentFrame.duration;

  frames.push(currentFrame);
  return frames;
};

// Convert an array of frames into an array of Gop with each Gop being composed
// of the frames that make up that Gop
// Also keep track of cummulative data about the Gop from the frames such as the
// Gop duration, starting pts, etc.
var groupFramesIntoGops = function(frames) {
  var
    i,
    currentFrame,
    currentGop = [],
    gops = [];

  // We must pre-set some of the values on the Gop since we
  // keep running totals of these values
  currentGop.byteLength = 0;
  currentGop.nalCount = 0;
  currentGop.duration = 0;
  currentGop.pts = frames[0].pts;
  currentGop.dts = frames[0].dts;

  // store some metadata about all the Gops
  gops.byteLength = 0;
  gops.nalCount = 0;
  gops.duration = 0;
  gops.pts = frames[0].pts;
  gops.dts = frames[0].dts;

  for (i = 0; i < frames.length; i++) {
    currentFrame = frames[i];

    if (currentFrame.keyFrame) {
      // Since the very first frame is expected to be an keyframe
      // only push to the gops array when currentGop is not empty
      if (currentGop.length) {
        gops.push(currentGop);
        gops.byteLength += currentGop.byteLength;
        gops.nalCount += currentGop.nalCount;
        gops.duration += currentGop.duration;
      }

      currentGop = [currentFrame];
      currentGop.nalCount = currentFrame.length;
      currentGop.byteLength = currentFrame.byteLength;
      currentGop.pts = currentFrame.pts;
      currentGop.dts = currentFrame.dts;
      currentGop.duration = currentFrame.duration;
    } else {
      currentGop.duration += currentFrame.duration;
      currentGop.nalCount += currentFrame.length;
      currentGop.byteLength += currentFrame.byteLength;
      currentGop.push(currentFrame);
    }
  }

  if (gops.length && currentGop.duration <= 0) {
    currentGop.duration = gops[gops.length - 1].duration;
  }
  gops.byteLength += currentGop.byteLength;
  gops.nalCount += currentGop.nalCount;
  gops.duration += currentGop.duration;

  // push the final Gop
  gops.push(currentGop);
  return gops;
};

/*
 * Search for the first keyframe in the GOPs and throw away all frames
 * until that keyframe. Then extend the duration of the pulled keyframe
 * and pull the PTS and DTS of the keyframe so that it covers the time
 * range of the frames that were disposed.
 *
 * @param {Array} gops video GOPs
 * @returns {Array} modified video GOPs
 */
var extendFirstKeyFrame = function(gops) {
  var currentGop;

  if (!gops[0][0].keyFrame && gops.length > 1) {
    // Remove the first GOP
    currentGop = gops.shift();

    gops.byteLength -= currentGop.byteLength;
    gops.nalCount -= currentGop.nalCount;

    // Extend the first frame of what is now the
    // first gop to cover the time period of the
    // frames we just removed
    gops[0][0].dts = currentGop.dts;
    gops[0][0].pts = currentGop.pts;
    gops[0][0].duration += currentGop.duration;
  }

  return gops;
};

/**
 * Default sample object
 * see ISO/IEC 14496-12:2012, section 8.6.4.3
 */
var createDefaultSample = function() {
  return {
    size: 0,
    flags: {
      isLeading: 0,
      dependsOn: 1,
      isDependedOn: 0,
      hasRedundancy: 0,
      degradationPriority: 0,
      isNonSyncSample: 1
    }
  };
};

/*
 * Collates information from a video frame into an object for eventual
 * entry into an MP4 sample table.
 *
 * @param {Object} frame the video frame
 * @param {Number} dataOffset the byte offset to position the sample
 * @return {Object} object containing sample table info for a frame
 */
var sampleForFrame = function(frame, dataOffset) {
  var sample = createDefaultSample();

  sample.dataOffset = dataOffset;
  sample.compositionTimeOffset = frame.pts - frame.dts;
  sample.duration = frame.duration;
  sample.size = 4 * frame.length; // Space for nal unit size
  sample.size += frame.byteLength;

  if (frame.keyFrame) {
    sample.flags.dependsOn = 2;
    sample.flags.isNonSyncSample = 0;
  }

  return sample;
};

// generate the track's sample table from an array of gops
var generateSampleTable = function(gops, baseDataOffset) {
  var
    h, i,
    sample,
    currentGop,
    currentFrame,
    dataOffset = baseDataOffset || 0,
    samples = [];

  for (h = 0; h < gops.length; h++) {
    currentGop = gops[h];

    for (i = 0; i < currentGop.length; i++) {
      currentFrame = currentGop[i];

      sample = sampleForFrame(currentFrame, dataOffset);

      dataOffset += sample.size;

      samples.push(sample);
    }
  }
  return samples;
};

// generate the track's raw mdat data from an array of gops
var concatenateNalData = function(gops) {
  var
    h, i, j,
    currentGop,
    currentFrame,
    currentNal,
    dataOffset = 0,
    nalsByteLength = gops.byteLength,
    numberOfNals = gops.nalCount,
    totalByteLength = nalsByteLength + 4 * numberOfNals,
    data = new Uint8Array(totalByteLength),
    view = new DataView(data.buffer);

  // For each Gop..
  for (h = 0; h < gops.length; h++) {
    currentGop = gops[h];

    // For each Frame..
    for (i = 0; i < currentGop.length; i++) {
      currentFrame = currentGop[i];

      // For each NAL..
      for (j = 0; j < currentFrame.length; j++) {
        currentNal = currentFrame[j];

        view.setUint32(dataOffset, currentNal.data.byteLength);
        dataOffset += 4;
        data.set(currentNal.data, dataOffset);
        dataOffset += currentNal.data.byteLength;
      }
    }
  }
  return data;
};

// generate the track's sample table from a frame
var generateSampleTableForFrame = function(frame, baseDataOffset) {
  var
    sample,
    dataOffset = baseDataOffset || 0,
    samples = [];

  sample = sampleForFrame(frame, dataOffset);
  samples.push(sample);

  return samples;
};

// generate the track's raw mdat data from a frame
var concatenateNalDataForFrame = function(frame) {
  var
    i,
    currentNal,
    dataOffset = 0,
    nalsByteLength = frame.byteLength,
    numberOfNals = frame.length,
    totalByteLength = nalsByteLength + 4 * numberOfNals,
    data = new Uint8Array(totalByteLength),
    view = new DataView(data.buffer);

  // For each NAL..
  for (i = 0; i < frame.length; i++) {
    currentNal = frame[i];

    view.setUint32(dataOffset, currentNal.data.byteLength);
    dataOffset += 4;
    data.set(currentNal.data, dataOffset);
    dataOffset += currentNal.data.byteLength;
  }

  return data;
};

module.exports = {
  groupNalsIntoFrames: groupNalsIntoFrames,
  groupFramesIntoGops: groupFramesIntoGops,
  extendFirstKeyFrame: extendFirstKeyFrame,
  generateSampleTable: generateSampleTable,
  concatenateNalData: concatenateNalData,
  generateSampleTableForFrame: generateSampleTableForFrame,
  concatenateNalDataForFrame: concatenateNalDataForFrame
};

},{}],28:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
module.exports = {
  generator: require('./mp4-generator'),
  probe: require('./probe'),
  Transmuxer: require('./transmuxer').Transmuxer,
  AudioSegmentStream: require('./transmuxer').AudioSegmentStream,
  VideoSegmentStream: require('./transmuxer').VideoSegmentStream,
  CaptionParser: require('./caption-parser')
};

},{"./caption-parser":25,"./mp4-generator":29,"./probe":31,"./transmuxer":33}],29:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Functions that generate fragmented MP4s suitable for use with Media
 * Source Extensions.
 */
'use strict';

var UINT32_MAX = Math.pow(2, 32) - 1;

var box, dinf, esds, ftyp, mdat, mfhd, minf, moof, moov, mvex, mvhd,
    trak, tkhd, mdia, mdhd, hdlr, sdtp, stbl, stsd, traf, trex,
    trun, types, MAJOR_BRAND, MINOR_VERSION, AVC1_BRAND, VIDEO_HDLR,
    AUDIO_HDLR, HDLR_TYPES, VMHD, SMHD, DREF, STCO, STSC, STSZ, STTS;

// pre-calculate constants
(function() {
  var i;
  types = {
    avc1: [], // codingname
    avcC: [],
    btrt: [],
    dinf: [],
    dref: [],
    esds: [],
    ftyp: [],
    hdlr: [],
    mdat: [],
    mdhd: [],
    mdia: [],
    mfhd: [],
    minf: [],
    moof: [],
    moov: [],
    mp4a: [], // codingname
    mvex: [],
    mvhd: [],
    pasp: [],
    sdtp: [],
    smhd: [],
    stbl: [],
    stco: [],
    stsc: [],
    stsd: [],
    stsz: [],
    stts: [],
    styp: [],
    tfdt: [],
    tfhd: [],
    traf: [],
    trak: [],
    trun: [],
    trex: [],
    tkhd: [],
    vmhd: []
  };

  // In environments where Uint8Array is undefined (e.g., IE8), skip set up so that we
  // don't throw an error
  if (typeof Uint8Array === 'undefined') {
    return;
  }

  for (i in types) {
    if (types.hasOwnProperty(i)) {
      types[i] = [
        i.charCodeAt(0),
        i.charCodeAt(1),
        i.charCodeAt(2),
        i.charCodeAt(3)
      ];
    }
  }

  MAJOR_BRAND = new Uint8Array([
    'i'.charCodeAt(0),
    's'.charCodeAt(0),
    'o'.charCodeAt(0),
    'm'.charCodeAt(0)
  ]);
  AVC1_BRAND = new Uint8Array([
    'a'.charCodeAt(0),
    'v'.charCodeAt(0),
    'c'.charCodeAt(0),
    '1'.charCodeAt(0)
  ]);
  MINOR_VERSION = new Uint8Array([0, 0, 0, 1]);
  VIDEO_HDLR = new Uint8Array([
    0x00, // version 0
    0x00, 0x00, 0x00, // flags
    0x00, 0x00, 0x00, 0x00, // pre_defined
    0x76, 0x69, 0x64, 0x65, // handler_type: 'vide'
    0x00, 0x00, 0x00, 0x00, // reserved
    0x00, 0x00, 0x00, 0x00, // reserved
    0x00, 0x00, 0x00, 0x00, // reserved
    0x56, 0x69, 0x64, 0x65,
    0x6f, 0x48, 0x61, 0x6e,
    0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'VideoHandler'
  ]);
  AUDIO_HDLR = new Uint8Array([
    0x00, // version 0
    0x00, 0x00, 0x00, // flags
    0x00, 0x00, 0x00, 0x00, // pre_defined
    0x73, 0x6f, 0x75, 0x6e, // handler_type: 'soun'
    0x00, 0x00, 0x00, 0x00, // reserved
    0x00, 0x00, 0x00, 0x00, // reserved
    0x00, 0x00, 0x00, 0x00, // reserved
    0x53, 0x6f, 0x75, 0x6e,
    0x64, 0x48, 0x61, 0x6e,
    0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'SoundHandler'
  ]);
  HDLR_TYPES = {
    video: VIDEO_HDLR,
    audio: AUDIO_HDLR
  };
  DREF = new Uint8Array([
    0x00, // version 0
    0x00, 0x00, 0x00, // flags
    0x00, 0x00, 0x00, 0x01, // entry_count
    0x00, 0x00, 0x00, 0x0c, // entry_size
    0x75, 0x72, 0x6c, 0x20, // 'url' type
    0x00, // version 0
    0x00, 0x00, 0x01 // entry_flags
  ]);
  SMHD = new Uint8Array([
    0x00,             // version
    0x00, 0x00, 0x00, // flags
    0x00, 0x00,       // balance, 0 means centered
    0x00, 0x00        // reserved
  ]);
  STCO = new Uint8Array([
    0x00, // version
    0x00, 0x00, 0x00, // flags
    0x00, 0x00, 0x00, 0x00 // entry_count
  ]);
  STSC = STCO;
  STSZ = new Uint8Array([
    0x00, // version
    0x00, 0x00, 0x00, // flags
    0x00, 0x00, 0x00, 0x00, // sample_size
    0x00, 0x00, 0x00, 0x00 // sample_count
  ]);
  STTS = STCO;
  VMHD = new Uint8Array([
    0x00, // version
    0x00, 0x00, 0x01, // flags
    0x00, 0x00, // graphicsmode
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00 // opcolor
  ]);
}());

box = function(type) {
  var
    payload = [],
    size = 0,
    i,
    result,
    view;

  for (i = 1; i < arguments.length; i++) {
    payload.push(arguments[i]);
  }

  i = payload.length;

  // calculate the total size we need to allocate
  while (i--) {
    size += payload[i].byteLength;
  }
  result = new Uint8Array(size + 8);
  view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  view.setUint32(0, result.byteLength);
  result.set(type, 4);

  // copy the payload into the result
  for (i = 0, size = 8; i < payload.length; i++) {
    result.set(payload[i], size);
    size += payload[i].byteLength;
  }
  return result;
};

dinf = function() {
  return box(types.dinf, box(types.dref, DREF));
};

esds = function(track) {
  return box(types.esds, new Uint8Array([
    0x00, // version
    0x00, 0x00, 0x00, // flags

    // ES_Descriptor
    0x03, // tag, ES_DescrTag
    0x19, // length
    0x00, 0x00, // ES_ID
    0x00, // streamDependenceFlag, URL_flag, reserved, streamPriority

    // DecoderConfigDescriptor
    0x04, // tag, DecoderConfigDescrTag
    0x11, // length
    0x40, // object type
    0x15,  // streamType
    0x00, 0x06, 0x00, // bufferSizeDB
    0x00, 0x00, 0xda, 0xc0, // maxBitrate
    0x00, 0x00, 0xda, 0xc0, // avgBitrate

    // DecoderSpecificInfo
    0x05, // tag, DecoderSpecificInfoTag
    0x02, // length
    // ISO/IEC 14496-3, AudioSpecificConfig
    // for samplingFrequencyIndex see ISO/IEC 13818-7:2006, 8.1.3.2.2, Table 35
    (track.audioobjecttype << 3) | (track.samplingfrequencyindex >>> 1),
    (track.samplingfrequencyindex << 7) | (track.channelcount << 3),
    0x06, 0x01, 0x02 // GASpecificConfig
  ]));
};

ftyp = function() {
  return box(types.ftyp, MAJOR_BRAND, MINOR_VERSION, MAJOR_BRAND, AVC1_BRAND);
};

hdlr = function(type) {
  return box(types.hdlr, HDLR_TYPES[type]);
};
mdat = function(data) {
  return box(types.mdat, data);
};
mdhd = function(track) {
  var result = new Uint8Array([
    0x00,                   // version 0
    0x00, 0x00, 0x00,       // flags
    0x00, 0x00, 0x00, 0x02, // creation_time
    0x00, 0x00, 0x00, 0x03, // modification_time
    0x00, 0x01, 0x5f, 0x90, // timescale, 90,000 "ticks" per second

    (track.duration >>> 24) & 0xFF,
    (track.duration >>> 16) & 0xFF,
    (track.duration >>>  8) & 0xFF,
    track.duration & 0xFF,  // duration
    0x55, 0xc4,             // 'und' language (undetermined)
    0x00, 0x00
  ]);

  // Use the sample rate from the track metadata, when it is
  // defined. The sample rate can be parsed out of an ADTS header, for
  // instance.
  if (track.samplerate) {
    result[12] = (track.samplerate >>> 24) & 0xFF;
    result[13] = (track.samplerate >>> 16) & 0xFF;
    result[14] = (track.samplerate >>>  8) & 0xFF;
    result[15] = (track.samplerate)        & 0xFF;
  }

  return box(types.mdhd, result);
};
mdia = function(track) {
  return box(types.mdia, mdhd(track), hdlr(track.type), minf(track));
};
mfhd = function(sequenceNumber) {
  return box(types.mfhd, new Uint8Array([
    0x00,
    0x00, 0x00, 0x00, // flags
    (sequenceNumber & 0xFF000000) >> 24,
    (sequenceNumber & 0xFF0000) >> 16,
    (sequenceNumber & 0xFF00) >> 8,
    sequenceNumber & 0xFF // sequence_number
  ]));
};
minf = function(track) {
  return box(types.minf,
             track.type === 'video' ? box(types.vmhd, VMHD) : box(types.smhd, SMHD),
             dinf(),
             stbl(track));
};
moof = function(sequenceNumber, tracks) {
  var
    trackFragments = [],
    i = tracks.length;
  // build traf boxes for each track fragment
  while (i--) {
    trackFragments[i] = traf(tracks[i]);
  }
  return box.apply(null, [
    types.moof,
    mfhd(sequenceNumber)
  ].concat(trackFragments));
};
/**
 * Returns a movie box.
 * @param tracks {array} the tracks associated with this movie
 * @see ISO/IEC 14496-12:2012(E), section 8.2.1
 */
moov = function(tracks) {
  var
    i = tracks.length,
    boxes = [];

  while (i--) {
    boxes[i] = trak(tracks[i]);
  }

  return box.apply(null, [types.moov, mvhd(0xffffffff)].concat(boxes).concat(mvex(tracks)));
};
mvex = function(tracks) {
  var
    i = tracks.length,
    boxes = [];

  while (i--) {
    boxes[i] = trex(tracks[i]);
  }
  return box.apply(null, [types.mvex].concat(boxes));
};
mvhd = function(duration) {
  var
    bytes = new Uint8Array([
      0x00, // version 0
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x01, // creation_time
      0x00, 0x00, 0x00, 0x02, // modification_time
      0x00, 0x01, 0x5f, 0x90, // timescale, 90,000 "ticks" per second
      (duration & 0xFF000000) >> 24,
      (duration & 0xFF0000) >> 16,
      (duration & 0xFF00) >> 8,
      duration & 0xFF, // duration
      0x00, 0x01, 0x00, 0x00, // 1.0 rate
      0x01, 0x00, // 1.0 volume
      0x00, 0x00, // reserved
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, // transformation: unity matrix
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // pre_defined
      0xff, 0xff, 0xff, 0xff // next_track_ID
    ]);
  return box(types.mvhd, bytes);
};

sdtp = function(track) {
  var
    samples = track.samples || [],
    bytes = new Uint8Array(4 + samples.length),
    flags,
    i;

  // leave the full box header (4 bytes) all zero

  // write the sample table
  for (i = 0; i < samples.length; i++) {
    flags = samples[i].flags;

    bytes[i + 4] = (flags.dependsOn << 4) |
      (flags.isDependedOn << 2) |
      (flags.hasRedundancy);
  }

  return box(types.sdtp,
             bytes);
};

stbl = function(track) {
  return box(types.stbl,
             stsd(track),
             box(types.stts, STTS),
             box(types.stsc, STSC),
             box(types.stsz, STSZ),
             box(types.stco, STCO));
};

(function() {
  var videoSample, audioSample;

  stsd = function(track) {

    return box(types.stsd, new Uint8Array([
      0x00, // version 0
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x01
    ]), track.type === 'video' ? videoSample(track) : audioSample(track));
  };

  videoSample = function(track) {
    var
      sps = track.sps || [],
      pps = track.pps || [],
      sequenceParameterSets = [],
      pictureParameterSets = [],
      i,
      avc1Box;

    // assemble the SPSs
    for (i = 0; i < sps.length; i++) {
      sequenceParameterSets.push((sps[i].byteLength & 0xFF00) >>> 8);
      sequenceParameterSets.push((sps[i].byteLength & 0xFF)); // sequenceParameterSetLength
      sequenceParameterSets = sequenceParameterSets.concat(Array.prototype.slice.call(sps[i])); // SPS
    }

    // assemble the PPSs
    for (i = 0; i < pps.length; i++) {
      pictureParameterSets.push((pps[i].byteLength & 0xFF00) >>> 8);
      pictureParameterSets.push((pps[i].byteLength & 0xFF));
      pictureParameterSets = pictureParameterSets.concat(Array.prototype.slice.call(pps[i]));
    }

    avc1Box = [
      types.avc1, new Uint8Array([
        0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, // reserved
        0x00, 0x01, // data_reference_index
        0x00, 0x00, // pre_defined
        0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, // pre_defined
        (track.width & 0xff00) >> 8,
        track.width & 0xff, // width
        (track.height & 0xff00) >> 8,
        track.height & 0xff, // height
        0x00, 0x48, 0x00, 0x00, // horizresolution
        0x00, 0x48, 0x00, 0x00, // vertresolution
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x01, // frame_count
        0x13,
        0x76, 0x69, 0x64, 0x65,
        0x6f, 0x6a, 0x73, 0x2d,
        0x63, 0x6f, 0x6e, 0x74,
        0x72, 0x69, 0x62, 0x2d,
        0x68, 0x6c, 0x73, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, // compressorname
        0x00, 0x18, // depth = 24
        0x11, 0x11 // pre_defined = -1
      ]),
      box(types.avcC, new Uint8Array([
        0x01, // configurationVersion
        track.profileIdc, // AVCProfileIndication
        track.profileCompatibility, // profile_compatibility
        track.levelIdc, // AVCLevelIndication
        0xff // lengthSizeMinusOne, hard-coded to 4 bytes
      ].concat(
        [sps.length], // numOfSequenceParameterSets
        sequenceParameterSets, // "SPS"
        [pps.length], // numOfPictureParameterSets
        pictureParameterSets // "PPS"
      ))),
      box(types.btrt, new Uint8Array([
        0x00, 0x1c, 0x9c, 0x80, // bufferSizeDB
        0x00, 0x2d, 0xc6, 0xc0, // maxBitrate
        0x00, 0x2d, 0xc6, 0xc0 // avgBitrate
      ]))
    ];

    if (track.sarRatio) {
      var
        hSpacing = track.sarRatio[0],
        vSpacing = track.sarRatio[1];

        avc1Box.push(
          box(types.pasp, new Uint8Array([
            (hSpacing & 0xFF000000) >> 24,
            (hSpacing & 0xFF0000) >> 16,
            (hSpacing & 0xFF00) >> 8,
            hSpacing & 0xFF,
            (vSpacing & 0xFF000000) >> 24,
            (vSpacing & 0xFF0000) >> 16,
            (vSpacing & 0xFF00) >> 8,
            vSpacing & 0xFF
          ]))
        );
    }

    return box.apply(null, avc1Box);
  };

  audioSample = function(track) {
    return box(types.mp4a, new Uint8Array([

      // SampleEntry, ISO/IEC 14496-12
      0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, // reserved
      0x00, 0x01, // data_reference_index

      // AudioSampleEntry, ISO/IEC 14496-12
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, 0x00, 0x00, 0x00, // reserved
      (track.channelcount & 0xff00) >> 8,
      (track.channelcount & 0xff), // channelcount

      (track.samplesize & 0xff00) >> 8,
      (track.samplesize & 0xff), // samplesize
      0x00, 0x00, // pre_defined
      0x00, 0x00, // reserved

      (track.samplerate & 0xff00) >> 8,
      (track.samplerate & 0xff),
      0x00, 0x00 // samplerate, 16.16

      // MP4AudioSampleEntry, ISO/IEC 14496-14
    ]), esds(track));
  };
}());

tkhd = function(track) {
  var result = new Uint8Array([
    0x00, // version 0
    0x00, 0x00, 0x07, // flags
    0x00, 0x00, 0x00, 0x00, // creation_time
    0x00, 0x00, 0x00, 0x00, // modification_time
    (track.id & 0xFF000000) >> 24,
    (track.id & 0xFF0000) >> 16,
    (track.id & 0xFF00) >> 8,
    track.id & 0xFF, // track_ID
    0x00, 0x00, 0x00, 0x00, // reserved
    (track.duration & 0xFF000000) >> 24,
    (track.duration & 0xFF0000) >> 16,
    (track.duration & 0xFF00) >> 8,
    track.duration & 0xFF, // duration
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, // reserved
    0x00, 0x00, // layer
    0x00, 0x00, // alternate_group
    0x01, 0x00, // non-audio track volume
    0x00, 0x00, // reserved
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x40, 0x00, 0x00, 0x00, // transformation: unity matrix
    (track.width & 0xFF00) >> 8,
    track.width & 0xFF,
    0x00, 0x00, // width
    (track.height & 0xFF00) >> 8,
    track.height & 0xFF,
    0x00, 0x00 // height
  ]);

  return box(types.tkhd, result);
};

/**
 * Generate a track fragment (traf) box. A traf box collects metadata
 * about tracks in a movie fragment (moof) box.
 */
traf = function(track) {
  var trackFragmentHeader, trackFragmentDecodeTime, trackFragmentRun,
      sampleDependencyTable, dataOffset,
      upperWordBaseMediaDecodeTime, lowerWordBaseMediaDecodeTime;

  trackFragmentHeader = box(types.tfhd, new Uint8Array([
    0x00, // version 0
    0x00, 0x00, 0x3a, // flags
    (track.id & 0xFF000000) >> 24,
    (track.id & 0xFF0000) >> 16,
    (track.id & 0xFF00) >> 8,
    (track.id & 0xFF), // track_ID
    0x00, 0x00, 0x00, 0x01, // sample_description_index
    0x00, 0x00, 0x00, 0x00, // default_sample_duration
    0x00, 0x00, 0x00, 0x00, // default_sample_size
    0x00, 0x00, 0x00, 0x00  // default_sample_flags
  ]));

  upperWordBaseMediaDecodeTime = Math.floor(track.baseMediaDecodeTime / (UINT32_MAX + 1));
  lowerWordBaseMediaDecodeTime = Math.floor(track.baseMediaDecodeTime % (UINT32_MAX + 1));

  trackFragmentDecodeTime = box(types.tfdt, new Uint8Array([
    0x01, // version 1
    0x00, 0x00, 0x00, // flags
    // baseMediaDecodeTime
    (upperWordBaseMediaDecodeTime >>> 24) & 0xFF,
    (upperWordBaseMediaDecodeTime >>> 16) & 0xFF,
    (upperWordBaseMediaDecodeTime >>>  8) & 0xFF,
    upperWordBaseMediaDecodeTime & 0xFF,
    (lowerWordBaseMediaDecodeTime >>> 24) & 0xFF,
    (lowerWordBaseMediaDecodeTime >>> 16) & 0xFF,
    (lowerWordBaseMediaDecodeTime >>>  8) & 0xFF,
    lowerWordBaseMediaDecodeTime & 0xFF
  ]));

  // the data offset specifies the number of bytes from the start of
  // the containing moof to the first payload byte of the associated
  // mdat
  dataOffset = (32 + // tfhd
                20 + // tfdt
                8 +  // traf header
                16 + // mfhd
                8 +  // moof header
                8);  // mdat header

  // audio tracks require less metadata
  if (track.type === 'audio') {
    trackFragmentRun = trun(track, dataOffset);
    return box(types.traf,
               trackFragmentHeader,
               trackFragmentDecodeTime,
               trackFragmentRun);
  }

  // video tracks should contain an independent and disposable samples
  // box (sdtp)
  // generate one and adjust offsets to match
  sampleDependencyTable = sdtp(track);
  trackFragmentRun = trun(track,
                          sampleDependencyTable.length + dataOffset);
  return box(types.traf,
             trackFragmentHeader,
             trackFragmentDecodeTime,
             trackFragmentRun,
             sampleDependencyTable);
};

/**
 * Generate a track box.
 * @param track {object} a track definition
 * @return {Uint8Array} the track box
 */
trak = function(track) {
  track.duration = track.duration || 0xffffffff;
  return box(types.trak,
             tkhd(track),
             mdia(track));
};

trex = function(track) {
  var result = new Uint8Array([
    0x00, // version 0
    0x00, 0x00, 0x00, // flags
    (track.id & 0xFF000000) >> 24,
    (track.id & 0xFF0000) >> 16,
    (track.id & 0xFF00) >> 8,
    (track.id & 0xFF), // track_ID
    0x00, 0x00, 0x00, 0x01, // default_sample_description_index
    0x00, 0x00, 0x00, 0x00, // default_sample_duration
    0x00, 0x00, 0x00, 0x00, // default_sample_size
    0x00, 0x01, 0x00, 0x01 // default_sample_flags
  ]);
  // the last two bytes of default_sample_flags is the sample
  // degradation priority, a hint about the importance of this sample
  // relative to others. Lower the degradation priority for all sample
  // types other than video.
  if (track.type !== 'video') {
    result[result.length - 1] = 0x00;
  }

  return box(types.trex, result);
};

(function() {
  var audioTrun, videoTrun, trunHeader;

  // This method assumes all samples are uniform. That is, if a
  // duration is present for the first sample, it will be present for
  // all subsequent samples.
  // see ISO/IEC 14496-12:2012, Section 8.8.8.1
  trunHeader = function(samples, offset) {
    var durationPresent = 0, sizePresent = 0,
        flagsPresent = 0, compositionTimeOffset = 0;

    // trun flag constants
    if (samples.length) {
      if (samples[0].duration !== undefined) {
        durationPresent = 0x1;
      }
      if (samples[0].size !== undefined) {
        sizePresent = 0x2;
      }
      if (samples[0].flags !== undefined) {
        flagsPresent = 0x4;
      }
      if (samples[0].compositionTimeOffset !== undefined) {
        compositionTimeOffset = 0x8;
      }
    }

    return [
      0x00, // version 0
      0x00,
      durationPresent | sizePresent | flagsPresent | compositionTimeOffset,
      0x01, // flags
      (samples.length & 0xFF000000) >>> 24,
      (samples.length & 0xFF0000) >>> 16,
      (samples.length & 0xFF00) >>> 8,
      samples.length & 0xFF, // sample_count
      (offset & 0xFF000000) >>> 24,
      (offset & 0xFF0000) >>> 16,
      (offset & 0xFF00) >>> 8,
      offset & 0xFF // data_offset
    ];
  };

  videoTrun = function(track, offset) {
    var bytesOffest, bytes, header, samples, sample, i;

    samples = track.samples || [];
    offset += 8 + 12 + (16 * samples.length);
    header = trunHeader(samples, offset);
    bytes = new Uint8Array(header.length + samples.length * 16);
    bytes.set(header);
    bytesOffest = header.length;

    for (i = 0; i < samples.length; i++) {
      sample = samples[i];

      bytes[bytesOffest++] = (sample.duration & 0xFF000000) >>> 24;
      bytes[bytesOffest++] = (sample.duration & 0xFF0000) >>> 16;
      bytes[bytesOffest++] = (sample.duration & 0xFF00) >>> 8;
      bytes[bytesOffest++] = sample.duration & 0xFF; // sample_duration
      bytes[bytesOffest++] = (sample.size & 0xFF000000) >>> 24;
      bytes[bytesOffest++] = (sample.size & 0xFF0000) >>> 16;
      bytes[bytesOffest++] = (sample.size & 0xFF00) >>> 8;
      bytes[bytesOffest++] = sample.size & 0xFF; // sample_size
      bytes[bytesOffest++] = (sample.flags.isLeading << 2) | sample.flags.dependsOn;
      bytes[bytesOffest++] = (sample.flags.isDependedOn << 6) |
          (sample.flags.hasRedundancy << 4) |
          (sample.flags.paddingValue << 1) |
          sample.flags.isNonSyncSample;
      bytes[bytesOffest++] = sample.flags.degradationPriority & 0xF0 << 8;
      bytes[bytesOffest++] = sample.flags.degradationPriority & 0x0F; // sample_flags
      bytes[bytesOffest++] = (sample.compositionTimeOffset & 0xFF000000) >>> 24;
      bytes[bytesOffest++] = (sample.compositionTimeOffset & 0xFF0000) >>> 16;
      bytes[bytesOffest++] = (sample.compositionTimeOffset & 0xFF00) >>> 8;
      bytes[bytesOffest++] = sample.compositionTimeOffset & 0xFF; // sample_composition_time_offset
    }
    return box(types.trun, bytes);
  };

  audioTrun = function(track, offset) {
    var bytes, bytesOffest, header, samples, sample, i;

    samples = track.samples || [];
    offset += 8 + 12 + (8 * samples.length);

    header = trunHeader(samples, offset);
    bytes = new Uint8Array(header.length + samples.length * 8);
    bytes.set(header);
    bytesOffest = header.length;

    for (i = 0; i < samples.length; i++) {
      sample = samples[i];
      bytes[bytesOffest++] = (sample.duration & 0xFF000000) >>> 24;
      bytes[bytesOffest++] = (sample.duration & 0xFF0000) >>> 16;
      bytes[bytesOffest++] = (sample.duration & 0xFF00) >>> 8;
      bytes[bytesOffest++] = sample.duration & 0xFF; // sample_duration
      bytes[bytesOffest++] = (sample.size & 0xFF000000) >>> 24;
      bytes[bytesOffest++] = (sample.size & 0xFF0000) >>> 16;
      bytes[bytesOffest++] = (sample.size & 0xFF00) >>> 8;
      bytes[bytesOffest++] = sample.size & 0xFF; // sample_size
    }

    return box(types.trun, bytes);
  };

  trun = function(track, offset) {
    if (track.type === 'audio') {
      return audioTrun(track, offset);
    }

    return videoTrun(track, offset);
  };
}());

module.exports = {
  ftyp: ftyp,
  mdat: mdat,
  moof: moof,
  moov: moov,
  initSegment: function(tracks) {
    var
      fileType = ftyp(),
      movie = moov(tracks),
      result;

    result = new Uint8Array(fileType.byteLength + movie.byteLength);
    result.set(fileType);
    result.set(movie, fileType.byteLength);
    return result;
  }
};

},{}],30:[function(require,module,exports){
var parseType = function(buffer) {
  var result = '';
  result += String.fromCharCode(buffer[0]);
  result += String.fromCharCode(buffer[1]);
  result += String.fromCharCode(buffer[2]);
  result += String.fromCharCode(buffer[3]);
  return result;
};


module.exports = parseType;

},{}],31:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Utilities to detect basic properties and metadata about MP4s.
 */
'use strict';

var toUnsigned = require('../utils/bin').toUnsigned;
var toHexString = require('../utils/bin').toHexString;
var findBox = require('../mp4/find-box.js');
var parseType = require('../mp4/parse-type.js');
var parseTfhd = require('../tools/parse-tfhd.js');
var parseTrun = require('../tools/parse-trun.js');
var parseTfdt = require('../tools/parse-tfdt.js');
var timescale, startTime, compositionStartTime, getVideoTrackIds, getTracks,
  getTimescaleFromMediaHeader;

/**
 * Parses an MP4 initialization segment and extracts the timescale
 * values for any declared tracks. Timescale values indicate the
 * number of clock ticks per second to assume for time-based values
 * elsewhere in the MP4.
 *
 * To determine the start time of an MP4, you need two pieces of
 * information: the timescale unit and the earliest base media decode
 * time. Multiple timescales can be specified within an MP4 but the
 * base media decode time is always expressed in the timescale from
 * the media header box for the track:
 * ```
 * moov > trak > mdia > mdhd.timescale
 * ```
 * @param init {Uint8Array} the bytes of the init segment
 * @return {object} a hash of track ids to timescale values or null if
 * the init segment is malformed.
 */
timescale = function(init) {
  var
    result = {},
    traks = findBox(init, ['moov', 'trak']);

  // mdhd timescale
  return traks.reduce(function(result, trak) {
    var tkhd, version, index, id, mdhd;

    tkhd = findBox(trak, ['tkhd'])[0];
    if (!tkhd) {
      return null;
    }
    version = tkhd[0];
    index = version === 0 ? 12 : 20;
    id = toUnsigned(tkhd[index]     << 24 |
                    tkhd[index + 1] << 16 |
                    tkhd[index + 2] <<  8 |
                    tkhd[index + 3]);

    mdhd = findBox(trak, ['mdia', 'mdhd'])[0];
    if (!mdhd) {
      return null;
    }
    version = mdhd[0];
    index = version === 0 ? 12 : 20;
    result[id] = toUnsigned(mdhd[index]     << 24 |
                            mdhd[index + 1] << 16 |
                            mdhd[index + 2] <<  8 |
                            mdhd[index + 3]);
    return result;
  }, result);
};

/**
 * Determine the base media decode start time, in seconds, for an MP4
 * fragment. If multiple fragments are specified, the earliest time is
 * returned.
 *
 * The base media decode time can be parsed from track fragment
 * metadata:
 * ```
 * moof > traf > tfdt.baseMediaDecodeTime
 * ```
 * It requires the timescale value from the mdhd to interpret.
 *
 * @param timescale {object} a hash of track ids to timescale values.
 * @return {number} the earliest base media decode start time for the
 * fragment, in seconds
 */
startTime = function(timescale, fragment) {
  var trafs, baseTimes, result;

  // we need info from two childrend of each track fragment box
  trafs = findBox(fragment, ['moof', 'traf']);

  // determine the start times for each track
  baseTimes = [].concat.apply([], trafs.map(function(traf) {
    return findBox(traf, ['tfhd']).map(function(tfhd) {
      var id, scale, baseTime;

      // get the track id from the tfhd
      id = toUnsigned(tfhd[4] << 24 |
                      tfhd[5] << 16 |
                      tfhd[6] <<  8 |
                      tfhd[7]);
      // assume a 90kHz clock if no timescale was specified
      scale = timescale[id] || 90e3;

      // get the base media decode time from the tfdt
      baseTime = findBox(traf, ['tfdt']).map(function(tfdt) {
        var version, result;

        version = tfdt[0];
        result = toUnsigned(tfdt[4] << 24 |
                            tfdt[5] << 16 |
                            tfdt[6] <<  8 |
                            tfdt[7]);
        if (version ===  1) {
          result *= Math.pow(2, 32);
          result += toUnsigned(tfdt[8]  << 24 |
                               tfdt[9]  << 16 |
                               tfdt[10] <<  8 |
                               tfdt[11]);
        }
        return result;
      })[0];
      baseTime = baseTime || Infinity;

      // convert base time to seconds
      return baseTime / scale;
    });
  }));

  // return the minimum
  result = Math.min.apply(null, baseTimes);
  return isFinite(result) ? result : 0;
};

/**
 * Determine the composition start, in seconds, for an MP4
 * fragment.
 *
 * The composition start time of a fragment can be calculated using the base
 * media decode time, composition time offset, and timescale, as follows:
 *
 * compositionStartTime = (baseMediaDecodeTime + compositionTimeOffset) / timescale
 *
 * All of the aforementioned information is contained within a media fragment's
 * `traf` box, except for timescale info, which comes from the initialization
 * segment, so a track id (also contained within a `traf`) is also necessary to
 * associate it with a timescale
 *
 *
 * @param timescales {object} - a hash of track ids to timescale values.
 * @param fragment {Unit8Array} - the bytes of a media segment
 * @return {number} the composition start time for the fragment, in seconds
 **/
compositionStartTime = function(timescales, fragment) {
  var trafBoxes = findBox(fragment, ['moof', 'traf']);
  var baseMediaDecodeTime = 0;
  var compositionTimeOffset = 0;
  var trackId;

  if (trafBoxes && trafBoxes.length) {
    // The spec states that track run samples contained within a `traf` box are contiguous, but
    // it does not explicitly state whether the `traf` boxes themselves are contiguous.
    // We will assume that they are, so we only need the first to calculate start time.
    var tfhd = findBox(trafBoxes[0], ['tfhd'])[0];
    var trun = findBox(trafBoxes[0], ['trun'])[0];
    var tfdt = findBox(trafBoxes[0], ['tfdt'])[0];

    if (tfhd) {
      var parsedTfhd = parseTfhd(tfhd);

      trackId = parsedTfhd.trackId;
    }

    if (tfdt) {
      var parsedTfdt = parseTfdt(tfdt);

      baseMediaDecodeTime = parsedTfdt.baseMediaDecodeTime;
    }

    if (trun) {
      var parsedTrun = parseTrun(trun);

      if (parsedTrun.samples && parsedTrun.samples.length) {
        compositionTimeOffset = parsedTrun.samples[0].compositionTimeOffset || 0;
      }
    }
  }

  // Get timescale for this specific track. Assume a 90kHz clock if no timescale was
  // specified.
  var timescale = timescales[trackId] || 90e3;

  // return the composition start time, in seconds
  return (baseMediaDecodeTime + compositionTimeOffset) / timescale;
};

/**
  * Find the trackIds of the video tracks in this source.
  * Found by parsing the Handler Reference and Track Header Boxes:
  *   moov > trak > mdia > hdlr
  *   moov > trak > tkhd
  *
  * @param {Uint8Array} init - The bytes of the init segment for this source
  * @return {Number[]} A list of trackIds
  *
  * @see ISO-BMFF-12/2015, Section 8.4.3
 **/
getVideoTrackIds = function(init) {
  var traks = findBox(init, ['moov', 'trak']);
  var videoTrackIds = [];

  traks.forEach(function(trak) {
    var hdlrs = findBox(trak, ['mdia', 'hdlr']);
    var tkhds = findBox(trak, ['tkhd']);

    hdlrs.forEach(function(hdlr, index) {
      var handlerType = parseType(hdlr.subarray(8, 12));
      var tkhd = tkhds[index];
      var view;
      var version;
      var trackId;

      if (handlerType === 'vide') {
        view = new DataView(tkhd.buffer, tkhd.byteOffset, tkhd.byteLength);
        version = view.getUint8(0);
        trackId = (version === 0) ? view.getUint32(12) : view.getUint32(20);

        videoTrackIds.push(trackId);
      }
    });
  });

  return videoTrackIds;
};

getTimescaleFromMediaHeader = function(mdhd) {
  // mdhd is a FullBox, meaning it will have its own version as the first byte
  var version = mdhd[0];
  var index = version === 0 ? 12 : 20;

  return toUnsigned(
    mdhd[index]     << 24 |
    mdhd[index + 1] << 16 |
    mdhd[index + 2] <<  8 |
    mdhd[index + 3]
  );
};

/**
 * Get all the video, audio, and hint tracks from a non fragmented
 * mp4 segment
 */
getTracks = function(init) {
  var traks = findBox(init, ['moov', 'trak']);
  var tracks = [];

  traks.forEach(function(trak) {
    var track = {};
    var tkhd = findBox(trak, ['tkhd'])[0];
    var view, tkhdVersion;

    // id
    if (tkhd) {
      view = new DataView(tkhd.buffer, tkhd.byteOffset, tkhd.byteLength);
      tkhdVersion = view.getUint8(0);

      track.id = (tkhdVersion === 0) ? view.getUint32(12) : view.getUint32(20);
    }

    var hdlr = findBox(trak, ['mdia', 'hdlr'])[0];

    // type
    if (hdlr) {
      var type = parseType(hdlr.subarray(8, 12));

      if (type === 'vide') {
        track.type = 'video';
      } else if (type === 'soun') {
        track.type = 'audio';
      } else {
        track.type = type;
      }
    }


    // codec
    var stsd = findBox(trak, ['mdia', 'minf', 'stbl', 'stsd'])[0];

    if (stsd) {
      var sampleDescriptions = stsd.subarray(8);
      // gives the codec type string
      track.codec = parseType(sampleDescriptions.subarray(4, 8));

      var codecBox = findBox(sampleDescriptions, [track.codec])[0];
      var codecConfig, codecConfigType;

      if (codecBox) {
        // https://tools.ietf.org/html/rfc6381#section-3.3
        if ((/^[a-z]vc[1-9]$/i).test(track.codec)) {
          // we don't need anything but the "config" parameter of the
          // avc1 codecBox
          codecConfig = codecBox.subarray(78);
          codecConfigType = parseType(codecConfig.subarray(4, 8));

          if (codecConfigType === 'avcC' && codecConfig.length > 11) {
            track.codec += '.';

            // left padded with zeroes for single digit hex
            // profile idc
            track.codec +=  toHexString(codecConfig[9]);
            // the byte containing the constraint_set flags
            track.codec += toHexString(codecConfig[10]);
            // level idc
            track.codec += toHexString(codecConfig[11]);
          } else {
            // TODO: show a warning that we couldn't parse the codec
            // and are using the default
            track.codec = 'avc1.4d400d';
          }
        } else if ((/^mp4[a,v]$/i).test(track.codec)) {
          // we do not need anything but the streamDescriptor of the mp4a codecBox
          codecConfig = codecBox.subarray(28);
          codecConfigType = parseType(codecConfig.subarray(4, 8));

          if (codecConfigType === 'esds' && codecConfig.length > 20 && codecConfig[19] !== 0) {
            track.codec += '.' + toHexString(codecConfig[19]);
            // this value is only a single digit
            track.codec += '.' + toHexString((codecConfig[20] >>> 2) & 0x3f).replace(/^0/, '');
          } else {
            // TODO: show a warning that we couldn't parse the codec
            // and are using the default
            track.codec = 'mp4a.40.2';
          }
        } else {
          // TODO: show a warning? for unknown codec type
        }
      }
    }

    var mdhd = findBox(trak, ['mdia', 'mdhd'])[0];

    if (mdhd) {
      track.timescale = getTimescaleFromMediaHeader(mdhd);
    }

    tracks.push(track);
  });

  return tracks;
};

module.exports = {
  // export mp4 inspector's findBox and parseType for backwards compatibility
  findBox: findBox,
  parseType: parseType,
  timescale: timescale,
  startTime: startTime,
  compositionStartTime: compositionStartTime,
  videoTrackIds: getVideoTrackIds,
  tracks: getTracks,
  getTimescaleFromMediaHeader: getTimescaleFromMediaHeader
};

},{"../mp4/find-box.js":26,"../mp4/parse-type.js":30,"../tools/parse-tfdt.js":43,"../tools/parse-tfhd.js":44,"../tools/parse-trun.js":45,"../utils/bin":47}],32:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
var ONE_SECOND_IN_TS = require('../utils/clock').ONE_SECOND_IN_TS;

/**
 * Store information about the start and end of the track and the
 * duration for each frame/sample we process in order to calculate
 * the baseMediaDecodeTime
 */
var collectDtsInfo = function(track, data) {
  if (typeof data.pts === 'number') {
    if (track.timelineStartInfo.pts === undefined) {
      track.timelineStartInfo.pts = data.pts;
    }

    if (track.minSegmentPts === undefined) {
      track.minSegmentPts = data.pts;
    } else {
      track.minSegmentPts = Math.min(track.minSegmentPts, data.pts);
    }

    if (track.maxSegmentPts === undefined) {
      track.maxSegmentPts = data.pts;
    } else {
      track.maxSegmentPts = Math.max(track.maxSegmentPts, data.pts);
    }
  }

  if (typeof data.dts === 'number') {
    if (track.timelineStartInfo.dts === undefined) {
      track.timelineStartInfo.dts = data.dts;
    }

    if (track.minSegmentDts === undefined) {
      track.minSegmentDts = data.dts;
    } else {
      track.minSegmentDts = Math.min(track.minSegmentDts, data.dts);
    }

    if (track.maxSegmentDts === undefined) {
      track.maxSegmentDts = data.dts;
    } else {
      track.maxSegmentDts = Math.max(track.maxSegmentDts, data.dts);
    }
  }
};

/**
 * Clear values used to calculate the baseMediaDecodeTime between
 * tracks
 */
var clearDtsInfo = function(track) {
  delete track.minSegmentDts;
  delete track.maxSegmentDts;
  delete track.minSegmentPts;
  delete track.maxSegmentPts;
};

/**
 * Calculate the track's baseMediaDecodeTime based on the earliest
 * DTS the transmuxer has ever seen and the minimum DTS for the
 * current track
 * @param track {object} track metadata configuration
 * @param keepOriginalTimestamps {boolean} If true, keep the timestamps
 *        in the source; false to adjust the first segment to start at 0.
 */
var calculateTrackBaseMediaDecodeTime = function(track, keepOriginalTimestamps) {
  var
    baseMediaDecodeTime,
    scale,
    minSegmentDts = track.minSegmentDts;

  // Optionally adjust the time so the first segment starts at zero.
  if (!keepOriginalTimestamps) {
    minSegmentDts -= track.timelineStartInfo.dts;
  }

  // track.timelineStartInfo.baseMediaDecodeTime is the location, in time, where
  // we want the start of the first segment to be placed
  baseMediaDecodeTime = track.timelineStartInfo.baseMediaDecodeTime;

  // Add to that the distance this segment is from the very first
  baseMediaDecodeTime += minSegmentDts;

  // baseMediaDecodeTime must not become negative
  baseMediaDecodeTime = Math.max(0, baseMediaDecodeTime);

  if (track.type === 'audio') {
    // Audio has a different clock equal to the sampling_rate so we need to
    // scale the PTS values into the clock rate of the track
    scale = track.samplerate / ONE_SECOND_IN_TS;
    baseMediaDecodeTime *= scale;
    baseMediaDecodeTime = Math.floor(baseMediaDecodeTime);
  }

  return baseMediaDecodeTime;
};

module.exports = {
  clearDtsInfo: clearDtsInfo,
  calculateTrackBaseMediaDecodeTime: calculateTrackBaseMediaDecodeTime,
  collectDtsInfo: collectDtsInfo
};

},{"../utils/clock":48}],33:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * A stream-based mp2t to mp4 converter. This utility can be used to
 * deliver mp4s to a SourceBuffer on platforms that support native
 * Media Source Extensions.
 */
'use strict';

var Stream = require('../utils/stream.js');
var mp4 = require('./mp4-generator.js');
var frameUtils = require('./frame-utils');
var audioFrameUtils = require('./audio-frame-utils');
var trackDecodeInfo = require('./track-decode-info');
var m2ts = require('../m2ts/m2ts.js');
var clock = require('../utils/clock');
var AdtsStream = require('../codecs/adts.js');
var H264Stream = require('../codecs/h264').H264Stream;
var AacStream = require('../aac');
var isLikelyAacData = require('../aac/utils').isLikelyAacData;
var ONE_SECOND_IN_TS = require('../utils/clock').ONE_SECOND_IN_TS;
var AUDIO_PROPERTIES = require('../constants/audio-properties.js');
var VIDEO_PROPERTIES = require('../constants/video-properties.js');

// object types
var VideoSegmentStream, AudioSegmentStream, Transmuxer, CoalesceStream;

/**
 * Compare two arrays (even typed) for same-ness
 */
var arrayEquals = function(a, b) {
  var
    i;

  if (a.length !== b.length) {
    return false;
  }

  // compare the value of each element in the array
  for (i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
};

var generateVideoSegmentTimingInfo = function(
  baseMediaDecodeTime,
  startDts,
  startPts,
  endDts,
  endPts,
  prependedContentDuration
) {
  var
    ptsOffsetFromDts = startPts - startDts,
    decodeDuration = endDts - startDts,
    presentationDuration = endPts - startPts;

  // The PTS and DTS values are based on the actual stream times from the segment,
  // however, the player time values will reflect a start from the baseMediaDecodeTime.
  // In order to provide relevant values for the player times, base timing info on the
  // baseMediaDecodeTime and the DTS and PTS durations of the segment.
  return {
    start: {
      dts: baseMediaDecodeTime,
      pts: baseMediaDecodeTime + ptsOffsetFromDts
    },
    end: {
      dts: baseMediaDecodeTime + decodeDuration,
      pts: baseMediaDecodeTime + presentationDuration
    },
    prependedContentDuration: prependedContentDuration,
    baseMediaDecodeTime: baseMediaDecodeTime
  };
};

/**
 * Constructs a single-track, ISO BMFF media segment from AAC data
 * events. The output of this stream can be fed to a SourceBuffer
 * configured with a suitable initialization segment.
 * @param track {object} track metadata configuration
 * @param options {object} transmuxer options object
 * @param options.keepOriginalTimestamps {boolean} If true, keep the timestamps
 *        in the source; false to adjust the first segment to start at 0.
 */
AudioSegmentStream = function(track, options) {
  var
    adtsFrames = [],
    sequenceNumber = 0,
    earliestAllowedDts = 0,
    audioAppendStartTs = 0,
    videoBaseMediaDecodeTime = Infinity;

  options = options || {};

  AudioSegmentStream.prototype.init.call(this);

  this.push = function(data) {
    trackDecodeInfo.collectDtsInfo(track, data);

    if (track) {
      AUDIO_PROPERTIES.forEach(function(prop) {
        track[prop] = data[prop];
      });
    }

    // buffer audio data until end() is called
    adtsFrames.push(data);
  };

  this.setEarliestDts = function(earliestDts) {
    earliestAllowedDts = earliestDts;
  };

  this.setVideoBaseMediaDecodeTime = function(baseMediaDecodeTime) {
    videoBaseMediaDecodeTime = baseMediaDecodeTime;
  };

  this.setAudioAppendStart = function(timestamp) {
    audioAppendStartTs = timestamp;
  };

  this.flush = function() {
    var
      frames,
      moof,
      mdat,
      boxes,
      frameDuration;

    // return early if no audio data has been observed
    if (adtsFrames.length === 0) {
      this.trigger('done', 'AudioSegmentStream');
      return;
    }

    frames = audioFrameUtils.trimAdtsFramesByEarliestDts(
      adtsFrames, track, earliestAllowedDts);
    track.baseMediaDecodeTime = trackDecodeInfo.calculateTrackBaseMediaDecodeTime(
      track, options.keepOriginalTimestamps);

    audioFrameUtils.prefixWithSilence(
      track, frames, audioAppendStartTs, videoBaseMediaDecodeTime);

    // we have to build the index from byte locations to
    // samples (that is, adts frames) in the audio data
    track.samples = audioFrameUtils.generateSampleTable(frames);

    // concatenate the audio data to constuct the mdat
    mdat = mp4.mdat(audioFrameUtils.concatenateFrameData(frames));

    adtsFrames = [];

    moof = mp4.moof(sequenceNumber, [track]);
    boxes = new Uint8Array(moof.byteLength + mdat.byteLength);

    // bump the sequence number for next time
    sequenceNumber++;

    boxes.set(moof);
    boxes.set(mdat, moof.byteLength);

    trackDecodeInfo.clearDtsInfo(track);

    frameDuration = Math.ceil(ONE_SECOND_IN_TS * 1024 / track.samplerate);

    // TODO this check was added to maintain backwards compatibility (particularly with
    // tests) on adding the timingInfo event. However, it seems unlikely that there's a
    // valid use-case where an init segment/data should be triggered without associated
    // frames. Leaving for now, but should be looked into.
    if (frames.length) {
      this.trigger('timingInfo', {
        start: frames[0].pts,
        end: frames[0].pts + (frames.length * frameDuration)
      });
    }
    this.trigger('data', {track: track, boxes: boxes});
    this.trigger('done', 'AudioSegmentStream');
  };

  this.reset = function() {
    trackDecodeInfo.clearDtsInfo(track);
    adtsFrames = [];
    this.trigger('reset');
  };
};

AudioSegmentStream.prototype = new Stream();

/**
 * Constructs a single-track, ISO BMFF media segment from H264 data
 * events. The output of this stream can be fed to a SourceBuffer
 * configured with a suitable initialization segment.
 * @param track {object} track metadata configuration
 * @param options {object} transmuxer options object
 * @param options.alignGopsAtEnd {boolean} If true, start from the end of the
 *        gopsToAlignWith list when attempting to align gop pts
 * @param options.keepOriginalTimestamps {boolean} If true, keep the timestamps
 *        in the source; false to adjust the first segment to start at 0.
 */
VideoSegmentStream = function(track, options) {
  var
    sequenceNumber = 0,
    nalUnits = [],
    gopsToAlignWith = [],
    config,
    pps;

  options = options || {};

  VideoSegmentStream.prototype.init.call(this);

  delete track.minPTS;

  this.gopCache_ = [];

  /**
    * Constructs a ISO BMFF segment given H264 nalUnits
    * @param {Object} nalUnit A data event representing a nalUnit
    * @param {String} nalUnit.nalUnitType
    * @param {Object} nalUnit.config Properties for a mp4 track
    * @param {Uint8Array} nalUnit.data The nalUnit bytes
    * @see lib/codecs/h264.js
   **/
  this.push = function(nalUnit) {
    trackDecodeInfo.collectDtsInfo(track, nalUnit);

    // record the track config
    if (nalUnit.nalUnitType === 'seq_parameter_set_rbsp' && !config) {
      config = nalUnit.config;
      track.sps = [nalUnit.data];

      VIDEO_PROPERTIES.forEach(function(prop) {
        track[prop] = config[prop];
      }, this);
    }

    if (nalUnit.nalUnitType === 'pic_parameter_set_rbsp' &&
        !pps) {
      pps = nalUnit.data;
      track.pps = [nalUnit.data];
    }

    // buffer video until flush() is called
    nalUnits.push(nalUnit);
  };

  /**
    * Pass constructed ISO BMFF track and boxes on to the
    * next stream in the pipeline
   **/
  this.flush = function() {
    var
      frames,
      gopForFusion,
      gops,
      moof,
      mdat,
      boxes,
      prependedContentDuration = 0,
      firstGop,
      lastGop;

    // Throw away nalUnits at the start of the byte stream until
    // we find the first AUD
    while (nalUnits.length) {
      if (nalUnits[0].nalUnitType === 'access_unit_delimiter_rbsp') {
        break;
      }
      nalUnits.shift();
    }

    // Return early if no video data has been observed
    if (nalUnits.length === 0) {
      this.resetStream_();
      this.trigger('done', 'VideoSegmentStream');
      return;
    }

    // Organize the raw nal-units into arrays that represent
    // higher-level constructs such as frames and gops
    // (group-of-pictures)
    frames = frameUtils.groupNalsIntoFrames(nalUnits);
    gops = frameUtils.groupFramesIntoGops(frames);

    // If the first frame of this fragment is not a keyframe we have
    // a problem since MSE (on Chrome) requires a leading keyframe.
    //
    // We have two approaches to repairing this situation:
    // 1) GOP-FUSION:
    //    This is where we keep track of the GOPS (group-of-pictures)
    //    from previous fragments and attempt to find one that we can
    //    prepend to the current fragment in order to create a valid
    //    fragment.
    // 2) KEYFRAME-PULLING:
    //    Here we search for the first keyframe in the fragment and
    //    throw away all the frames between the start of the fragment
    //    and that keyframe. We then extend the duration and pull the
    //    PTS of the keyframe forward so that it covers the time range
    //    of the frames that were disposed of.
    //
    // #1 is far prefereable over #2 which can cause "stuttering" but
    // requires more things to be just right.
    if (!gops[0][0].keyFrame) {
      // Search for a gop for fusion from our gopCache
      gopForFusion = this.getGopForFusion_(nalUnits[0], track);

      if (gopForFusion) {
        // in order to provide more accurate timing information about the segment, save
        // the number of seconds prepended to the original segment due to GOP fusion
        prependedContentDuration = gopForFusion.duration;

        gops.unshift(gopForFusion);
        // Adjust Gops' metadata to account for the inclusion of the
        // new gop at the beginning
        gops.byteLength += gopForFusion.byteLength;
        gops.nalCount += gopForFusion.nalCount;
        gops.pts = gopForFusion.pts;
        gops.dts = gopForFusion.dts;
        gops.duration += gopForFusion.duration;
      } else {
        // If we didn't find a candidate gop fall back to keyframe-pulling
        gops = frameUtils.extendFirstKeyFrame(gops);
      }
    }

    // Trim gops to align with gopsToAlignWith
    if (gopsToAlignWith.length) {
      var alignedGops;

      if (options.alignGopsAtEnd) {
        alignedGops = this.alignGopsAtEnd_(gops);
      } else {
        alignedGops = this.alignGopsAtStart_(gops);
      }

      if (!alignedGops) {
        // save all the nals in the last GOP into the gop cache
        this.gopCache_.unshift({
          gop: gops.pop(),
          pps: track.pps,
          sps: track.sps
        });

        // Keep a maximum of 6 GOPs in the cache
        this.gopCache_.length = Math.min(6, this.gopCache_.length);

        // Clear nalUnits
        nalUnits = [];

        // return early no gops can be aligned with desired gopsToAlignWith
        this.resetStream_();
        this.trigger('done', 'VideoSegmentStream');
        return;
      }

      // Some gops were trimmed. clear dts info so minSegmentDts and pts are correct
      // when recalculated before sending off to CoalesceStream
      trackDecodeInfo.clearDtsInfo(track);

      gops = alignedGops;
    }

    trackDecodeInfo.collectDtsInfo(track, gops);

    // First, we have to build the index from byte locations to
    // samples (that is, frames) in the video data
    track.samples = frameUtils.generateSampleTable(gops);

    // Concatenate the video data and construct the mdat
    mdat = mp4.mdat(frameUtils.concatenateNalData(gops));

    track.baseMediaDecodeTime = trackDecodeInfo.calculateTrackBaseMediaDecodeTime(
      track, options.keepOriginalTimestamps);

    this.trigger('processedGopsInfo', gops.map(function(gop) {
      return {
        pts: gop.pts,
        dts: gop.dts,
        byteLength: gop.byteLength
      };
    }));

    firstGop = gops[0];
    lastGop = gops[gops.length - 1];

    this.trigger(
      'segmentTimingInfo',
      generateVideoSegmentTimingInfo(
        track.baseMediaDecodeTime,
        firstGop.dts,
        firstGop.pts,
        lastGop.dts + lastGop.duration,
        lastGop.pts + lastGop.duration,
        prependedContentDuration));

    this.trigger('timingInfo', {
      start: gops[0].pts,
      end: gops[gops.length - 1].pts + gops[gops.length - 1].duration
    });

    // save all the nals in the last GOP into the gop cache
    this.gopCache_.unshift({
      gop: gops.pop(),
      pps: track.pps,
      sps: track.sps
    });

    // Keep a maximum of 6 GOPs in the cache
    this.gopCache_.length = Math.min(6, this.gopCache_.length);

    // Clear nalUnits
    nalUnits = [];

    this.trigger('baseMediaDecodeTime', track.baseMediaDecodeTime);
    this.trigger('timelineStartInfo', track.timelineStartInfo);

    moof = mp4.moof(sequenceNumber, [track]);

    // it would be great to allocate this array up front instead of
    // throwing away hundreds of media segment fragments
    boxes = new Uint8Array(moof.byteLength + mdat.byteLength);

    // Bump the sequence number for next time
    sequenceNumber++;

    boxes.set(moof);
    boxes.set(mdat, moof.byteLength);

    this.trigger('data', {track: track, boxes: boxes});

    this.resetStream_();

    // Continue with the flush process now
    this.trigger('done', 'VideoSegmentStream');
  };

  this.reset = function() {
    this.resetStream_();
    nalUnits = [];
    this.gopCache_.length = 0;
    gopsToAlignWith.length = 0;
    this.trigger('reset');
  };

  this.resetStream_ = function() {
    trackDecodeInfo.clearDtsInfo(track);

    // reset config and pps because they may differ across segments
    // for instance, when we are rendition switching
    config = undefined;
    pps = undefined;
  };

  // Search for a candidate Gop for gop-fusion from the gop cache and
  // return it or return null if no good candidate was found
  this.getGopForFusion_ = function(nalUnit) {
    var
      halfSecond = 45000, // Half-a-second in a 90khz clock
      allowableOverlap = 10000, // About 3 frames @ 30fps
      nearestDistance = Infinity,
      dtsDistance,
      nearestGopObj,
      currentGop,
      currentGopObj,
      i;

    // Search for the GOP nearest to the beginning of this nal unit
    for (i = 0; i < this.gopCache_.length; i++) {
      currentGopObj = this.gopCache_[i];
      currentGop = currentGopObj.gop;

      // Reject Gops with different SPS or PPS
      if (!(track.pps && arrayEquals(track.pps[0], currentGopObj.pps[0])) ||
          !(track.sps && arrayEquals(track.sps[0], currentGopObj.sps[0]))) {
        continue;
      }

      // Reject Gops that would require a negative baseMediaDecodeTime
      if (currentGop.dts < track.timelineStartInfo.dts) {
        continue;
      }

      // The distance between the end of the gop and the start of the nalUnit
      dtsDistance = (nalUnit.dts - currentGop.dts) - currentGop.duration;

      // Only consider GOPS that start before the nal unit and end within
      // a half-second of the nal unit
      if (dtsDistance >= -allowableOverlap &&
          dtsDistance <= halfSecond) {

        // Always use the closest GOP we found if there is more than
        // one candidate
        if (!nearestGopObj ||
            nearestDistance > dtsDistance) {
          nearestGopObj = currentGopObj;
          nearestDistance = dtsDistance;
        }
      }
    }

    if (nearestGopObj) {
      return nearestGopObj.gop;
    }
    return null;
  };

  // trim gop list to the first gop found that has a matching pts with a gop in the list
  // of gopsToAlignWith starting from the START of the list
  this.alignGopsAtStart_ = function(gops) {
    var alignIndex, gopIndex, align, gop, byteLength, nalCount, duration, alignedGops;

    byteLength = gops.byteLength;
    nalCount = gops.nalCount;
    duration = gops.duration;
    alignIndex = gopIndex = 0;

    while (alignIndex < gopsToAlignWith.length && gopIndex < gops.length) {
      align = gopsToAlignWith[alignIndex];
      gop = gops[gopIndex];

      if (align.pts === gop.pts) {
        break;
      }

      if (gop.pts > align.pts) {
        // this current gop starts after the current gop we want to align on, so increment
        // align index
        alignIndex++;
        continue;
      }

      // current gop starts before the current gop we want to align on. so increment gop
      // index
      gopIndex++;
      byteLength -= gop.byteLength;
      nalCount -= gop.nalCount;
      duration -= gop.duration;
    }

    if (gopIndex === 0) {
      // no gops to trim
      return gops;
    }

    if (gopIndex === gops.length) {
      // all gops trimmed, skip appending all gops
      return null;
    }

    alignedGops = gops.slice(gopIndex);
    alignedGops.byteLength = byteLength;
    alignedGops.duration = duration;
    alignedGops.nalCount = nalCount;
    alignedGops.pts = alignedGops[0].pts;
    alignedGops.dts = alignedGops[0].dts;

    return alignedGops;
  };

  // trim gop list to the first gop found that has a matching pts with a gop in the list
  // of gopsToAlignWith starting from the END of the list
  this.alignGopsAtEnd_ = function(gops) {
    var alignIndex, gopIndex, align, gop, alignEndIndex, matchFound;

    alignIndex = gopsToAlignWith.length - 1;
    gopIndex = gops.length - 1;
    alignEndIndex = null;
    matchFound = false;

    while (alignIndex >= 0 && gopIndex >= 0) {
      align = gopsToAlignWith[alignIndex];
      gop = gops[gopIndex];

      if (align.pts === gop.pts) {
        matchFound = true;
        break;
      }

      if (align.pts > gop.pts) {
        alignIndex--;
        continue;
      }

      if (alignIndex === gopsToAlignWith.length - 1) {
        // gop.pts is greater than the last alignment candidate. If no match is found
        // by the end of this loop, we still want to append gops that come after this
        // point
        alignEndIndex = gopIndex;
      }

      gopIndex--;
    }

    if (!matchFound && alignEndIndex === null) {
      return null;
    }

    var trimIndex;

    if (matchFound) {
      trimIndex = gopIndex;
    } else {
      trimIndex = alignEndIndex;
    }

    if (trimIndex === 0) {
      return gops;
    }

    var alignedGops = gops.slice(trimIndex);
    var metadata = alignedGops.reduce(function(total, gop) {
      total.byteLength += gop.byteLength;
      total.duration += gop.duration;
      total.nalCount += gop.nalCount;
      return total;
    }, { byteLength: 0, duration: 0, nalCount: 0 });

    alignedGops.byteLength = metadata.byteLength;
    alignedGops.duration = metadata.duration;
    alignedGops.nalCount = metadata.nalCount;
    alignedGops.pts = alignedGops[0].pts;
    alignedGops.dts = alignedGops[0].dts;

    return alignedGops;
  };

  this.alignGopsWith = function(newGopsToAlignWith) {
    gopsToAlignWith = newGopsToAlignWith;
  };
};

VideoSegmentStream.prototype = new Stream();

/**
 * A Stream that can combine multiple streams (ie. audio & video)
 * into a single output segment for MSE. Also supports audio-only
 * and video-only streams.
 * @param options {object} transmuxer options object
 * @param options.keepOriginalTimestamps {boolean} If true, keep the timestamps
 *        in the source; false to adjust the first segment to start at media timeline start.
 */
CoalesceStream = function(options, metadataStream) {
  // Number of Tracks per output segment
  // If greater than 1, we combine multiple
  // tracks into a single segment
  this.numberOfTracks = 0;
  this.metadataStream = metadataStream;

  options = options || {};

  if (typeof options.remux !== 'undefined') {
    this.remuxTracks = !!options.remux;
  } else {
    this.remuxTracks = true;
  }

  if (typeof options.keepOriginalTimestamps === 'boolean') {
    this.keepOriginalTimestamps = options.keepOriginalTimestamps;
  } else {
    this.keepOriginalTimestamps = false;
  }

  this.pendingTracks = [];
  this.videoTrack = null;
  this.pendingBoxes = [];
  this.pendingCaptions = [];
  this.pendingMetadata = [];
  this.pendingBytes = 0;
  this.emittedTracks = 0;

  CoalesceStream.prototype.init.call(this);

  // Take output from multiple
  this.push = function(output) {
    // buffer incoming captions until the associated video segment
    // finishes
    if (output.text) {
      return this.pendingCaptions.push(output);
    }
    // buffer incoming id3 tags until the final flush
    if (output.frames) {
      return this.pendingMetadata.push(output);
    }

    // Add this track to the list of pending tracks and store
    // important information required for the construction of
    // the final segment
    this.pendingTracks.push(output.track);
    this.pendingBytes += output.boxes.byteLength;

    // TODO: is there an issue for this against chrome?
    // We unshift audio and push video because
    // as of Chrome 75 when switching from
    // one init segment to another if the video
    // mdat does not appear after the audio mdat
    // only audio will play for the duration of our transmux.
    if (output.track.type === 'video') {
      this.videoTrack = output.track;
      this.pendingBoxes.push(output.boxes);
    }
    if (output.track.type === 'audio') {
      this.audioTrack = output.track;
      this.pendingBoxes.unshift(output.boxes);
    }
  };
};

CoalesceStream.prototype = new Stream();
CoalesceStream.prototype.flush = function(flushSource) {
  var
    offset = 0,
    event = {
      captions: [],
      captionStreams: {},
      metadata: [],
      info: {}
    },
    caption,
    id3,
    initSegment,
    timelineStartPts = 0,
    i;

  if (this.pendingTracks.length < this.numberOfTracks) {
    if (flushSource !== 'VideoSegmentStream' &&
        flushSource !== 'AudioSegmentStream') {
      // Return because we haven't received a flush from a data-generating
      // portion of the segment (meaning that we have only recieved meta-data
      // or captions.)
      return;
    } else if (this.remuxTracks) {
      // Return until we have enough tracks from the pipeline to remux (if we
      // are remuxing audio and video into a single MP4)
      return;
    } else if (this.pendingTracks.length === 0) {
      // In the case where we receive a flush without any data having been
      // received we consider it an emitted track for the purposes of coalescing
      // `done` events.
      // We do this for the case where there is an audio and video track in the
      // segment but no audio data. (seen in several playlists with alternate
      // audio tracks and no audio present in the main TS segments.)
      this.emittedTracks++;

      if (this.emittedTracks >= this.numberOfTracks) {
        this.trigger('done');
        this.emittedTracks = 0;
      }
      return;
    }
  }

  if (this.videoTrack) {
    timelineStartPts = this.videoTrack.timelineStartInfo.pts;
    VIDEO_PROPERTIES.forEach(function(prop) {
      event.info[prop] = this.videoTrack[prop];
    }, this);
  } else if (this.audioTrack) {
    timelineStartPts = this.audioTrack.timelineStartInfo.pts;
    AUDIO_PROPERTIES.forEach(function(prop) {
      event.info[prop] = this.audioTrack[prop];
    }, this);
  }

  if (this.videoTrack || this.audioTrack) {
    if (this.pendingTracks.length === 1) {
      event.type = this.pendingTracks[0].type;
    } else {
      event.type = 'combined';
    }

    this.emittedTracks += this.pendingTracks.length;

    initSegment = mp4.initSegment(this.pendingTracks);

    // Create a new typed array to hold the init segment
    event.initSegment = new Uint8Array(initSegment.byteLength);

    // Create an init segment containing a moov
    // and track definitions
    event.initSegment.set(initSegment);

    // Create a new typed array to hold the moof+mdats
    event.data = new Uint8Array(this.pendingBytes);

    // Append each moof+mdat (one per track) together
    for (i = 0; i < this.pendingBoxes.length; i++) {
      event.data.set(this.pendingBoxes[i], offset);
      offset += this.pendingBoxes[i].byteLength;
    }

    // Translate caption PTS times into second offsets to match the
    // video timeline for the segment, and add track info
    for (i = 0; i < this.pendingCaptions.length; i++) {
      caption = this.pendingCaptions[i];
      caption.startTime = clock.metadataTsToSeconds(
        caption.startPts, timelineStartPts, this.keepOriginalTimestamps);
      caption.endTime = clock.metadataTsToSeconds(
        caption.endPts, timelineStartPts, this.keepOriginalTimestamps);

      event.captionStreams[caption.stream] = true;
      event.captions.push(caption);
    }

    // Translate ID3 frame PTS times into second offsets to match the
    // video timeline for the segment
    for (i = 0; i < this.pendingMetadata.length; i++) {
      id3 = this.pendingMetadata[i];
      id3.cueTime = clock.metadataTsToSeconds(
        id3.pts, timelineStartPts, this.keepOriginalTimestamps);

      event.metadata.push(id3);
    }

    // We add this to every single emitted segment even though we only need
    // it for the first
    event.metadata.dispatchType = this.metadataStream.dispatchType;

    // Reset stream state
    this.pendingTracks.length = 0;
    this.videoTrack = null;
    this.pendingBoxes.length = 0;
    this.pendingCaptions.length = 0;
    this.pendingBytes = 0;
    this.pendingMetadata.length = 0;

    // Emit the built segment
    // We include captions and ID3 tags for backwards compatibility,
    // ideally we should send only video and audio in the data event
    this.trigger('data', event);
    // Emit each caption to the outside world
    // Ideally, this would happen immediately on parsing captions,
    // but we need to ensure that video data is sent back first
    // so that caption timing can be adjusted to match video timing
    for (i = 0; i < event.captions.length; i++) {
      caption = event.captions[i];

      this.trigger('caption', caption);
    }
    // Emit each id3 tag to the outside world
    // Ideally, this would happen immediately on parsing the tag,
    // but we need to ensure that video data is sent back first
    // so that ID3 frame timing can be adjusted to match video timing
    for (i = 0; i < event.metadata.length; i++) {
      id3 = event.metadata[i];

      this.trigger('id3Frame', id3);
    }
  }

  // Only emit `done` if all tracks have been flushed and emitted
  if (this.emittedTracks >= this.numberOfTracks) {
    this.trigger('done');
    this.emittedTracks = 0;
  }
};

CoalesceStream.prototype.setRemux = function(val) {
  this.remuxTracks = val;
};
/**
 * A Stream that expects MP2T binary data as input and produces
 * corresponding media segments, suitable for use with Media Source
 * Extension (MSE) implementations that support the ISO BMFF byte
 * stream format, like Chrome.
 */
Transmuxer = function(options) {
  var
    self = this,
    hasFlushed = true,
    videoTrack,
    audioTrack;

  Transmuxer.prototype.init.call(this);

  options = options || {};
  this.baseMediaDecodeTime = options.baseMediaDecodeTime || 0;
  this.transmuxPipeline_ = {};

  this.setupAacPipeline = function() {
    var pipeline = {};
    this.transmuxPipeline_ = pipeline;

    pipeline.type = 'aac';
    pipeline.metadataStream = new m2ts.MetadataStream();

    // set up the parsing pipeline
    pipeline.aacStream = new AacStream();
    pipeline.audioTimestampRolloverStream = new m2ts.TimestampRolloverStream('audio');
    pipeline.timedMetadataTimestampRolloverStream = new m2ts.TimestampRolloverStream('timed-metadata');
    pipeline.adtsStream = new AdtsStream();
    pipeline.coalesceStream = new CoalesceStream(options, pipeline.metadataStream);
    pipeline.headOfPipeline = pipeline.aacStream;

    pipeline.aacStream
      .pipe(pipeline.audioTimestampRolloverStream)
      .pipe(pipeline.adtsStream);
    pipeline.aacStream
      .pipe(pipeline.timedMetadataTimestampRolloverStream)
      .pipe(pipeline.metadataStream)
      .pipe(pipeline.coalesceStream);

    pipeline.metadataStream.on('timestamp', function(frame) {
      pipeline.aacStream.setTimestamp(frame.timeStamp);
    });

    pipeline.aacStream.on('data', function(data) {
      if ((data.type !== 'timed-metadata' && data.type !== 'audio') || pipeline.audioSegmentStream) {
        return;
      }

      audioTrack = audioTrack || {
        timelineStartInfo: {
          baseMediaDecodeTime: self.baseMediaDecodeTime
        },
        codec: 'adts',
        type: 'audio'
      };
      // hook up the audio segment stream to the first track with aac data
      pipeline.coalesceStream.numberOfTracks++;
      pipeline.audioSegmentStream = new AudioSegmentStream(audioTrack, options);

      pipeline.audioSegmentStream.on('timingInfo',
        self.trigger.bind(self, 'audioTimingInfo'));

      // Set up the final part of the audio pipeline
      pipeline.adtsStream
        .pipe(pipeline.audioSegmentStream)
        .pipe(pipeline.coalesceStream);

      // emit pmt info
      self.trigger('trackinfo', {
        hasAudio: !!audioTrack,
        hasVideo: !!videoTrack
      });
    });

    // Re-emit any data coming from the coalesce stream to the outside world
    pipeline.coalesceStream.on('data', this.trigger.bind(this, 'data'));
    // Let the consumer know we have finished flushing the entire pipeline
    pipeline.coalesceStream.on('done', this.trigger.bind(this, 'done'));
  };

  this.setupTsPipeline = function() {
    var pipeline = {};
    this.transmuxPipeline_ = pipeline;

    pipeline.type = 'ts';
    pipeline.metadataStream = new m2ts.MetadataStream();

    // set up the parsing pipeline
    pipeline.packetStream = new m2ts.TransportPacketStream();
    pipeline.parseStream = new m2ts.TransportParseStream();
    pipeline.elementaryStream = new m2ts.ElementaryStream();
    pipeline.timestampRolloverStream = new m2ts.TimestampRolloverStream();
    pipeline.adtsStream = new AdtsStream();
    pipeline.h264Stream = new H264Stream();
    pipeline.captionStream = new m2ts.CaptionStream();
    pipeline.coalesceStream = new CoalesceStream(options, pipeline.metadataStream);
    pipeline.headOfPipeline = pipeline.packetStream;

    // disassemble MPEG2-TS packets into elementary streams
    pipeline.packetStream
      .pipe(pipeline.parseStream)
      .pipe(pipeline.elementaryStream)
      .pipe(pipeline.timestampRolloverStream);

    // !!THIS ORDER IS IMPORTANT!!
    // demux the streams
    pipeline.timestampRolloverStream
      .pipe(pipeline.h264Stream);

    pipeline.timestampRolloverStream
      .pipe(pipeline.adtsStream);

    pipeline.timestampRolloverStream
      .pipe(pipeline.metadataStream)
      .pipe(pipeline.coalesceStream);

    // Hook up CEA-608/708 caption stream
    pipeline.h264Stream.pipe(pipeline.captionStream)
      .pipe(pipeline.coalesceStream);

    pipeline.elementaryStream.on('data', function(data) {
      var i;

      if (data.type === 'metadata') {
        i = data.tracks.length;

        // scan the tracks listed in the metadata
        while (i--) {
          if (!videoTrack && data.tracks[i].type === 'video') {
            videoTrack = data.tracks[i];
            videoTrack.timelineStartInfo.baseMediaDecodeTime = self.baseMediaDecodeTime;
          } else if (!audioTrack && data.tracks[i].type === 'audio') {
            audioTrack = data.tracks[i];
            audioTrack.timelineStartInfo.baseMediaDecodeTime = self.baseMediaDecodeTime;
          }
        }

        // hook up the video segment stream to the first track with h264 data
        if (videoTrack && !pipeline.videoSegmentStream) {
          pipeline.coalesceStream.numberOfTracks++;
          pipeline.videoSegmentStream = new VideoSegmentStream(videoTrack, options);

          pipeline.videoSegmentStream.on('timelineStartInfo', function(timelineStartInfo) {
            // When video emits timelineStartInfo data after a flush, we forward that
            // info to the AudioSegmentStream, if it exists, because video timeline
            // data takes precedence.  Do not do this if keepOriginalTimestamps is set,
            // because this is a particularly subtle form of timestamp alteration.
            if (audioTrack && !options.keepOriginalTimestamps) {
              audioTrack.timelineStartInfo = timelineStartInfo;
              // On the first segment we trim AAC frames that exist before the
              // very earliest DTS we have seen in video because Chrome will
              // interpret any video track with a baseMediaDecodeTime that is
              // non-zero as a gap.
              pipeline.audioSegmentStream.setEarliestDts(timelineStartInfo.dts - self.baseMediaDecodeTime);
            }
          });

          pipeline.videoSegmentStream.on('processedGopsInfo',
            self.trigger.bind(self, 'gopInfo'));
          pipeline.videoSegmentStream.on('segmentTimingInfo',
            self.trigger.bind(self, 'videoSegmentTimingInfo'));

          pipeline.videoSegmentStream.on('baseMediaDecodeTime', function(baseMediaDecodeTime) {
            if (audioTrack) {
              pipeline.audioSegmentStream.setVideoBaseMediaDecodeTime(baseMediaDecodeTime);
            }
          });

          pipeline.videoSegmentStream.on('timingInfo',
            self.trigger.bind(self, 'videoTimingInfo'));

          // Set up the final part of the video pipeline
          pipeline.h264Stream
            .pipe(pipeline.videoSegmentStream)
            .pipe(pipeline.coalesceStream);
        }

        if (audioTrack && !pipeline.audioSegmentStream) {
          // hook up the audio segment stream to the first track with aac data
          pipeline.coalesceStream.numberOfTracks++;
          pipeline.audioSegmentStream = new AudioSegmentStream(audioTrack, options);

          pipeline.audioSegmentStream.on('timingInfo',
            self.trigger.bind(self, 'audioTimingInfo'));

          // Set up the final part of the audio pipeline
          pipeline.adtsStream
            .pipe(pipeline.audioSegmentStream)
            .pipe(pipeline.coalesceStream);
        }

        // emit pmt info
        self.trigger('trackinfo', {
          hasAudio: !!audioTrack,
          hasVideo: !!videoTrack
        });
      }
    });

    // Re-emit any data coming from the coalesce stream to the outside world
    pipeline.coalesceStream.on('data', this.trigger.bind(this, 'data'));
    pipeline.coalesceStream.on('id3Frame', function(id3Frame) {
      id3Frame.dispatchType = pipeline.metadataStream.dispatchType;

      self.trigger('id3Frame', id3Frame);
    });
    pipeline.coalesceStream.on('caption', this.trigger.bind(this, 'caption'));
    // Let the consumer know we have finished flushing the entire pipeline
    pipeline.coalesceStream.on('done', this.trigger.bind(this, 'done'));
  };

  // hook up the segment streams once track metadata is delivered
  this.setBaseMediaDecodeTime = function(baseMediaDecodeTime) {
    var pipeline = this.transmuxPipeline_;

    if (!options.keepOriginalTimestamps) {
      this.baseMediaDecodeTime = baseMediaDecodeTime;
    }

    if (audioTrack) {
      audioTrack.timelineStartInfo.dts = undefined;
      audioTrack.timelineStartInfo.pts = undefined;
      trackDecodeInfo.clearDtsInfo(audioTrack);
      if (pipeline.audioTimestampRolloverStream) {
        pipeline.audioTimestampRolloverStream.discontinuity();
      }
    }
    if (videoTrack) {
      if (pipeline.videoSegmentStream) {
        pipeline.videoSegmentStream.gopCache_ = [];
      }
      videoTrack.timelineStartInfo.dts = undefined;
      videoTrack.timelineStartInfo.pts = undefined;
      trackDecodeInfo.clearDtsInfo(videoTrack);
      pipeline.captionStream.reset();
    }

    if (pipeline.timestampRolloverStream) {
      pipeline.timestampRolloverStream.discontinuity();
    }
  };

  this.setAudioAppendStart = function(timestamp) {
    if (audioTrack) {
      this.transmuxPipeline_.audioSegmentStream.setAudioAppendStart(timestamp);
    }
  };

  this.setRemux = function(val) {
    var pipeline = this.transmuxPipeline_;

    options.remux = val;

    if (pipeline && pipeline.coalesceStream) {
      pipeline.coalesceStream.setRemux(val);
    }
  };

  this.alignGopsWith = function(gopsToAlignWith) {
    if (videoTrack && this.transmuxPipeline_.videoSegmentStream) {
      this.transmuxPipeline_.videoSegmentStream.alignGopsWith(gopsToAlignWith);
    }
  };

  // feed incoming data to the front of the parsing pipeline
  this.push = function(data) {
    if (hasFlushed) {
      var isAac = isLikelyAacData(data);

      if (isAac && this.transmuxPipeline_.type !== 'aac') {
        this.setupAacPipeline();
      } else if (!isAac && this.transmuxPipeline_.type !== 'ts') {
        this.setupTsPipeline();
      }
      hasFlushed = false;
    }
    this.transmuxPipeline_.headOfPipeline.push(data);
  };

  // flush any buffered data
  this.flush = function() {
    hasFlushed = true;
    // Start at the top of the pipeline and flush all pending work
    this.transmuxPipeline_.headOfPipeline.flush();
  };

  this.endTimeline = function() {
    this.transmuxPipeline_.headOfPipeline.endTimeline();
  };

  this.reset = function() {
    if (this.transmuxPipeline_.headOfPipeline) {
      this.transmuxPipeline_.headOfPipeline.reset();
    }
  };

  // Caption data has to be reset when seeking outside buffered range
  this.resetCaptions = function() {
    if (this.transmuxPipeline_.captionStream) {
      this.transmuxPipeline_.captionStream.reset();
    }
  };

};
Transmuxer.prototype = new Stream();

module.exports = {
  Transmuxer: Transmuxer,
  VideoSegmentStream: VideoSegmentStream,
  AudioSegmentStream: AudioSegmentStream,
  AUDIO_PROPERTIES: AUDIO_PROPERTIES,
  VIDEO_PROPERTIES: VIDEO_PROPERTIES,
  // exported for testing
  generateVideoSegmentTimingInfo: generateVideoSegmentTimingInfo
};

},{"../aac":2,"../aac/utils":3,"../codecs/adts.js":4,"../codecs/h264":5,"../constants/audio-properties.js":7,"../constants/video-properties.js":8,"../m2ts/m2ts.js":19,"../utils/clock":48,"../utils/stream.js":50,"./audio-frame-utils":24,"./frame-utils":27,"./mp4-generator.js":29,"./track-decode-info":32}],34:[function(require,module,exports){
'use strict';

var Stream = require('../utils/stream.js');
var mp4 = require('../mp4/mp4-generator.js');
var audioFrameUtils = require('../mp4/audio-frame-utils');
var trackInfo = require('../mp4/track-decode-info.js');
var ONE_SECOND_IN_TS = require('../utils/clock').ONE_SECOND_IN_TS;
var AUDIO_PROPERTIES = require('../constants/audio-properties.js');

/**
 * Constructs a single-track, ISO BMFF media segment from AAC data
 * events. The output of this stream can be fed to a SourceBuffer
 * configured with a suitable initialization segment.
 */
var AudioSegmentStream = function(track, options) {
  var
    adtsFrames = [],
    sequenceNumber = 0,
    earliestAllowedDts = 0,
    audioAppendStartTs = 0,
    videoBaseMediaDecodeTime = Infinity,
    segmentStartPts = null,
    segmentEndPts = null;

  options = options || {};

  AudioSegmentStream.prototype.init.call(this);

  this.push = function(data) {
    trackInfo.collectDtsInfo(track, data);

    if (track) {
      AUDIO_PROPERTIES.forEach(function(prop) {
        track[prop] = data[prop];
      });
    }

    // buffer audio data until end() is called
    adtsFrames.push(data);
  };

  this.setEarliestDts = function(earliestDts) {
    earliestAllowedDts = earliestDts;
  };

  this.setVideoBaseMediaDecodeTime = function(baseMediaDecodeTime) {
    videoBaseMediaDecodeTime = baseMediaDecodeTime;
  };

  this.setAudioAppendStart = function(timestamp) {
    audioAppendStartTs = timestamp;
  };

  this.processFrames_ = function() {
    var
      frames,
      moof,
      mdat,
      boxes,
      timingInfo;

    // return early if no audio data has been observed
    if (adtsFrames.length === 0) {
      return;
    }

    frames = audioFrameUtils.trimAdtsFramesByEarliestDts(
      adtsFrames, track, earliestAllowedDts);
    if (frames.length === 0) {
      // return early if the frames are all after the earliest allowed DTS
      // TODO should we clear the adtsFrames?
      return;
    }

    track.baseMediaDecodeTime = trackInfo.calculateTrackBaseMediaDecodeTime(
      track, options.keepOriginalTimestamps);

    audioFrameUtils.prefixWithSilence(
      track, frames, audioAppendStartTs, videoBaseMediaDecodeTime);

    // we have to build the index from byte locations to
    // samples (that is, adts frames) in the audio data
    track.samples = audioFrameUtils.generateSampleTable(frames);

    // concatenate the audio data to constuct the mdat
    mdat = mp4.mdat(audioFrameUtils.concatenateFrameData(frames));

    adtsFrames = [];

    moof = mp4.moof(sequenceNumber, [track]);

    // bump the sequence number for next time
    sequenceNumber++;

    track.initSegment = mp4.initSegment([track]);

    // it would be great to allocate this array up front instead of
    // throwing away hundreds of media segment fragments
    boxes = new Uint8Array(moof.byteLength + mdat.byteLength);

    boxes.set(moof);
    boxes.set(mdat, moof.byteLength);

    trackInfo.clearDtsInfo(track);

    if (segmentStartPts === null) {
      segmentEndPts = segmentStartPts = frames[0].pts;
    }

    segmentEndPts += frames.length * (ONE_SECOND_IN_TS * 1024 / track.samplerate);

    timingInfo = { start: segmentStartPts };

    this.trigger('timingInfo', timingInfo);
    this.trigger('data', {track: track, boxes: boxes});
  };

  this.flush = function() {
    this.processFrames_();
    // trigger final timing info
    this.trigger('timingInfo', {
      start: segmentStartPts,
      end: segmentEndPts
    });
    this.resetTiming_();
    this.trigger('done', 'AudioSegmentStream');
  };

  this.partialFlush = function() {
    this.processFrames_();
    this.trigger('partialdone', 'AudioSegmentStream');
  };

  this.endTimeline = function() {
    this.flush();
    this.trigger('endedtimeline', 'AudioSegmentStream');
  };

  this.resetTiming_ = function() {
    trackInfo.clearDtsInfo(track);
    segmentStartPts = null;
    segmentEndPts = null;
  };

  this.reset = function() {
    this.resetTiming_();
    adtsFrames = [];
    this.trigger('reset');
  };
};

AudioSegmentStream.prototype = new Stream();

module.exports = AudioSegmentStream;

},{"../constants/audio-properties.js":7,"../mp4/audio-frame-utils":24,"../mp4/mp4-generator.js":29,"../mp4/track-decode-info.js":32,"../utils/clock":48,"../utils/stream.js":50}],35:[function(require,module,exports){
module.exports = {
  Transmuxer: require('./transmuxer')
};

},{"./transmuxer":36}],36:[function(require,module,exports){
var Stream = require('../utils/stream.js');
var m2ts = require('../m2ts/m2ts.js');
var codecs = require('../codecs/index.js');
var AudioSegmentStream = require('./audio-segment-stream.js');
var VideoSegmentStream = require('./video-segment-stream.js');
var trackInfo = require('../mp4/track-decode-info.js');
var isLikelyAacData = require('../aac/utils').isLikelyAacData;
var AdtsStream = require('../codecs/adts');
var AacStream = require('../aac/index');
var clock = require('../utils/clock');

var createPipeline = function(object) {
  object.prototype = new Stream();
  object.prototype.init.call(object);

  return object;
};

var tsPipeline = function(options) {
  var
    pipeline = {
      type: 'ts',
      tracks: {
        audio: null,
        video: null
      },
      packet: new m2ts.TransportPacketStream(),
      parse: new m2ts.TransportParseStream(),
      elementary: new m2ts.ElementaryStream(),
      timestampRollover: new m2ts.TimestampRolloverStream(),
      adts: new codecs.Adts(),
      h264: new codecs.h264.H264Stream(),
      captionStream: new m2ts.CaptionStream(),
      metadataStream: new m2ts.MetadataStream()
  };

  pipeline.headOfPipeline = pipeline.packet;

  // Transport Stream
  pipeline.packet
    .pipe(pipeline.parse)
    .pipe(pipeline.elementary)
    .pipe(pipeline.timestampRollover);

  // H264
  pipeline.timestampRollover
    .pipe(pipeline.h264);

  // Hook up CEA-608/708 caption stream
  pipeline.h264
    .pipe(pipeline.captionStream);

  pipeline.timestampRollover
    .pipe(pipeline.metadataStream);

  // ADTS
  pipeline.timestampRollover
    .pipe(pipeline.adts);

  pipeline.elementary.on('data', function(data) {
    if (data.type !== 'metadata') {
      return;
    }

    for (var i = 0; i < data.tracks.length; i++) {
      if (!pipeline.tracks[data.tracks[i].type]) {
        pipeline.tracks[data.tracks[i].type] = data.tracks[i];
        pipeline.tracks[data.tracks[i].type].timelineStartInfo.baseMediaDecodeTime = options.baseMediaDecodeTime;
      }
    }

    if (pipeline.tracks.video && !pipeline.videoSegmentStream) {
      pipeline.videoSegmentStream = new VideoSegmentStream(pipeline.tracks.video, options);

      pipeline.videoSegmentStream.on('timelineStartInfo', function(timelineStartInfo) {
        if (pipeline.tracks.audio && !options.keepOriginalTimestamps) {
          pipeline.audioSegmentStream.setEarliestDts(timelineStartInfo.dts - options.baseMediaDecodeTime);
        }
      });

      pipeline.videoSegmentStream.on('timingInfo',
                                     pipeline.trigger.bind(pipeline, 'videoTimingInfo'));

      pipeline.videoSegmentStream.on('data', function(data) {
        pipeline.trigger('data', {
          type: 'video',
          data: data
        });
      });

      pipeline.videoSegmentStream.on('done',
                                     pipeline.trigger.bind(pipeline, 'done'));
      pipeline.videoSegmentStream.on('partialdone',
                                     pipeline.trigger.bind(pipeline, 'partialdone'));
      pipeline.videoSegmentStream.on('endedtimeline',
                                     pipeline.trigger.bind(pipeline, 'endedtimeline'));

      pipeline.h264
        .pipe(pipeline.videoSegmentStream);
    }

    if (pipeline.tracks.audio && !pipeline.audioSegmentStream) {
      pipeline.audioSegmentStream = new AudioSegmentStream(pipeline.tracks.audio, options);

      pipeline.audioSegmentStream.on('data', function(data) {
        pipeline.trigger('data', {
          type: 'audio',
          data: data
        });
      });

      pipeline.audioSegmentStream.on('done',
                                     pipeline.trigger.bind(pipeline, 'done'));
      pipeline.audioSegmentStream.on('partialdone',
                                     pipeline.trigger.bind(pipeline, 'partialdone'));
      pipeline.audioSegmentStream.on('endedtimeline',
                                     pipeline.trigger.bind(pipeline, 'endedtimeline'));

      pipeline.audioSegmentStream.on('timingInfo',
                                     pipeline.trigger.bind(pipeline, 'audioTimingInfo'));

      pipeline.adts
        .pipe(pipeline.audioSegmentStream);
    }

    // emit pmt info
    pipeline.trigger('trackinfo', {
      hasAudio: !!pipeline.tracks.audio,
      hasVideo: !!pipeline.tracks.video
    });
  });

  pipeline.captionStream.on('data', function(caption) {
    var timelineStartPts;

    if (pipeline.tracks.video) {
      timelineStartPts = pipeline.tracks.video.timelineStartInfo.pts || 0;
    } else {
      // This will only happen if we encounter caption packets before
      // video data in a segment. This is an unusual/unlikely scenario,
      // so we assume the timeline starts at zero for now.
      timelineStartPts = 0;
    }

    // Translate caption PTS times into second offsets into the
    // video timeline for the segment
    caption.startTime = clock.metadataTsToSeconds(caption.startPts, timelineStartPts, options.keepOriginalTimestamps);
    caption.endTime = clock.metadataTsToSeconds(caption.endPts, timelineStartPts, options.keepOriginalTimestamps);

    pipeline.trigger('caption', caption);
  });

  pipeline = createPipeline(pipeline);

  pipeline.metadataStream.on('data', pipeline.trigger.bind(pipeline, 'id3Frame'));

  return pipeline;
};

var aacPipeline = function(options) {
  var
    pipeline = {
    type: 'aac',
    tracks: {
      audio: null
    },
    metadataStream: new m2ts.MetadataStream(),
    aacStream: new AacStream(),
    audioRollover: new m2ts.TimestampRolloverStream('audio'),
    timedMetadataRollover: new m2ts.TimestampRolloverStream('timed-metadata'),
    adtsStream: new AdtsStream(true)
  };

  // set up the parsing pipeline
  pipeline.headOfPipeline = pipeline.aacStream;

  pipeline.aacStream
    .pipe(pipeline.audioRollover)
    .pipe(pipeline.adtsStream);
  pipeline.aacStream
    .pipe(pipeline.timedMetadataRollover)
    .pipe(pipeline.metadataStream);

  pipeline.metadataStream.on('timestamp', function(frame) {
    pipeline.aacStream.setTimestamp(frame.timeStamp);
  });

  pipeline.aacStream.on('data', function(data) {
    if ((data.type !== 'timed-metadata' && data.type !== 'audio') || pipeline.audioSegmentStream) {
      return;
    }

    pipeline.tracks.audio = pipeline.tracks.audio || {
      timelineStartInfo: {
        baseMediaDecodeTime: options.baseMediaDecodeTime
      },
      codec: 'adts',
      type: 'audio'
    };

    // hook up the audio segment stream to the first track with aac data
    pipeline.audioSegmentStream = new AudioSegmentStream(pipeline.tracks.audio, options);

    pipeline.audioSegmentStream.on('data', function(data) {
      pipeline.trigger('data', {
        type: 'audio',
        data: data
      });
    });

    pipeline.audioSegmentStream.on('partialdone',
                                   pipeline.trigger.bind(pipeline, 'partialdone'));
    pipeline.audioSegmentStream.on('done', pipeline.trigger.bind(pipeline, 'done'));
    pipeline.audioSegmentStream.on('endedtimeline',
                                   pipeline.trigger.bind(pipeline, 'endedtimeline'));
    pipeline.audioSegmentStream.on('timingInfo',
                                   pipeline.trigger.bind(pipeline, 'audioTimingInfo'));

    // Set up the final part of the audio pipeline
    pipeline.adtsStream
      .pipe(pipeline.audioSegmentStream);

    pipeline.trigger('trackinfo', {
      hasAudio: !!pipeline.tracks.audio,
      hasVideo: !!pipeline.tracks.video
    });
  });

  // set the pipeline up as a stream before binding to get access to the trigger function
  pipeline = createPipeline(pipeline);

  pipeline.metadataStream.on('data', pipeline.trigger.bind(pipeline, 'id3Frame'));

  return pipeline;
};

var setupPipelineListeners = function(pipeline, transmuxer) {
  pipeline.on('data', transmuxer.trigger.bind(transmuxer, 'data'));
  pipeline.on('done', transmuxer.trigger.bind(transmuxer, 'done'));
  pipeline.on('partialdone', transmuxer.trigger.bind(transmuxer, 'partialdone'));
  pipeline.on('endedtimeline', transmuxer.trigger.bind(transmuxer, 'endedtimeline'));
  pipeline.on('audioTimingInfo', transmuxer.trigger.bind(transmuxer, 'audioTimingInfo'));
  pipeline.on('videoTimingInfo', transmuxer.trigger.bind(transmuxer, 'videoTimingInfo'));
  pipeline.on('trackinfo', transmuxer.trigger.bind(transmuxer, 'trackinfo'));
  pipeline.on('id3Frame', function(event) {
    // add this to every single emitted segment even though it's only needed for the first
    event.dispatchType = pipeline.metadataStream.dispatchType;
    // keep original time, can be adjusted if needed at a higher level
    event.cueTime = clock.videoTsToSeconds(event.pts);

    transmuxer.trigger('id3Frame', event);
  });
  pipeline.on('caption', function(event) {
    transmuxer.trigger('caption', event);
  });
};

var Transmuxer = function(options) {
  var
    pipeline = null,
    hasFlushed = true;

  options = options || {};

  Transmuxer.prototype.init.call(this);
  options.baseMediaDecodeTime = options.baseMediaDecodeTime || 0;

  this.push = function(bytes) {
    if (hasFlushed) {
      var isAac = isLikelyAacData(bytes);

      if (isAac && (!pipeline || pipeline.type !== 'aac')) {
        pipeline = aacPipeline(options);
        setupPipelineListeners(pipeline, this);
      } else if (!isAac && (!pipeline || pipeline.type !== 'ts')) {
        pipeline = tsPipeline(options);
        setupPipelineListeners(pipeline, this);
      }
      hasFlushed = false;
    }

    pipeline.headOfPipeline.push(bytes);
  };

  this.flush = function() {
    if (!pipeline) {
      return;
    }

    hasFlushed = true;
    pipeline.headOfPipeline.flush();
  };

  this.partialFlush = function() {
    if (!pipeline) {
      return;
    }

    pipeline.headOfPipeline.partialFlush();
  };

  this.endTimeline = function() {
    if (!pipeline) {
      return;
    }

    pipeline.headOfPipeline.endTimeline();
  };

  this.reset = function() {
    if (!pipeline) {
      return;
    }

    pipeline.headOfPipeline.reset();
  };

  this.setBaseMediaDecodeTime = function(baseMediaDecodeTime) {
    if (!options.keepOriginalTimestamps) {
      options.baseMediaDecodeTime = baseMediaDecodeTime;
    }

    if (!pipeline) {
      return;
    }

    if (pipeline.tracks.audio) {
      pipeline.tracks.audio.timelineStartInfo.dts = undefined;
      pipeline.tracks.audio.timelineStartInfo.pts = undefined;
      trackInfo.clearDtsInfo(pipeline.tracks.audio);
      if (pipeline.audioRollover) {
        pipeline.audioRollover.discontinuity();
      }
    }
    if (pipeline.tracks.video) {
      if (pipeline.videoSegmentStream) {
        pipeline.videoSegmentStream.gopCache_ = [];
      }
      pipeline.tracks.video.timelineStartInfo.dts = undefined;
      pipeline.tracks.video.timelineStartInfo.pts = undefined;
      trackInfo.clearDtsInfo(pipeline.tracks.video);
      // pipeline.captionStream.reset();
    }

    if (pipeline.timestampRollover) {
      pipeline.timestampRollover.discontinuity();

    }
  };

  this.setRemux = function(val) {
    options.remux = val;

    if (pipeline && pipeline.coalesceStream) {
      pipeline.coalesceStream.setRemux(val);
    }
  };


  this.setAudioAppendStart = function(audioAppendStart) {
    if (!pipeline || !pipeline.tracks.audio || !pipeline.audioSegmentStream) {
      return;
    }

    pipeline.audioSegmentStream.setAudioAppendStart(audioAppendStart);
  };

  // TODO GOP alignment support
  // Support may be a bit trickier than with full segment appends, as GOPs may be split
  // and processed in a more granular fashion
  this.alignGopsWith = function(gopsToAlignWith) {
    return;
  };
};

Transmuxer.prototype = new Stream();

module.exports = Transmuxer;

},{"../aac/index":2,"../aac/utils":3,"../codecs/adts":4,"../codecs/index.js":6,"../m2ts/m2ts.js":19,"../mp4/track-decode-info.js":32,"../utils/clock":48,"../utils/stream.js":50,"./audio-segment-stream.js":34,"./video-segment-stream.js":37}],37:[function(require,module,exports){
/**
 * Constructs a single-track, ISO BMFF media segment from H264 data
 * events. The output of this stream can be fed to a SourceBuffer
 * configured with a suitable initialization segment.
 * @param track {object} track metadata configuration
 * @param options {object} transmuxer options object
 * @param options.alignGopsAtEnd {boolean} If true, start from the end of the
 *        gopsToAlignWith list when attempting to align gop pts
 */
'use strict';

var Stream = require('../utils/stream.js');
var mp4 = require('../mp4/mp4-generator.js');
var trackInfo = require('../mp4/track-decode-info.js');
var frameUtils = require('../mp4/frame-utils');
var VIDEO_PROPERTIES = require('../constants/video-properties.js');

var VideoSegmentStream = function(track, options) {
  var
    sequenceNumber = 0,
    nalUnits = [],
    frameCache = [],
    // gopsToAlignWith = [],
    config,
    pps,
    segmentStartPts = null,
    segmentEndPts = null,
    gops,
    ensureNextFrameIsKeyFrame = true;

  options = options || {};

  VideoSegmentStream.prototype.init.call(this);

  this.push = function(nalUnit) {
    trackInfo.collectDtsInfo(track, nalUnit);
    if (typeof track.timelineStartInfo.dts === 'undefined') {
      track.timelineStartInfo.dts = nalUnit.dts;
    }

    // record the track config
    if (nalUnit.nalUnitType === 'seq_parameter_set_rbsp' && !config) {
      config = nalUnit.config;
      track.sps = [nalUnit.data];

      VIDEO_PROPERTIES.forEach(function(prop) {
        track[prop] = config[prop];
      }, this);
    }

    if (nalUnit.nalUnitType === 'pic_parameter_set_rbsp' &&
        !pps) {
      pps = nalUnit.data;
      track.pps = [nalUnit.data];
    }

    // buffer video until flush() is called
    nalUnits.push(nalUnit);
  };

  this.processNals_ = function(cacheLastFrame) {
    var i;

    nalUnits = frameCache.concat(nalUnits);

    // Throw away nalUnits at the start of the byte stream until
    // we find the first AUD
    while (nalUnits.length) {
      if (nalUnits[0].nalUnitType === 'access_unit_delimiter_rbsp') {
        break;
      }
      nalUnits.shift();
    }

    // Return early if no video data has been observed
    if (nalUnits.length === 0) {
      return;
    }

    var frames = frameUtils.groupNalsIntoFrames(nalUnits);

    if (!frames.length) {
      return;
    }

    // note that the frame cache may also protect us from cases where we haven't
    // pushed data for the entire first or last frame yet
    frameCache = frames[frames.length - 1];

    if (cacheLastFrame) {
      frames.pop();
      frames.duration -= frameCache.duration;
      frames.nalCount -= frameCache.length;
      frames.byteLength -= frameCache.byteLength;
    }

    if (!frames.length) {
      nalUnits = [];
      return;
    }

    this.trigger('timelineStartInfo', track.timelineStartInfo);

    if (ensureNextFrameIsKeyFrame) {
      gops = frameUtils.groupFramesIntoGops(frames);

      if (!gops[0][0].keyFrame) {
        gops = frameUtils.extendFirstKeyFrame(gops);

        if (!gops[0][0].keyFrame) {
          // we haven't yet gotten a key frame, so reset nal units to wait for more nal
          // units
          nalUnits = ([].concat.apply([], frames)).concat(frameCache);
          frameCache = [];
          return;
        }

        frames = [].concat.apply([], gops);
        frames.duration = gops.duration;
      }
      ensureNextFrameIsKeyFrame = false;
    }

    if (segmentStartPts === null) {
      segmentStartPts = frames[0].pts;
      segmentEndPts = segmentStartPts;
    }

    segmentEndPts += frames.duration;

    this.trigger('timingInfo', {
      start: segmentStartPts,
      end: segmentEndPts
    });

    for (i = 0; i < frames.length; i++) {
      var frame = frames[i];

      track.samples = frameUtils.generateSampleTableForFrame(frame);

      var mdat = mp4.mdat(frameUtils.concatenateNalDataForFrame(frame));

      trackInfo.clearDtsInfo(track);
      trackInfo.collectDtsInfo(track, frame);

      track.baseMediaDecodeTime = trackInfo.calculateTrackBaseMediaDecodeTime(
        track, options.keepOriginalTimestamps);

      var moof = mp4.moof(sequenceNumber, [track]);

      sequenceNumber++;

      track.initSegment = mp4.initSegment([track]);

      var boxes = new Uint8Array(moof.byteLength + mdat.byteLength);

      boxes.set(moof);
      boxes.set(mdat, moof.byteLength);

      this.trigger('data', {
        track: track,
        boxes: boxes,
        sequence: sequenceNumber,
        videoFrameDts: frame.dts,
        videoFramePts: frame.pts
      });
    }

    nalUnits = [];
  };

  this.resetTimingAndConfig_ = function() {
    config = undefined;
    pps = undefined;
    segmentStartPts = null;
    segmentEndPts = null;
  };

  this.partialFlush = function() {
    this.processNals_(true);
    this.trigger('partialdone', 'VideoSegmentStream');
  };

  this.flush = function() {
    this.processNals_(false);
    // reset config and pps because they may differ across segments
    // for instance, when we are rendition switching
    this.resetTimingAndConfig_();
    this.trigger('done', 'VideoSegmentStream');
  };

  this.endTimeline = function() {
    this.flush();
    this.trigger('endedtimeline', 'VideoSegmentStream');
  };

  this.reset = function() {
    this.resetTimingAndConfig_();
    frameCache = [];
    nalUnits = [];
    ensureNextFrameIsKeyFrame = true;
    this.trigger('reset');
  };
};

VideoSegmentStream.prototype = new Stream();

module.exports = VideoSegmentStream;

},{"../constants/video-properties.js":8,"../mp4/frame-utils":27,"../mp4/mp4-generator.js":29,"../mp4/track-decode-info.js":32,"../utils/stream.js":50}],38:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Reads in-band caption information from a video elementary
 * stream. Captions must follow the CEA-708 standard for injection
 * into an MPEG-2 transport streams.
 * @see https://en.wikipedia.org/wiki/CEA-708
 * @see https://www.gpo.gov/fdsys/pkg/CFR-2007-title47-vol1/pdf/CFR-2007-title47-vol1-sec15-119.pdf
 */

'use strict';

// Supplemental enhancement information (SEI) NAL units have a
// payload type field to indicate how they are to be
// interpreted. CEAS-708 caption content is always transmitted with
// payload type 0x04.
var USER_DATA_REGISTERED_ITU_T_T35 = 4,
    RBSP_TRAILING_BITS = 128;

/**
  * Parse a supplemental enhancement information (SEI) NAL unit.
  * Stops parsing once a message of type ITU T T35 has been found.
  *
  * @param bytes {Uint8Array} the bytes of a SEI NAL unit
  * @return {object} the parsed SEI payload
  * @see Rec. ITU-T H.264, 7.3.2.3.1
  */
var parseSei = function(bytes) {
  var
    i = 0,
    result = {
      payloadType: -1,
      payloadSize: 0
    },
    payloadType = 0,
    payloadSize = 0;

  // go through the sei_rbsp parsing each each individual sei_message
  while (i < bytes.byteLength) {
    // stop once we have hit the end of the sei_rbsp
    if (bytes[i] === RBSP_TRAILING_BITS) {
      break;
    }

    // Parse payload type
    while (bytes[i] === 0xFF) {
      payloadType += 255;
      i++;
    }
    payloadType += bytes[i++];

    // Parse payload size
    while (bytes[i] === 0xFF) {
      payloadSize += 255;
      i++;
    }
    payloadSize += bytes[i++];

    // this sei_message is a 608/708 caption so save it and break
    // there can only ever be one caption message in a frame's sei
    if (!result.payload && payloadType === USER_DATA_REGISTERED_ITU_T_T35) {
      var userIdentifier = String.fromCharCode(
        bytes[i + 3],
        bytes[i + 4],
        bytes[i + 5],
        bytes[i + 6]);

      if (userIdentifier === 'GA94') {
        result.payloadType = payloadType;
        result.payloadSize = payloadSize;
        result.payload = bytes.subarray(i, i + payloadSize);
        break;
      } else {
        result.payload = void 0;
      }
    }

    // skip the payload and parse the next message
    i += payloadSize;
    payloadType = 0;
    payloadSize = 0;
  }

  return result;
};

// see ANSI/SCTE 128-1 (2013), section 8.1
var parseUserData = function(sei) {
  // itu_t_t35_contry_code must be 181 (United States) for
  // captions
  if (sei.payload[0] !== 181) {
    return null;
  }

  // itu_t_t35_provider_code should be 49 (ATSC) for captions
  if (((sei.payload[1] << 8) | sei.payload[2]) !== 49) {
    return null;
  }

  // the user_identifier should be "GA94" to indicate ATSC1 data
  if (String.fromCharCode(sei.payload[3],
                          sei.payload[4],
                          sei.payload[5],
                          sei.payload[6]) !== 'GA94') {
    return null;
  }

  // finally, user_data_type_code should be 0x03 for caption data
  if (sei.payload[7] !== 0x03) {
    return null;
  }

  // return the user_data_type_structure and strip the trailing
  // marker bits
  return sei.payload.subarray(8, sei.payload.length - 1);
};

// see CEA-708-D, section 4.4
var parseCaptionPackets = function(pts, userData) {
  var results = [], i, count, offset, data;

  // if this is just filler, return immediately
  if (!(userData[0] & 0x40)) {
    return results;
  }

  // parse out the cc_data_1 and cc_data_2 fields
  count = userData[0] & 0x1f;
  for (i = 0; i < count; i++) {
    offset = i * 3;
    data = {
      type: userData[offset + 2] & 0x03,
      pts: pts
    };

    // capture cc data when cc_valid is 1
    if (userData[offset + 2] & 0x04) {
      data.ccData = (userData[offset + 3] << 8) | userData[offset + 4];
      results.push(data);
    }
  }
  return results;
};

var discardEmulationPreventionBytes = function(data) {
    var
      length = data.byteLength,
      emulationPreventionBytesPositions = [],
      i = 1,
      newLength, newData;

    // Find all `Emulation Prevention Bytes`
    while (i < length - 2) {
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0x03) {
        emulationPreventionBytesPositions.push(i + 2);
        i += 2;
      } else {
        i++;
      }
    }

    // If no Emulation Prevention Bytes were found just return the original
    // array
    if (emulationPreventionBytesPositions.length === 0) {
      return data;
    }

    // Create a new array to hold the NAL unit data
    newLength = length - emulationPreventionBytesPositions.length;
    newData = new Uint8Array(newLength);
    var sourceIndex = 0;

    for (i = 0; i < newLength; sourceIndex++, i++) {
      if (sourceIndex === emulationPreventionBytesPositions[0]) {
        // Skip this byte
        sourceIndex++;
        // Remove this position index
        emulationPreventionBytesPositions.shift();
      }
      newData[i] = data[sourceIndex];
    }

    return newData;
};

// exports
module.exports = {
  parseSei: parseSei,
  parseUserData: parseUserData,
  parseCaptionPackets: parseCaptionPackets,
  discardEmulationPreventionBytes: discardEmulationPreventionBytes,
  USER_DATA_REGISTERED_ITU_T_T35: USER_DATA_REGISTERED_ITU_T_T35
};

},{}],39:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var
  tagTypes = {
    0x08: 'audio',
    0x09: 'video',
    0x12: 'metadata'
  },
  hex = function(val) {
    return '0x' + ('00' + val.toString(16)).slice(-2).toUpperCase();
  },
  hexStringList = function(data) {
    var arr = [], i;

    while (data.byteLength > 0) {
      i = 0;
      arr.push(hex(data[i++]));
      data = data.subarray(i);
    }
    return arr.join(' ');
  },
  parseAVCTag = function(tag, obj) {
    var
      avcPacketTypes = [
        'AVC Sequence Header',
        'AVC NALU',
        'AVC End-of-Sequence'
      ],
      compositionTime = (tag[1] & parseInt('01111111', 2) << 16) | (tag[2] << 8) | tag[3];

    obj = obj || {};

    obj.avcPacketType = avcPacketTypes[tag[0]];
    obj.CompositionTime = (tag[1] & parseInt('10000000', 2)) ? -compositionTime : compositionTime;

    if (tag[0] === 1) {
      obj.nalUnitTypeRaw = hexStringList(tag.subarray(4, 100));
    } else {
      obj.data = hexStringList(tag.subarray(4));
    }

    return obj;
  },
  parseVideoTag = function(tag, obj) {
    var
      frameTypes = [
        'Unknown',
        'Keyframe (for AVC, a seekable frame)',
        'Inter frame (for AVC, a nonseekable frame)',
        'Disposable inter frame (H.263 only)',
        'Generated keyframe (reserved for server use only)',
        'Video info/command frame'
      ],
      codecID = tag[0] & parseInt('00001111', 2);

    obj = obj || {};

    obj.frameType = frameTypes[(tag[0] & parseInt('11110000', 2)) >>> 4];
    obj.codecID = codecID;

    if (codecID === 7) {
      return parseAVCTag(tag.subarray(1), obj);
    }
    return obj;
  },
  parseAACTag = function(tag, obj) {
    var packetTypes = [
      'AAC Sequence Header',
      'AAC Raw'
    ];

    obj = obj || {};

    obj.aacPacketType = packetTypes[tag[0]];
    obj.data = hexStringList(tag.subarray(1));

    return obj;
  },
  parseAudioTag = function(tag, obj) {
    var
      formatTable = [
        'Linear PCM, platform endian',
        'ADPCM',
        'MP3',
        'Linear PCM, little endian',
        'Nellymoser 16-kHz mono',
        'Nellymoser 8-kHz mono',
        'Nellymoser',
        'G.711 A-law logarithmic PCM',
        'G.711 mu-law logarithmic PCM',
        'reserved',
        'AAC',
        'Speex',
        'MP3 8-Khz',
        'Device-specific sound'
      ],
      samplingRateTable = [
        '5.5-kHz',
        '11-kHz',
        '22-kHz',
        '44-kHz'
      ],
      soundFormat = (tag[0] & parseInt('11110000', 2)) >>> 4;

    obj = obj || {};

    obj.soundFormat = formatTable[soundFormat];
    obj.soundRate = samplingRateTable[(tag[0] & parseInt('00001100', 2)) >>> 2];
    obj.soundSize = ((tag[0] & parseInt('00000010', 2)) >>> 1) ? '16-bit' : '8-bit';
    obj.soundType = (tag[0] & parseInt('00000001', 2)) ? 'Stereo' : 'Mono';

    if (soundFormat === 10) {
      return parseAACTag(tag.subarray(1), obj);
    }
    return obj;
  },
  parseGenericTag = function(tag) {
    return {
      tagType: tagTypes[tag[0]],
      dataSize: (tag[1] << 16) | (tag[2] << 8) | tag[3],
      timestamp: (tag[7] << 24) | (tag[4] << 16) | (tag[5] << 8) | tag[6],
      streamID: (tag[8] << 16) | (tag[9] << 8) | tag[10]
    };
  },
  inspectFlvTag = function(tag) {
    var header = parseGenericTag(tag);
    switch (tag[0]) {
      case 0x08:
        parseAudioTag(tag.subarray(11), header);
        break;
      case 0x09:
        parseVideoTag(tag.subarray(11), header);
        break;
      case 0x12:
    }
    return header;
  },
  inspectFlv = function(bytes) {
    var i = 9, // header
        dataSize,
        parsedResults = [],
        tag;

    // traverse the tags
    i += 4; // skip previous tag size
    while (i < bytes.byteLength) {
      dataSize = bytes[i + 1] << 16;
      dataSize |= bytes[i + 2] << 8;
      dataSize |= bytes[i + 3];
      dataSize += 11;

      tag = bytes.subarray(i, i + dataSize);
      parsedResults.push(inspectFlvTag(tag));
      i += dataSize + 4;
    }
    return parsedResults;
  },
  textifyFlv = function(flvTagArray) {
    return JSON.stringify(flvTagArray, null, 2);
  };

module.exports = {
  inspectTag: inspectFlvTag,
  inspect: inspectFlv,
  textify: textifyFlv
};

},{}],40:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Parse the internal MP4 structure into an equivalent javascript
 * object.
 */
'use strict';

var
  inspectMp4,
  textifyMp4,
  parseMp4Date = function(seconds) {
    return new Date(seconds * 1000 - 2082844800000);
  },
  parseType = require('../mp4/parse-type'),
  findBox = require('../mp4/find-box'),
  nalParse = function(avcStream) {
    var
      avcView = new DataView(avcStream.buffer, avcStream.byteOffset, avcStream.byteLength),
      result = [],
      i,
      length;
    for (i = 0; i + 4 < avcStream.length; i += length) {
      length = avcView.getUint32(i);
      i += 4;

      // bail if this doesn't appear to be an H264 stream
      if (length <= 0) {
        result.push('<span style=\'color:red;\'>MALFORMED DATA</span>');
        continue;
      }

      switch (avcStream[i] & 0x1F) {
      case 0x01:
        result.push('slice_layer_without_partitioning_rbsp');
        break;
      case 0x05:
        result.push('slice_layer_without_partitioning_rbsp_idr');
        break;
      case 0x06:
        result.push('sei_rbsp');
        break;
      case 0x07:
        result.push('seq_parameter_set_rbsp');
        break;
      case 0x08:
        result.push('pic_parameter_set_rbsp');
        break;
      case 0x09:
        result.push('access_unit_delimiter_rbsp');
        break;
      default:
        result.push('UNKNOWN NAL - ' + avcStream[i] & 0x1F);
        break;
      }
    }
    return result;
  },

  // registry of handlers for individual mp4 box types
  parse = {
    // codingname, not a first-class box type. stsd entries share the
    // same format as real boxes so the parsing infrastructure can be
    // shared
    avc1: function(data) {
      var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        dataReferenceIndex: view.getUint16(6),
        width: view.getUint16(24),
        height: view.getUint16(26),
        horizresolution: view.getUint16(28) + (view.getUint16(30) / 16),
        vertresolution: view.getUint16(32) + (view.getUint16(34) / 16),
        frameCount: view.getUint16(40),
        depth: view.getUint16(74),
        config: inspectMp4(data.subarray(78, data.byteLength))
      };
    },
    avcC: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          configurationVersion: data[0],
          avcProfileIndication: data[1],
          profileCompatibility: data[2],
          avcLevelIndication: data[3],
          lengthSizeMinusOne: data[4] & 0x03,
          sps: [],
          pps: []
        },
        numOfSequenceParameterSets = data[5] & 0x1f,
        numOfPictureParameterSets,
        nalSize,
        offset,
        i;

      // iterate past any SPSs
      offset = 6;
      for (i = 0; i < numOfSequenceParameterSets; i++) {
        nalSize = view.getUint16(offset);
        offset += 2;
        result.sps.push(new Uint8Array(data.subarray(offset, offset + nalSize)));
        offset += nalSize;
      }
      // iterate past any PPSs
      numOfPictureParameterSets = data[offset];
      offset++;
      for (i = 0; i < numOfPictureParameterSets; i++) {
        nalSize = view.getUint16(offset);
        offset += 2;
        result.pps.push(new Uint8Array(data.subarray(offset, offset + nalSize)));
        offset += nalSize;
      }
      return result;
    },
    btrt: function(data) {
      var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        bufferSizeDB: view.getUint32(0),
        maxBitrate: view.getUint32(4),
        avgBitrate: view.getUint32(8)
      };
    },
    esds: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        esId: (data[6] << 8) | data[7],
        streamPriority: data[8] & 0x1f,
        decoderConfig: {
          objectProfileIndication: data[11],
          streamType: (data[12] >>> 2) & 0x3f,
          bufferSize: (data[13] << 16) | (data[14] << 8) | data[15],
          maxBitrate: (data[16] << 24) |
            (data[17] << 16) |
            (data[18] <<  8) |
            data[19],
          avgBitrate: (data[20] << 24) |
            (data[21] << 16) |
            (data[22] <<  8) |
            data[23],
          decoderConfigDescriptor: {
            tag: data[24],
            length: data[25],
            audioObjectType: (data[26] >>> 3) & 0x1f,
            samplingFrequencyIndex: ((data[26] & 0x07) << 1) |
              ((data[27] >>> 7) & 0x01),
            channelConfiguration: (data[27] >>> 3) & 0x0f
          }
        }
      };
    },
    ftyp: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          majorBrand: parseType(data.subarray(0, 4)),
          minorVersion: view.getUint32(4),
          compatibleBrands: []
        },
        i = 8;
      while (i < data.byteLength) {
        result.compatibleBrands.push(parseType(data.subarray(i, i + 4)));
        i += 4;
      }
      return result;
    },
    dinf: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    dref: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        dataReferences: inspectMp4(data.subarray(8))
      };
    },
    hdlr: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4)),
          handlerType: parseType(data.subarray(8, 12)),
          name: ''
        },
        i = 8;

      // parse out the name field
      for (i = 24; i < data.byteLength; i++) {
        if (data[i] === 0x00) {
          // the name field is null-terminated
          i++;
          break;
        }
        result.name += String.fromCharCode(data[i]);
      }
      // decode UTF-8 to javascript's internal representation
      // see http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
      result.name = decodeURIComponent(escape(result.name));

      return result;
    },
    mdat: function(data) {
      return {
        byteLength: data.byteLength,
        nals: nalParse(data)
      };
    },
    mdhd: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        i = 4,
        language,
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4)),
          language: ''
        };
      if (result.version === 1) {
        i += 4;
        result.creationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 8;
        result.modificationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 4;
        result.timescale = view.getUint32(i);
        i += 8;
        result.duration = view.getUint32(i); // truncating top 4 bytes
      } else {
        result.creationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.modificationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.timescale = view.getUint32(i);
        i += 4;
        result.duration = view.getUint32(i);
      }
      i += 4;
      // language is stored as an ISO-639-2/T code in an array of three 5-bit fields
      // each field is the packed difference between its ASCII value and 0x60
      language = view.getUint16(i);
      result.language += String.fromCharCode((language >> 10) + 0x60);
      result.language += String.fromCharCode(((language & 0x03e0) >> 5) + 0x60);
      result.language += String.fromCharCode((language & 0x1f) + 0x60);

      return result;
    },
    mdia: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    mfhd: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        sequenceNumber: (data[4] << 24) |
          (data[5] << 16) |
          (data[6] << 8) |
          (data[7])
      };
    },
    minf: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    // codingname, not a first-class box type. stsd entries share the
    // same format as real boxes so the parsing infrastructure can be
    // shared
    mp4a: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          // 6 bytes reserved
          dataReferenceIndex: view.getUint16(6),
          // 4 + 4 bytes reserved
          channelcount: view.getUint16(16),
          samplesize: view.getUint16(18),
          // 2 bytes pre_defined
          // 2 bytes reserved
          samplerate: view.getUint16(24) + (view.getUint16(26) / 65536)
        };

      // if there are more bytes to process, assume this is an ISO/IEC
      // 14496-14 MP4AudioSampleEntry and parse the ESDBox
      if (data.byteLength > 28) {
        result.streamDescriptor = inspectMp4(data.subarray(28))[0];
      }
      return result;
    },
    moof: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    moov: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    mvex: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    mvhd: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        i = 4,
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4))
        };

      if (result.version === 1) {
        i += 4;
        result.creationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 8;
        result.modificationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 4;
        result.timescale = view.getUint32(i);
        i += 8;
        result.duration = view.getUint32(i); // truncating top 4 bytes
      } else {
        result.creationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.modificationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.timescale = view.getUint32(i);
        i += 4;
        result.duration = view.getUint32(i);
      }
      i += 4;

      // convert fixed-point, base 16 back to a number
      result.rate = view.getUint16(i) + (view.getUint16(i + 2) / 16);
      i += 4;
      result.volume = view.getUint8(i) + (view.getUint8(i + 1) / 8);
      i += 2;
      i += 2;
      i += 2 * 4;
      result.matrix = new Uint32Array(data.subarray(i, i + (9 * 4)));
      i += 9 * 4;
      i += 6 * 4;
      result.nextTrackId = view.getUint32(i);
      return result;
    },
    pdin: function(data) {
      var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        version: view.getUint8(0),
        flags: new Uint8Array(data.subarray(1, 4)),
        rate: view.getUint32(4),
        initialDelay: view.getUint32(8)
      };
    },
    sdtp: function(data) {
      var
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          samples: []
        }, i;

      for (i = 4; i < data.byteLength; i++) {
        result.samples.push({
          dependsOn: (data[i] & 0x30) >> 4,
          isDependedOn: (data[i] & 0x0c) >> 2,
          hasRedundancy: data[i] & 0x03
        });
      }
      return result;
    },
    sidx: require('./parse-sidx.js'),
    smhd: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        balance: data[4] + (data[5] / 256)
      };
    },
    stbl: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    stco: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          chunkOffsets: []
        },
        entryCount = view.getUint32(4),
        i;
      for (i = 8; entryCount; i += 4, entryCount--) {
        result.chunkOffsets.push(view.getUint32(i));
      }
      return result;
    },
    stsc: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        entryCount = view.getUint32(4),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          sampleToChunks: []
        },
        i;
      for (i = 8; entryCount; i += 12, entryCount--) {
        result.sampleToChunks.push({
          firstChunk: view.getUint32(i),
          samplesPerChunk: view.getUint32(i + 4),
          sampleDescriptionIndex: view.getUint32(i + 8)
        });
      }
      return result;
    },
    stsd: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        sampleDescriptions: inspectMp4(data.subarray(8))
      };
    },
    stsz: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          sampleSize: view.getUint32(4),
          entries: []
        },
        i;
      for (i = 12; i < data.byteLength; i += 4) {
        result.entries.push(view.getUint32(i));
      }
      return result;
    },
    stts: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          timeToSamples: []
        },
        entryCount = view.getUint32(4),
        i;

      for (i = 8; entryCount; i += 8, entryCount--) {
        result.timeToSamples.push({
          sampleCount: view.getUint32(i),
          sampleDelta: view.getUint32(i + 4)
        });
      }
      return result;
    },
    styp: function(data) {
      return parse.ftyp(data);
    },
    tfdt: require('./parse-tfdt.js'),
    tfhd: require('./parse-tfhd.js'),
    tkhd: function(data) {
      var
        view = new DataView(data.buffer, data.byteOffset, data.byteLength),
        i = 4,
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4))
        };
      if (result.version === 1) {
        i += 4;
        result.creationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 8;
        result.modificationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 4;
        result.trackId = view.getUint32(i);
        i += 4;
        i += 8;
        result.duration = view.getUint32(i); // truncating top 4 bytes
      } else {
        result.creationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.modificationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.trackId = view.getUint32(i);
        i += 4;
        i += 4;
        result.duration = view.getUint32(i);
      }
      i += 4;
      i += 2 * 4;
      result.layer = view.getUint16(i);
      i += 2;
      result.alternateGroup = view.getUint16(i);
      i += 2;
      // convert fixed-point, base 16 back to a number
      result.volume = view.getUint8(i) + (view.getUint8(i + 1) / 8);
      i += 2;
      i += 2;
      result.matrix = new Uint32Array(data.subarray(i, i + (9 * 4)));
      i += 9 * 4;
      result.width = view.getUint16(i) + (view.getUint16(i + 2) / 65536);
      i += 4;
      result.height = view.getUint16(i) + (view.getUint16(i + 2) / 65536);
      return result;
    },
    traf: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    trak: function(data) {
      return {
        boxes: inspectMp4(data)
      };
    },
    trex: function(data) {
      var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        trackId: view.getUint32(4),
        defaultSampleDescriptionIndex: view.getUint32(8),
        defaultSampleDuration: view.getUint32(12),
        defaultSampleSize: view.getUint32(16),
        sampleDependsOn: data[20] & 0x03,
        sampleIsDependedOn: (data[21] & 0xc0) >> 6,
        sampleHasRedundancy: (data[21] & 0x30) >> 4,
        samplePaddingValue: (data[21] & 0x0e) >> 1,
        sampleIsDifferenceSample: !!(data[21] & 0x01),
        sampleDegradationPriority: view.getUint16(22)
      };
    },
    trun: require('./parse-trun.js'),
    'url ': function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4))
      };
    },
    vmhd: function(data) {
      var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        graphicsmode: view.getUint16(4),
        opcolor: new Uint16Array([view.getUint16(6),
                                  view.getUint16(8),
                                  view.getUint16(10)])
      };
    }
  };


/**
 * Return a javascript array of box objects parsed from an ISO base
 * media file.
 * @param data {Uint8Array} the binary data of the media to be inspected
 * @return {array} a javascript array of potentially nested box objects
 */
inspectMp4 = function(data) {
  var
    i = 0,
    result = [],
    view,
    size,
    type,
    end,
    box;

  // Convert data from Uint8Array to ArrayBuffer, to follow Dataview API
  var ab = new ArrayBuffer(data.length);
  var v = new Uint8Array(ab);
  for (var z = 0; z < data.length; ++z) {
      v[z] = data[z];
  }
  view = new DataView(ab);

  while (i < data.byteLength) {
    // parse box data
    size = view.getUint32(i);
    type =  parseType(data.subarray(i + 4, i + 8));
    end = size > 1 ? i + size : data.byteLength;

    // parse type-specific data
    box = (parse[type] || function(data) {
      return {
        data: data
      };
    })(data.subarray(i + 8, end));
    box.size = size;
    box.type = type;

    // store this box and move to the next
    result.push(box);
    i = end;
  }
  return result;
};

/**
 * Returns a textual representation of the javascript represtentation
 * of an MP4 file. You can use it as an alternative to
 * JSON.stringify() to compare inspected MP4s.
 * @param inspectedMp4 {array} the parsed array of boxes in an MP4
 * file
 * @param depth {number} (optional) the number of ancestor boxes of
 * the elements of inspectedMp4. Assumed to be zero if unspecified.
 * @return {string} a text representation of the parsed MP4
 */
textifyMp4 = function(inspectedMp4, depth) {
  var indent;
  depth = depth || 0;
  indent = new Array(depth * 2 + 1).join(' ');

  // iterate over all the boxes
  return inspectedMp4.map(function(box, index) {

    // list the box type first at the current indentation level
    return indent + box.type + '\n' +

      // the type is already included and handle child boxes separately
      Object.keys(box).filter(function(key) {
        return key !== 'type' && key !== 'boxes';

      // output all the box properties
      }).map(function(key) {
        var prefix = indent + '  ' + key + ': ',
            value = box[key];

        // print out raw bytes as hexademical
        if (value instanceof Uint8Array || value instanceof Uint32Array) {
          var bytes = Array.prototype.slice.call(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
              .map(function(byte) {
                return ' ' + ('00' + byte.toString(16)).slice(-2);
              }).join('').match(/.{1,24}/g);
          if (!bytes) {
            return prefix + '<>';
          }
          if (bytes.length === 1) {
            return prefix + '<' + bytes.join('').slice(1) + '>';
          }
          return prefix + '<\n' + bytes.map(function(line) {
            return indent + '  ' + line;
          }).join('\n') + '\n' + indent + '  >';
        }

        // stringify generic objects
        return prefix +
            JSON.stringify(value, null, 2)
              .split('\n').map(function(line, index) {
                if (index === 0) {
                  return line;
                }
                return indent + '  ' + line;
              }).join('\n');
      }).join('\n') +

    // recursively textify the child boxes
    (box.boxes ? '\n' + textifyMp4(box.boxes, depth + 1) : '');
  }).join('\n');
};

module.exports = {
  inspect: inspectMp4,
  textify: textifyMp4,
  parseType: parseType,
  findBox: findBox,
  parseTraf: parse.traf,
  parseTfdt: parse.tfdt,
  parseHdlr: parse.hdlr,
  parseTfhd: parse.tfhd,
  parseTrun: parse.trun,
  parseSidx: parse.sidx
};

},{"../mp4/find-box":26,"../mp4/parse-type":30,"./parse-sidx.js":42,"./parse-tfdt.js":43,"./parse-tfhd.js":44,"./parse-trun.js":45}],41:[function(require,module,exports){
var parseSampleFlags = function(flags) {
  return {
    isLeading: (flags[0] & 0x0c) >>> 2,
    dependsOn: flags[0] & 0x03,
    isDependedOn: (flags[1] & 0xc0) >>> 6,
    hasRedundancy: (flags[1] & 0x30) >>> 4,
    paddingValue: (flags[1] & 0x0e) >>> 1,
    isNonSyncSample: flags[1] & 0x01,
    degradationPriority: (flags[2] << 8) | flags[3]
  };
};

module.exports = parseSampleFlags;

},{}],42:[function(require,module,exports){
var parseSidx = function(data) {
  var view = new DataView(data.buffer, data.byteOffset, data.byteLength),
    result = {
      version: data[0],
      flags: new Uint8Array(data.subarray(1, 4)),
      references: [],
      referenceId: view.getUint32(4),
      timescale: view.getUint32(8),
      earliestPresentationTime: view.getUint32(12),
      firstOffset: view.getUint32(16)
    },
    referenceCount = view.getUint16(22),
    i;

  for (i = 24; referenceCount; i += 12, referenceCount--) {
    result.references.push({
      referenceType: (data[i] & 0x80) >>> 7,
      referencedSize: view.getUint32(i) & 0x7FFFFFFF,
      subsegmentDuration: view.getUint32(i + 4),
      startsWithSap: !!(data[i + 8] & 0x80),
      sapType: (data[i + 8] & 0x70) >>> 4,
      sapDeltaTime: view.getUint32(i + 8) & 0x0FFFFFFF
    });
  }

  return result;
};

module.exports = parseSidx;

},{}],43:[function(require,module,exports){
var toUnsigned = require('../utils/bin').toUnsigned;

var tfdt = function(data) {
  var result = {
    version: data[0],
    flags: new Uint8Array(data.subarray(1, 4)),
    baseMediaDecodeTime: toUnsigned(data[4] << 24 | data[5] << 16 | data[6] << 8 | data[7])
  };
  if (result.version === 1) {
    result.baseMediaDecodeTime *= Math.pow(2, 32);
    result.baseMediaDecodeTime += toUnsigned(data[8] << 24 | data[9] << 16 | data[10] << 8 | data[11]);
  }
  return result;
};

module.exports = tfdt;


},{"../utils/bin":47}],44:[function(require,module,exports){
var tfhd = function(data) {
  var
  view = new DataView(data.buffer, data.byteOffset, data.byteLength),
    result = {
      version: data[0],
      flags: new Uint8Array(data.subarray(1, 4)),
      trackId: view.getUint32(4)
    },
    baseDataOffsetPresent = result.flags[2] & 0x01,
    sampleDescriptionIndexPresent = result.flags[2] & 0x02,
    defaultSampleDurationPresent = result.flags[2] & 0x08,
    defaultSampleSizePresent = result.flags[2] & 0x10,
    defaultSampleFlagsPresent = result.flags[2] & 0x20,
    durationIsEmpty = result.flags[0] & 0x010000,
    defaultBaseIsMoof =  result.flags[0] & 0x020000,
    i;

  i = 8;
  if (baseDataOffsetPresent) {
    i += 4; // truncate top 4 bytes
    // FIXME: should we read the full 64 bits?
    result.baseDataOffset = view.getUint32(12);
    i += 4;
  }
  if (sampleDescriptionIndexPresent) {
    result.sampleDescriptionIndex = view.getUint32(i);
    i += 4;
  }
  if (defaultSampleDurationPresent) {
    result.defaultSampleDuration = view.getUint32(i);
    i += 4;
  }
  if (defaultSampleSizePresent) {
    result.defaultSampleSize = view.getUint32(i);
    i += 4;
  }
  if (defaultSampleFlagsPresent) {
    result.defaultSampleFlags = view.getUint32(i);
  }
  if (durationIsEmpty) {
    result.durationIsEmpty = true;
  }
  if (!baseDataOffsetPresent && defaultBaseIsMoof) {
    result.baseDataOffsetIsMoof = true;
  }
  return result;
};

module.exports = tfhd;

},{}],45:[function(require,module,exports){
var parseSampleFlags = require('./parse-sample-flags.js');

var trun = function(data) {
  var
  result = {
    version: data[0],
    flags: new Uint8Array(data.subarray(1, 4)),
    samples: []
  },
    view = new DataView(data.buffer, data.byteOffset, data.byteLength),
    // Flag interpretation
    dataOffsetPresent = result.flags[2] & 0x01, // compare with 2nd byte of 0x1
    firstSampleFlagsPresent = result.flags[2] & 0x04, // compare with 2nd byte of 0x4
    sampleDurationPresent = result.flags[1] & 0x01, // compare with 2nd byte of 0x100
    sampleSizePresent = result.flags[1] & 0x02, // compare with 2nd byte of 0x200
    sampleFlagsPresent = result.flags[1] & 0x04, // compare with 2nd byte of 0x400
    sampleCompositionTimeOffsetPresent = result.flags[1] & 0x08, // compare with 2nd byte of 0x800
    sampleCount = view.getUint32(4),
    offset = 8,
    sample;

  if (dataOffsetPresent) {
    // 32 bit signed integer
    result.dataOffset = view.getInt32(offset);
    offset += 4;
  }

  // Overrides the flags for the first sample only. The order of
  // optional values will be: duration, size, compositionTimeOffset
  if (firstSampleFlagsPresent && sampleCount) {
    sample = {
      flags: parseSampleFlags(data.subarray(offset, offset + 4))
    };
    offset += 4;
    if (sampleDurationPresent) {
      sample.duration = view.getUint32(offset);
      offset += 4;
    }
    if (sampleSizePresent) {
      sample.size = view.getUint32(offset);
      offset += 4;
    }
    if (sampleCompositionTimeOffsetPresent) {
      if (result.version === 1) {
        sample.compositionTimeOffset = view.getInt32(offset);
      } else {
        sample.compositionTimeOffset = view.getUint32(offset);
      }
      offset += 4;
    }
    result.samples.push(sample);
    sampleCount--;
  }

  while (sampleCount--) {
    sample = {};
    if (sampleDurationPresent) {
      sample.duration = view.getUint32(offset);
      offset += 4;
    }
    if (sampleSizePresent) {
      sample.size = view.getUint32(offset);
      offset += 4;
    }
    if (sampleFlagsPresent) {
      sample.flags = parseSampleFlags(data.subarray(offset, offset + 4));
      offset += 4;
    }
    if (sampleCompositionTimeOffsetPresent) {
      if (result.version === 1) {
        sample.compositionTimeOffset = view.getInt32(offset);
      } else {
        sample.compositionTimeOffset = view.getUint32(offset);
      }
      offset += 4;
    }
    result.samples.push(sample);
  }
  return result;
};

module.exports = trun;

},{"./parse-sample-flags.js":41}],46:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * Parse mpeg2 transport stream packets to extract basic timing information
 */
'use strict';

var StreamTypes = require('../m2ts/stream-types.js');
var handleRollover = require('../m2ts/timestamp-rollover-stream.js').handleRollover;
var probe = {};
probe.ts = require('../m2ts/probe.js');
probe.aac = require('../aac/utils.js');
var ONE_SECOND_IN_TS = require('../utils/clock').ONE_SECOND_IN_TS;

var
  MP2T_PACKET_LENGTH = 188, // bytes
  SYNC_BYTE = 0x47;

/**
 * walks through segment data looking for pat and pmt packets to parse out
 * program map table information
 */
var parsePsi_ = function(bytes, pmt) {
  var
    startIndex = 0,
    endIndex = MP2T_PACKET_LENGTH,
    packet, type;

  while (endIndex < bytes.byteLength) {
    // Look for a pair of start and end sync bytes in the data..
    if (bytes[startIndex] === SYNC_BYTE && bytes[endIndex] === SYNC_BYTE) {
      // We found a packet
      packet = bytes.subarray(startIndex, endIndex);
      type = probe.ts.parseType(packet, pmt.pid);

      switch (type) {
        case 'pat':
          if (!pmt.pid) {
            pmt.pid = probe.ts.parsePat(packet);
          }
          break;
        case 'pmt':
          if (!pmt.table) {
            pmt.table = probe.ts.parsePmt(packet);
          }
          break;
        default:
          break;
      }

      // Found the pat and pmt, we can stop walking the segment
      if (pmt.pid && pmt.table) {
        return;
      }

      startIndex += MP2T_PACKET_LENGTH;
      endIndex += MP2T_PACKET_LENGTH;
      continue;
    }

    // If we get here, we have somehow become de-synchronized and we need to step
    // forward one byte at a time until we find a pair of sync bytes that denote
    // a packet
    startIndex++;
    endIndex++;
  }
};

/**
 * walks through the segment data from the start and end to get timing information
 * for the first and last audio pes packets
 */
var parseAudioPes_ = function(bytes, pmt, result) {
  var
    startIndex = 0,
    endIndex = MP2T_PACKET_LENGTH,
    packet, type, pesType, pusi, parsed;

  var endLoop = false;

  // Start walking from start of segment to get first audio packet
  while (endIndex <= bytes.byteLength) {
    // Look for a pair of start and end sync bytes in the data..
    if (bytes[startIndex] === SYNC_BYTE &&
        (bytes[endIndex] === SYNC_BYTE || endIndex === bytes.byteLength)) {
      // We found a packet
      packet = bytes.subarray(startIndex, endIndex);
      type = probe.ts.parseType(packet, pmt.pid);

      switch (type) {
        case 'pes':
          pesType = probe.ts.parsePesType(packet, pmt.table);
          pusi = probe.ts.parsePayloadUnitStartIndicator(packet);
          if (pesType === 'audio' && pusi) {
            parsed = probe.ts.parsePesTime(packet);
            if (parsed) {
              parsed.type = 'audio';
              result.audio.push(parsed);
              endLoop = true;
            }
          }
          break;
        default:
          break;
      }

      if (endLoop) {
        break;
      }

      startIndex += MP2T_PACKET_LENGTH;
      endIndex += MP2T_PACKET_LENGTH;
      continue;
    }

    // If we get here, we have somehow become de-synchronized and we need to step
    // forward one byte at a time until we find a pair of sync bytes that denote
    // a packet
    startIndex++;
    endIndex++;
  }

  // Start walking from end of segment to get last audio packet
  endIndex = bytes.byteLength;
  startIndex = endIndex - MP2T_PACKET_LENGTH;
  endLoop = false;
  while (startIndex >= 0) {
    // Look for a pair of start and end sync bytes in the data..
    if (bytes[startIndex] === SYNC_BYTE &&
        (bytes[endIndex] === SYNC_BYTE || endIndex === bytes.byteLength)) {
      // We found a packet
      packet = bytes.subarray(startIndex, endIndex);
      type = probe.ts.parseType(packet, pmt.pid);

      switch (type) {
        case 'pes':
          pesType = probe.ts.parsePesType(packet, pmt.table);
          pusi = probe.ts.parsePayloadUnitStartIndicator(packet);
          if (pesType === 'audio' && pusi) {
            parsed = probe.ts.parsePesTime(packet);
            if (parsed) {
              parsed.type = 'audio';
              result.audio.push(parsed);
              endLoop = true;
            }
          }
          break;
        default:
          break;
      }

      if (endLoop) {
        break;
      }

      startIndex -= MP2T_PACKET_LENGTH;
      endIndex -= MP2T_PACKET_LENGTH;
      continue;
    }

    // If we get here, we have somehow become de-synchronized and we need to step
    // forward one byte at a time until we find a pair of sync bytes that denote
    // a packet
    startIndex--;
    endIndex--;
  }
};

/**
 * walks through the segment data from the start and end to get timing information
 * for the first and last video pes packets as well as timing information for the first
 * key frame.
 */
var parseVideoPes_ = function(bytes, pmt, result) {
  var
    startIndex = 0,
    endIndex = MP2T_PACKET_LENGTH,
    packet, type, pesType, pusi, parsed, frame, i, pes;

  var endLoop = false;

  var currentFrame = {
    data: [],
    size: 0
  };

  // Start walking from start of segment to get first video packet
  while (endIndex < bytes.byteLength) {
    // Look for a pair of start and end sync bytes in the data..
    if (bytes[startIndex] === SYNC_BYTE && bytes[endIndex] === SYNC_BYTE) {
      // We found a packet
      packet = bytes.subarray(startIndex, endIndex);
      type = probe.ts.parseType(packet, pmt.pid);

      switch (type) {
        case 'pes':
          pesType = probe.ts.parsePesType(packet, pmt.table);
          pusi = probe.ts.parsePayloadUnitStartIndicator(packet);
          if (pesType === 'video') {
            if (pusi && !endLoop) {
              parsed = probe.ts.parsePesTime(packet);
              if (parsed) {
                parsed.type = 'video';
                result.video.push(parsed);
                endLoop = true;
              }
            }
            if (!result.firstKeyFrame) {
              if (pusi) {
                if (currentFrame.size !== 0) {
                  frame = new Uint8Array(currentFrame.size);
                  i = 0;
                  while (currentFrame.data.length) {
                    pes = currentFrame.data.shift();
                    frame.set(pes, i);
                    i += pes.byteLength;
                  }
                  if (probe.ts.videoPacketContainsKeyFrame(frame)) {
                    var firstKeyFrame = probe.ts.parsePesTime(frame);

                    // PTS/DTS may not be available. Simply *not* setting
                    // the keyframe seems to work fine with HLS playback
                    // and definitely preferable to a crash with TypeError...
                    if (firstKeyFrame) {
                      result.firstKeyFrame = firstKeyFrame;
                      result.firstKeyFrame.type = 'video';
                    } else {
                      // eslint-disable-next-line
                      console.warn(
                        'Failed to extract PTS/DTS from PES at first keyframe. ' +
                        'This could be an unusual TS segment, or else mux.js did not ' +
                        'parse your TS segment correctly. If you know your TS ' +
                        'segments do contain PTS/DTS on keyframes please file a bug ' +
                        'report! You can try ffprobe to double check for yourself.'
                      );
                    }
                  }
                  currentFrame.size = 0;
                }
              }
              currentFrame.data.push(packet);
              currentFrame.size += packet.byteLength;
            }
          }
          break;
        default:
          break;
      }

      if (endLoop && result.firstKeyFrame) {
        break;
      }

      startIndex += MP2T_PACKET_LENGTH;
      endIndex += MP2T_PACKET_LENGTH;
      continue;
    }

    // If we get here, we have somehow become de-synchronized and we need to step
    // forward one byte at a time until we find a pair of sync bytes that denote
    // a packet
    startIndex++;
    endIndex++;
  }

  // Start walking from end of segment to get last video packet
  endIndex = bytes.byteLength;
  startIndex = endIndex - MP2T_PACKET_LENGTH;
  endLoop = false;
  while (startIndex >= 0) {
    // Look for a pair of start and end sync bytes in the data..
    if (bytes[startIndex] === SYNC_BYTE && bytes[endIndex] === SYNC_BYTE) {
      // We found a packet
      packet = bytes.subarray(startIndex, endIndex);
      type = probe.ts.parseType(packet, pmt.pid);

      switch (type) {
        case 'pes':
          pesType = probe.ts.parsePesType(packet, pmt.table);
          pusi = probe.ts.parsePayloadUnitStartIndicator(packet);
          if (pesType === 'video' && pusi) {
              parsed = probe.ts.parsePesTime(packet);
              if (parsed) {
                parsed.type = 'video';
                result.video.push(parsed);
                endLoop = true;
              }
          }
          break;
        default:
          break;
      }

      if (endLoop) {
        break;
      }

      startIndex -= MP2T_PACKET_LENGTH;
      endIndex -= MP2T_PACKET_LENGTH;
      continue;
    }

    // If we get here, we have somehow become de-synchronized and we need to step
    // forward one byte at a time until we find a pair of sync bytes that denote
    // a packet
    startIndex--;
    endIndex--;
  }
};

/**
 * Adjusts the timestamp information for the segment to account for
 * rollover and convert to seconds based on pes packet timescale (90khz clock)
 */
var adjustTimestamp_ = function(segmentInfo, baseTimestamp) {
  if (segmentInfo.audio && segmentInfo.audio.length) {
    var audioBaseTimestamp = baseTimestamp;
    if (typeof audioBaseTimestamp === 'undefined') {
      audioBaseTimestamp = segmentInfo.audio[0].dts;
    }
    segmentInfo.audio.forEach(function(info) {
      info.dts = handleRollover(info.dts, audioBaseTimestamp);
      info.pts = handleRollover(info.pts, audioBaseTimestamp);
      // time in seconds
      info.dtsTime = info.dts / ONE_SECOND_IN_TS;
      info.ptsTime = info.pts / ONE_SECOND_IN_TS;
    });
  }

  if (segmentInfo.video && segmentInfo.video.length) {
    var videoBaseTimestamp = baseTimestamp;
    if (typeof videoBaseTimestamp === 'undefined') {
      videoBaseTimestamp = segmentInfo.video[0].dts;
    }
    segmentInfo.video.forEach(function(info) {
      info.dts = handleRollover(info.dts, videoBaseTimestamp);
      info.pts = handleRollover(info.pts, videoBaseTimestamp);
      // time in seconds
      info.dtsTime = info.dts / ONE_SECOND_IN_TS;
      info.ptsTime = info.pts / ONE_SECOND_IN_TS;
    });
    if (segmentInfo.firstKeyFrame) {
      var frame = segmentInfo.firstKeyFrame;
      frame.dts = handleRollover(frame.dts, videoBaseTimestamp);
      frame.pts = handleRollover(frame.pts, videoBaseTimestamp);
      // time in seconds
      frame.dtsTime = frame.dts / ONE_SECOND_IN_TS;
      frame.ptsTime = frame.dts / ONE_SECOND_IN_TS;
    }
  }
};

/**
 * inspects the aac data stream for start and end time information
 */
var inspectAac_ = function(bytes) {
  var
    endLoop = false,
    audioCount = 0,
    sampleRate = null,
    timestamp = null,
    frameSize = 0,
    byteIndex = 0,
    packet;

  while (bytes.length - byteIndex >= 3) {
    var type = probe.aac.parseType(bytes, byteIndex);
    switch (type) {
      case 'timed-metadata':
        // Exit early because we don't have enough to parse
        // the ID3 tag header
        if (bytes.length - byteIndex < 10) {
          endLoop = true;
          break;
        }

        frameSize = probe.aac.parseId3TagSize(bytes, byteIndex);

        // Exit early if we don't have enough in the buffer
        // to emit a full packet
        if (frameSize > bytes.length) {
          endLoop = true;
          break;
        }
        if (timestamp === null) {
          packet = bytes.subarray(byteIndex, byteIndex + frameSize);
          timestamp = probe.aac.parseAacTimestamp(packet);
        }
        byteIndex += frameSize;
        break;
      case 'audio':
        // Exit early because we don't have enough to parse
        // the ADTS frame header
        if (bytes.length - byteIndex < 7) {
          endLoop = true;
          break;
        }

        frameSize = probe.aac.parseAdtsSize(bytes, byteIndex);

        // Exit early if we don't have enough in the buffer
        // to emit a full packet
        if (frameSize > bytes.length) {
          endLoop = true;
          break;
        }
        if (sampleRate === null) {
          packet = bytes.subarray(byteIndex, byteIndex + frameSize);
          sampleRate = probe.aac.parseSampleRate(packet);
        }
        audioCount++;
        byteIndex += frameSize;
        break;
      default:
        byteIndex++;
        break;
    }
    if (endLoop) {
      return null;
    }
  }
  if (sampleRate === null || timestamp === null) {
    return null;
  }

  var audioTimescale = ONE_SECOND_IN_TS / sampleRate;

  var result = {
    audio: [
      {
        type: 'audio',
        dts: timestamp,
        pts: timestamp
      },
      {
        type: 'audio',
        dts: timestamp + (audioCount * 1024 * audioTimescale),
        pts: timestamp + (audioCount * 1024 * audioTimescale)
      }
    ]
  };

  return result;
};

/**
 * inspects the transport stream segment data for start and end time information
 * of the audio and video tracks (when present) as well as the first key frame's
 * start time.
 */
var inspectTs_ = function(bytes) {
  var pmt = {
    pid: null,
    table: null
  };

  var result = {};

  parsePsi_(bytes, pmt);

  for (var pid in pmt.table) {
    if (pmt.table.hasOwnProperty(pid)) {
      var type = pmt.table[pid];
      switch (type) {
        case StreamTypes.H264_STREAM_TYPE:
          result.video = [];
          parseVideoPes_(bytes, pmt, result);
          if (result.video.length === 0) {
            delete result.video;
          }
          break;
        case StreamTypes.ADTS_STREAM_TYPE:
          result.audio = [];
          parseAudioPes_(bytes, pmt, result);
          if (result.audio.length === 0) {
            delete result.audio;
          }
          break;
        default:
          break;
      }
    }
  }
  return result;
};

/**
 * Inspects segment byte data and returns an object with start and end timing information
 *
 * @param {Uint8Array} bytes The segment byte data
 * @param {Number} baseTimestamp Relative reference timestamp used when adjusting frame
 *  timestamps for rollover. This value must be in 90khz clock.
 * @return {Object} Object containing start and end frame timing info of segment.
 */
var inspect = function(bytes, baseTimestamp) {
  var isAacData = probe.aac.isLikelyAacData(bytes);

  var result;

  if (isAacData) {
    result = inspectAac_(bytes);
  } else {
    result = inspectTs_(bytes);
  }

  if (!result || (!result.audio && !result.video)) {
    return null;
  }

  adjustTimestamp_(result, baseTimestamp);

  return result;
};

module.exports = {
  inspect: inspect,
  parseAudioPes_: parseAudioPes_
};

},{"../aac/utils.js":3,"../m2ts/probe.js":21,"../m2ts/stream-types.js":22,"../m2ts/timestamp-rollover-stream.js":23,"../utils/clock":48}],47:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
var toUnsigned = function(value) {
  return value >>> 0;
};

var toHexString = function(value) {
  return ('00' + value.toString(16)).slice(-2);
};

module.exports = {
  toUnsigned: toUnsigned,
  toHexString: toHexString
};

},{}],48:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
var
  ONE_SECOND_IN_TS = 90000, // 90kHz clock
  secondsToVideoTs,
  secondsToAudioTs,
  videoTsToSeconds,
  audioTsToSeconds,
  audioTsToVideoTs,
  videoTsToAudioTs,
  metadataTsToSeconds;

secondsToVideoTs = function(seconds) {
  return seconds * ONE_SECOND_IN_TS;
};

secondsToAudioTs = function(seconds, sampleRate) {
  return seconds * sampleRate;
};

videoTsToSeconds = function(timestamp) {
  return timestamp / ONE_SECOND_IN_TS;
};

audioTsToSeconds = function(timestamp, sampleRate) {
  return timestamp / sampleRate;
};

audioTsToVideoTs = function(timestamp, sampleRate) {
  return secondsToVideoTs(audioTsToSeconds(timestamp, sampleRate));
};

videoTsToAudioTs = function(timestamp, sampleRate) {
  return secondsToAudioTs(videoTsToSeconds(timestamp), sampleRate);
};

/**
 * Adjust ID3 tag or caption timing information by the timeline pts values
 * (if keepOriginalTimestamps is false) and convert to seconds
 */
metadataTsToSeconds = function(timestamp, timelineStartPts, keepOriginalTimestamps) {
  return videoTsToSeconds(keepOriginalTimestamps ? timestamp : timestamp - timelineStartPts);
};

module.exports = {
  ONE_SECOND_IN_TS: ONE_SECOND_IN_TS,
  secondsToVideoTs: secondsToVideoTs,
  secondsToAudioTs: secondsToAudioTs,
  videoTsToSeconds: videoTsToSeconds,
  audioTsToSeconds: audioTsToSeconds,
  audioTsToVideoTs: audioTsToVideoTs,
  videoTsToAudioTs: videoTsToAudioTs,
  metadataTsToSeconds: metadataTsToSeconds
};

},{}],49:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 */
'use strict';

var ExpGolomb;

/**
 * Parser for exponential Golomb codes, a variable-bitwidth number encoding
 * scheme used by h264.
 */
ExpGolomb = function(workingData) {
  var
    // the number of bytes left to examine in workingData
    workingBytesAvailable = workingData.byteLength,

    // the current word being examined
    workingWord = 0, // :uint

    // the number of bits left to examine in the current word
    workingBitsAvailable = 0; // :uint;

  // ():uint
  this.length = function() {
    return (8 * workingBytesAvailable);
  };

  // ():uint
  this.bitsAvailable = function() {
    return (8 * workingBytesAvailable) + workingBitsAvailable;
  };

  // ():void
  this.loadWord = function() {
    var
      position = workingData.byteLength - workingBytesAvailable,
      workingBytes = new Uint8Array(4),
      availableBytes = Math.min(4, workingBytesAvailable);

    if (availableBytes === 0) {
      throw new Error('no bytes available');
    }

    workingBytes.set(workingData.subarray(position,
                                          position + availableBytes));
    workingWord = new DataView(workingBytes.buffer).getUint32(0);

    // track the amount of workingData that has been processed
    workingBitsAvailable = availableBytes * 8;
    workingBytesAvailable -= availableBytes;
  };

  // (count:int):void
  this.skipBits = function(count) {
    var skipBytes; // :int
    if (workingBitsAvailable > count) {
      workingWord          <<= count;
      workingBitsAvailable -= count;
    } else {
      count -= workingBitsAvailable;
      skipBytes = Math.floor(count / 8);

      count -= (skipBytes * 8);
      workingBytesAvailable -= skipBytes;

      this.loadWord();

      workingWord <<= count;
      workingBitsAvailable -= count;
    }
  };

  // (size:int):uint
  this.readBits = function(size) {
    var
      bits = Math.min(workingBitsAvailable, size), // :uint
      valu = workingWord >>> (32 - bits); // :uint
    // if size > 31, handle error
    workingBitsAvailable -= bits;
    if (workingBitsAvailable > 0) {
      workingWord <<= bits;
    } else if (workingBytesAvailable > 0) {
      this.loadWord();
    }

    bits = size - bits;
    if (bits > 0) {
      return valu << bits | this.readBits(bits);
    }
    return valu;
  };

  // ():uint
  this.skipLeadingZeros = function() {
    var leadingZeroCount; // :uint
    for (leadingZeroCount = 0; leadingZeroCount < workingBitsAvailable; ++leadingZeroCount) {
      if ((workingWord & (0x80000000 >>> leadingZeroCount)) !== 0) {
        // the first bit of working word is 1
        workingWord <<= leadingZeroCount;
        workingBitsAvailable -= leadingZeroCount;
        return leadingZeroCount;
      }
    }

    // we exhausted workingWord and still have not found a 1
    this.loadWord();
    return leadingZeroCount + this.skipLeadingZeros();
  };

  // ():void
  this.skipUnsignedExpGolomb = function() {
    this.skipBits(1 + this.skipLeadingZeros());
  };

  // ():void
  this.skipExpGolomb = function() {
    this.skipBits(1 + this.skipLeadingZeros());
  };

  // ():uint
  this.readUnsignedExpGolomb = function() {
    var clz = this.skipLeadingZeros(); // :uint
    return this.readBits(clz + 1) - 1;
  };

  // ():int
  this.readExpGolomb = function() {
    var valu = this.readUnsignedExpGolomb(); // :int
    if (0x01 & valu) {
      // the number is odd if the low order bit is set
      return (1 + valu) >>> 1; // add 1 to make it even, and divide by 2
    }
    return -1 * (valu >>> 1); // divide by two then make it negative
  };

  // Some convenience functions
  // :Boolean
  this.readBoolean = function() {
    return this.readBits(1) === 1;
  };

  // ():int
  this.readUnsignedByte = function() {
    return this.readBits(8);
  };

  this.loadWord();
};

module.exports = ExpGolomb;

},{}],50:[function(require,module,exports){
/**
 * mux.js
 *
 * Copyright (c) Brightcove
 * Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
 *
 * A lightweight readable stream implemention that handles event dispatching.
 * Objects that inherit from streams should call init in their constructors.
 */
'use strict';

var Stream = function() {
  this.init = function() {
    var listeners = {};
    /**
     * Add a listener for a specified event type.
     * @param type {string} the event name
     * @param listener {function} the callback to be invoked when an event of
     * the specified type occurs
     */
    this.on = function(type, listener) {
      if (!listeners[type]) {
        listeners[type] = [];
      }
      listeners[type] = listeners[type].concat(listener);
    };
    /**
     * Remove a listener for a specified event type.
     * @param type {string} the event name
     * @param listener {function} a function previously registered for this
     * type of event through `on`
     */
    this.off = function(type, listener) {
      var index;
      if (!listeners[type]) {
        return false;
      }
      index = listeners[type].indexOf(listener);
      listeners[type] = listeners[type].slice();
      listeners[type].splice(index, 1);
      return index > -1;
    };
    /**
     * Trigger an event of the specified type on this stream. Any additional
     * arguments to this function are passed as parameters to event listeners.
     * @param type {string} the event name
     */
    this.trigger = function(type) {
      var callbacks, i, length, args;
      callbacks = listeners[type];
      if (!callbacks) {
        return;
      }
      // Slicing the arguments on every invocation of this method
      // can add a significant amount of overhead. Avoid the
      // intermediate object creation for the common case of a
      // single callback argument
      if (arguments.length === 2) {
        length = callbacks.length;
        for (i = 0; i < length; ++i) {
          callbacks[i].call(this, arguments[1]);
        }
      } else {
        args = [];
        i = arguments.length;
        for (i = 1; i < arguments.length; ++i) {
          args.push(arguments[i]);
        }
        length = callbacks.length;
        for (i = 0; i < length; ++i) {
          callbacks[i].apply(this, args);
        }
      }
    };
    /**
     * Destroys the stream and cleans up.
     */
    this.dispose = function() {
      listeners = {};
    };
  };
};

/**
 * Forwards all `data` events on this stream to the destination stream. The
 * destination stream should provide a method `push` to receive the data
 * events as they arrive.
 * @param destination {stream} the stream that will receive all `data` events
 * @param autoFlush {boolean} if false, we will not call `flush` on the destination
 *                            when the current stream emits a 'done' event
 * @see http://nodejs.org/api/stream.html#stream_readable_pipe_destination_options
 */
Stream.prototype.pipe = function(destination) {
  this.on('data', function(data) {
    destination.push(data);
  });

  this.on('done', function(flushSource) {
    destination.flush(flushSource);
  });

  this.on('partialdone', function(flushSource) {
    destination.partialFlush(flushSource);
  });

  this.on('endedtimeline', function(flushSource) {
    destination.endTimeline(flushSource);
  });

  this.on('reset', function(flushSource) {
    destination.reset(flushSource);
  });

  return destination;
};

// Default stream functions that are expected to be overridden to perform
// actual work. These are provided by the prototype as a sort of no-op
// implementation so that we don't have to check for their existence in the
// `pipe` function above.
Stream.prototype.push = function(data) {
  this.trigger('data', data);
};

Stream.prototype.flush = function(flushSource) {
  this.trigger('done', flushSource);
};

Stream.prototype.partialFlush = function(flushSource) {
  this.trigger('partialdone', flushSource);
};

Stream.prototype.endTimeline = function(flushSource) {
  this.trigger('endedtimeline', flushSource);
};

Stream.prototype.reset = function(flushSource) {
  this.trigger('reset', flushSource);
};

module.exports = Stream;

},{}],51:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _flow = require('../videojs/flow');

var _flow2 = _interopRequireDefault(_flow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Buffer Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var BufferController = function (_EventHandler) {
  _inherits(BufferController, _EventHandler);

  function BufferController(wfs) {
    _classCallCheck(this, BufferController);

    var _this = _possibleConstructorReturn(this, (BufferController.__proto__ || Object.getPrototypeOf(BufferController)).call(this, wfs, _events2.default.MEDIA_ATTACHING, _events2.default.BUFFER_APPENDING, _events2.default.BUFFER_RESET, _events2.default.H264_DATA_PARSING));

    _this.mediaSource = null;
    _this.media = null;
    _this.pendingTracks = {};
    _this.sourceBuffer = {};
    _this.segments = [];

    _this.appended = 0;
    _this._msDuration = null;

    // Source Buffer listeners
    _this.onsbue = _this.onSBUpdateEnd.bind(_this);

    _this.browserType = 0;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      _this.browserType = 1;
    }
    _this.mediaType = 'H264Raw';

    _this.websocketName = undefined;
    _this.channelName = undefined;
    return _this;
  }

  _createClass(BufferController, [{
    key: 'destroy',
    value: function destroy() {
      if (this.flow) this.flow.dispose();
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onMediaAttaching',
    value: function onMediaAttaching(data) {
      var media = this.media = data.media;
      this.mediaType = data.mediaType;
      this.websocketName = data.websocketName;
      this.channelName = data.channelName;
      if (media) {
        // setup the media source
        var ms = this.mediaSource = new MediaSource();
        // link video and media Source
        media.src = URL.createObjectURL(ms);

        //Media Source listeners
        this.onmso = this.onMediaSourceOpen.bind(this);
        this.onmse = this.onMediaSourceEnded.bind(this);
        this.onmsc = this.onMediaSourceClose.bind(this);
        ms.addEventListener('sourceopen', this.onmso);
        ms.addEventListener('sourceended', this.onmse);
        ms.addEventListener('sourceclose', this.onmsc);
      }
    }
  }, {
    key: 'onMediaDetaching',
    value: function onMediaDetaching() {}
  }, {
    key: 'onBufferAppending',
    value: function onBufferAppending(data) {
      if (!this.segments) {
        this.segments = [data];
      } else {
        this.segments.push(data);
      }
      this.doAppending();
    }
  }, {
    key: 'onMediaSourceClose',
    value: function onMediaSourceClose() {
      console.log('media source closed');
    }
  }, {
    key: 'onMediaSourceEnded',
    value: function onMediaSourceEnded() {
      console.log('media source ended');
    }
  }, {
    key: 'onSBUpdateEnd',
    value: function onSBUpdateEnd(event) {
      // Firefox
      if (this.browserType === 1) {
        this.mediaSource.endOfStream();
        this.media.play();
      }

      this.appending = false;
      this.doAppending();
      this.updateMediaElementDuration();
    }
  }, {
    key: 'updateMediaElementDuration',
    value: function updateMediaElementDuration() {}
  }, {
    key: 'onMediaSourceOpen',
    value: function onMediaSourceOpen() {
      var mediaSource = this.mediaSource;
      if (mediaSource) {
        // once received, don't listen anymore to sourceopen event
        mediaSource.removeEventListener('sourceopen', this.onmso);
      }

      var videoSourceBuffer = mediaSource.addSourceBuffer('video/mp4;codecs="avc1.42E01E"');
      this.flow = new _flow2.default();
      this.flow.on('data', function (segment) {
        if (segment.type == 'audio') {
          // sudioSourceBuffer.appendBuffer(segment.data.buffer)
        } else {
          videoSourceBuffer.appendBuffer(segment.data.buffer);
        }
      });

      this.wfs.trigger(_events2.default.MEDIA_ATTACHED, { media: this.media, channelName: this.channelName, mediaType: this.mediaType, websocketName: this.websocketName });
    }
  }, {
    key: 'onH264DataParsing',
    value: function onH264DataParsing(event) {
      var _this2 = this;

      var b = event.data; // Blob: https://developer.mozilla.org/en-US/docs/Web/API/Blob
      var reader = new FileReader();
      reader.addEventListener('loadend', function () {
        var bytes = new Uint8Array(reader.result);
        _this2.flow.transmux(bytes);
      });
      reader.readAsArrayBuffer(b);
    }
  }]);

  return BufferController;
}(_eventHandler2.default);

exports.default = BufferController;

},{"../event-handler":53,"../events":54,"../videojs/flow":61}],52:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Flow Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var FlowController = function (_EventHandler) {
  _inherits(FlowController, _EventHandler);

  function FlowController(wfs) {
    _classCallCheck(this, FlowController);

    var _this = _possibleConstructorReturn(this, (FlowController.__proto__ || Object.getPrototypeOf(FlowController)).call(this, wfs, _events2.default.MEDIA_ATTACHED, _events2.default.BUFFER_CREATED, _events2.default.FILE_PARSING_DATA, _events2.default.FILE_HEAD_LOADED, _events2.default.FILE_DATA_LOADED, _events2.default.WEBSOCKET_ATTACHED, _events2.default.FRAG_PARSING_DATA, _events2.default.FRAG_PARSING_INIT_SEGMENT));

    _this.fileStart = 0;
    _this.fileEnd = 0;
    _this.pendingAppending = 0;
    _this.mediaType = undefined;
    channelName: _this.channelName;
    return _this;
  }

  _createClass(FlowController, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onMediaAttached',
    value: function onMediaAttached(data) {
      if (data.websocketName != undefined) {
        var client = new WebSocket('ws://' + window.location.host + '/' + data.websocketName);
        this.wfs.attachWebsocket(client, data.channelName);
      } else {
        console.log('websocketName ERROE!!!');
      }
    }
  }, {
    key: 'onBufferCreated',
    value: function onBufferCreated(data) {
      this.mediaType = data.mediaType;
    }
  }, {
    key: 'onFileHeadLoaded',
    value: function onFileHeadLoaded(data) {}
  }, {
    key: 'onFileDataLoaded',
    value: function onFileDataLoaded(data) {}
  }, {
    key: 'onFileParsingData',
    value: function onFileParsingData(data) {}
  }, {
    key: 'onWebsocketAttached',
    value: function onWebsocketAttached(data) {
      this.wfs.trigger(_events2.default.BUFFER_APPENDING, { type: 'video', data: data.payload, parent: 'main' });
    }
  }, {
    key: 'onFragParsingInitSegment',
    value: function onFragParsingInitSegment(data) {
      var tracks = data.tracks,
          trackName,
          track;

      track = tracks.video;
      if (track) {
        track.id = data.id;
      }

      for (trackName in tracks) {
        track = tracks[trackName];
        var initSegment = track.initSegment;
        if (initSegment) {
          this.pendingAppending++;
          this.wfs.trigger(_events2.default.BUFFER_APPENDING, { type: trackName, data: initSegment, parent: 'main' });
        }
      }
    }
  }, {
    key: 'onFragParsingData',
    value: function onFragParsingData(data) {
      var _this2 = this;

      if (data.type === 'video') {}

      [data.data1, data.data2].forEach(function (buffer) {
        if (buffer) {
          _this2.pendingAppending++;
          _this2.wfs.trigger(_events2.default.BUFFER_APPENDING, { type: data.type, data: buffer, parent: 'main' });
        }
      });
    }
  }]);

  return FlowController;
}(_eventHandler2.default);

exports.default = FlowController;

},{"../event-handler":53,"../events":54}],53:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * All objects in the event handling chain should inherit from this class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */


var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventHandler = function () {
  function EventHandler(wfs) {
    _classCallCheck(this, EventHandler);

    this.wfs = wfs;
    this.onEvent = this.onEvent.bind(this);

    for (var _len = arguments.length, events = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      events[_key - 1] = arguments[_key];
    }

    this.handledEvents = events;
    this.useGenericHandler = true;

    this.registerListeners();
  }

  _createClass(EventHandler, [{
    key: 'destroy',
    value: function destroy() {
      this.unregisterListeners();
    }
  }, {
    key: 'isEventHandler',
    value: function isEventHandler() {
      return _typeof(this.handledEvents) === 'object' && this.handledEvents.length && typeof this.onEvent === 'function';
    }
  }, {
    key: 'registerListeners',
    value: function registerListeners() {
      if (this.isEventHandler()) {
        this.handledEvents.forEach(function (event) {
          if (event === 'wfsEventGeneric') {
            //throw new Error('Forbidden event name: ' + event);
          }
          this.wfs.on(event, this.onEvent);
        }.bind(this));
      }
    }
  }, {
    key: 'unregisterListeners',
    value: function unregisterListeners() {
      if (this.isEventHandler()) {
        this.handledEvents.forEach(function (event) {
          this.wfs.off(event, this.onEvent);
        }.bind(this));
      }
    }

    /**
     * arguments: event (string), data (any)
     */

  }, {
    key: 'onEvent',
    value: function onEvent(event, data) {
      this.onEventGeneric(event, data);
    }
  }, {
    key: 'onEventGeneric',
    value: function onEventGeneric(event, data) {
      var eventToFunction = function eventToFunction(event, data) {
        var funcName = 'on' + event.replace('wfs', '');
        if (typeof this[funcName] !== 'function') {
          //throw new Error(`Event ${event} has no generic handler in this ${this.constructor.name} class (tried ${funcName})`);
        }
        return this[funcName].bind(this, data);
      };
      try {
        eventToFunction.call(this, event, data).call();
      } catch (err) {
        console.log('internal error happened while processing ' + event + ':' + err.message);
        // this.hls.trigger(Event.ERROR, {type: ErrorTypes.OTHER_ERROR, details: ErrorDetails.INTERNAL_EXCEPTION, fatal: false, event : event, err : err});
      }
    }
  }]);

  return EventHandler;
}();

exports.default = EventHandler;

},{"./events":54}],54:[function(require,module,exports){
'use strict';

module.exports = {

  MEDIA_ATTACHING: 'wfsMediaAttaching',

  MEDIA_ATTACHED: 'wfsMediaAttached',

  FRAG_LOADING: 'wfsFragLoading',

  BUFFER_CREATED: 'wfsBufferCreated',

  BUFFER_APPENDING: 'wfsBufferAppending',

  BUFFER_RESET: 'wfsBufferReset',

  FRAG_PARSING_DATA: 'wfsFragParsingData',

  FRAG_PARSING_INIT_SEGMENT: 'wfsFragParsingInitSegment',
  //------------------------------------------
  H264_DATA_PARSING: 'wfsH264DataParsing',

  H264_DATA_PARSED: 'wfsH264DataParsed',
  //------------------------------------------
  WEBSOCKET_ATTACHED: 'wfsWebsocketAttached',

  WEBSOCKET_ATTACHING: 'wfsWebsocketAttaching',

  WEBSOCKET_DATA_UPLOADING: 'wfsWebsocketDataUploading',

  WEBSOCKET_MESSAGE_SENDING: 'wfsWebsocketMessageSending',

  WEBSOCKET_DATA_SIZE: 'wfsWebsocketDataSize',

  WEBSOCKET_CONNECT: 'wfsWebsocketConnect',

  WEBSOCKET_RECEIVED_MSG: 'wfsWebsocketMsg',
  //------------------------------------------
  FILE_HEAD_LOADING: 'wfsFileHeadLoading',

  FILE_HEAD_LOADED: 'wfsFileHeadLoaded',

  FILE_DATA_LOADING: 'wfsFileDataLoading',

  FILE_DATA_LOADED: 'wfsFileDataLoaded',

  FILE_PARSING_DATA: 'wfsFileParsingData'
  //------------------------------------------

};

},{}],55:[function(require,module,exports){
'use strict';

// This is mostly for support of the es6 module export
// syntax with the babel compiler, it looks like it doesnt support
// function exports like we are used to in node/commonjs
module.exports = require('./player.js').default;

},{"./player.js":58}],56:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Websocket Loader
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

// import SlicesReader from '../utils/h264-nal-slicesreader.js';

var WebsocketLoader = function (_EventHandler) {
  _inherits(WebsocketLoader, _EventHandler);

  function WebsocketLoader(wfs) {
    _classCallCheck(this, WebsocketLoader);

    var _this = _possibleConstructorReturn(this, (WebsocketLoader.__proto__ || Object.getPrototypeOf(WebsocketLoader)).call(this, wfs, _events2.default.WEBSOCKET_ATTACHING, _events2.default.WEBSOCKET_DATA_UPLOADING, _events2.default.WEBSOCKET_MESSAGE_SENDING));

    _this.buf = null;
    // this.slicesReader = new SlicesReader(wfs);
    _this.mediaType = undefined;
    _this.channelName = undefined;
    return _this;
  }

  _createClass(WebsocketLoader, [{
    key: 'destroy',
    value: function destroy() {
      !!this.client && this.client.close();
      // this.slicesReader.destroy();
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onWebsocketAttaching',
    value: function onWebsocketAttaching(data) {
      this.mediaType = data.mediaType;
      this.channelName = data.channelName;
      if (data.websocket instanceof WebSocket) {
        this.client = data.websocket;
        this.client.onopen = this.initSocketClient.bind(this);
        this.client.onclose = function (e) {
          console.log('Websocket Disconnected!');
        };
      }
    }
  }, {
    key: 'initSocketClient',
    value: function initSocketClient(client) {
      // this.client.binaryType = 'arraybuffer';
      this.client.onmessage = this.receiveSocketMessage.bind(this);
      this.wfs.trigger(_events2.default.WEBSOCKET_CONNECT, {});
      // this.wfs.trigger(Event.WEBSOCKET_MESSAGE_SENDING, {commandType: "open", channelName:this.channelName, commandValue:"NA" });
      console.log('Websocket Open!');
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(event) {
      if (document['hidden']) return;
      if (_typeof(event.data).toLowerCase() === 'string') {
        console.log("Received data string");
        this.wfs.trigger(_events2.default.WEBSOCKET_RECEIVED_MSG, event.data);
        return;
      }
      this.wfs.trigger(_events2.default.WEBSOCKET_DATA_SIZE, event.data.size);

      this.wfs.trigger(_events2.default.H264_DATA_PARSING, event);

      // this.buf = new Uint8Array(event.data);
      // var copy = new Uint8Array(this.buf);   

      // if (this.mediaType ==='FMp4'){
      //   this.wfs.trigger(Event.WEBSOCKET_ATTACHED, {payload: copy });
      // } 
      // if (this.mediaType === 'H264Raw'){
      //   this.wfs.trigger(Event.H264_DATA_PARSING, {data: copy });
      // }   
    }
  }, {
    key: 'onWebsocketDataUploading',
    value: function onWebsocketDataUploading(event) {
      this.client.send(event.data);
    }
  }, {
    key: 'onWebsocketMessageSending',
    value: function onWebsocketMessageSending(event) {
      this.client.send(JSON.stringify({ t: event.commandType, c: event.channelName, v: event.commandValue }));
    }
  }]);

  return WebsocketLoader;
}(_eventHandler2.default);

exports.default = WebsocketLoader;

},{"../event-handler":53,"../events":54}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = "\n.wfs-p-layout-view {\n    position: relative;\n    width: 100%;\n    height: 100%\n}\n\n.wfs-p-layout-view .maximize {\n    position: absolute !important;\n    width: 100% !important;\n    height: 100% !important;\n    top: 0 !important;\n    bottom: 0 !important;\n    left: 0 !important;\n    right: 0 !important;\n    border: 1px solid #e8eaec !important;\n    z-index: 10 !important\n}\n\n.wfs-p-layout-view .maximize .exit {\n    content: \"X\";\n    position: absolute;\n    top: 5px;\n    right: 10px;\n    color: #fff;\n    font-size: 20px;\n    cursor: pointer\n}\n\n.wfs-p-layout-view .single-line {\n    overflow-x: auto;\n    width: 100%;\n    height: 100%;\n    -webkit-box-align: center;\n    -ms-flex-align: center;\n    align-items: center\n}\n\n.wfs-p-layout-view .single-line,\n.wfs-p-layout-view .single-line>div {\n    display: -webkit-inline-box;\n    display: -ms-inline-flexbox;\n    display: inline-flex;\n    position: relative\n}\n\n.wfs-p-layout-view .single-line .num {\n    position: relative;\n    width: 320px;\n    height: 240px;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .single-line .num:last-child {\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .single-column {\n    overflow-y: auto;\n    width: 100%;\n    height: 100%;\n    -webkit-box-align: center;\n    -ms-flex-align: center;\n    align-items: center\n}\n\n.wfs-p-layout-view .single-column,\n.wfs-p-layout-view .single-column>div {\n    display: -webkit-inline-box;\n    display: -ms-inline-flexbox;\n    display: inline-flex;\n    position: relative;\n    -webkit-box-orient: vertical;\n    -webkit-box-direction: normal;\n    -ms-flex-direction: column;\n    flex-direction: column\n}\n\n.wfs-p-layout-view .single-column .num {\n    position: relative;\n    width: 281px;\n    height: 180px;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .single-column .num:last-child {\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-1 .num-1 {\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    left: 0;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-2 .num {\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-2 .num-1 {\n    left: 0;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-2 .num-2 {\n    left: 50%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-4 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-4 .num-1 {\n    left: 0;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-4 .num-1,\n.wfs-p-layout-view .layout-4 .num-2 {\n    top: 0;\n    bottom: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-4 .num-2 {\n    left: 50%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-4 .num-3 {\n    top: 50%;\n    bottom: 0;\n    left: 0;\n    right: 50%;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-4 .num-4 {\n    top: 50%;\n    bottom: 0;\n    left: 50%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-6 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-6 .num-1 {\n    top: 0;\n    left: 0;\n    right: 33.333333%;\n    bottom: 33.333333%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-6 .num-2 {\n    top: 0;\n    bottom: 66.666666%\n}\n\n.wfs-p-layout-view .layout-6 .num-2,\n.wfs-p-layout-view .layout-6 .num-3 {\n    left: 66.666666%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-6 .num-3 {\n    top: 33.333333%;\n    bottom: 33.333333%\n}\n\n.wfs-p-layout-view .layout-6 .num-4 {\n    left: 0;\n    right: 66.666666%\n}\n\n.wfs-p-layout-view .layout-6 .num-4,\n.wfs-p-layout-view .layout-6 .num-5 {\n    top: 66.666666%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-6 .num-5 {\n    left: 33.333333%;\n    right: 33.333333%\n}\n\n.wfs-p-layout-view .layout-6 .num-6 {\n    top: 66.666666%;\n    bottom: 0;\n    left: 66.666666%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-8 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-8 .num-1 {\n    top: 0;\n    bottom: 25%;\n    left: 0;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-8 .num-2 {\n    top: 0;\n    bottom: 75%\n}\n\n.wfs-p-layout-view .layout-8 .num-2,\n.wfs-p-layout-view .layout-8 .num-3 {\n    left: 75%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-8 .num-3 {\n    top: 25%;\n    bottom: 50%\n}\n\n.wfs-p-layout-view .layout-8 .num-4 {\n    top: 50%;\n    bottom: 25%;\n    left: 75%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-8 .num-5 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-8 .num-5,\n.wfs-p-layout-view .layout-8 .num-6 {\n    top: 75%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-8 .num-6 {\n    left: 25%;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-8 .num-7 {\n    top: 75%;\n    bottom: 0;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-8 .num-8 {\n    top: 75%;\n    bottom: 0;\n    left: 75%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-9 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-9 .num-1 {\n    left: 0;\n    right: 66.666666%\n}\n\n.wfs-p-layout-view .layout-9 .num-1,\n.wfs-p-layout-view .layout-9 .num-2 {\n    top: 0;\n    bottom: 66.666666%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-9 .num-2 {\n    left: 33.333333%;\n    right: 33.333333%\n}\n\n.wfs-p-layout-view .layout-9 .num-3 {\n    top: 0;\n    bottom: 66.666666%;\n    left: 66.666666%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-9 .num-4 {\n    left: 0;\n    right: 66.666666%\n}\n\n.wfs-p-layout-view .layout-9 .num-4,\n.wfs-p-layout-view .layout-9 .num-5 {\n    top: 33.333333%;\n    bottom: 33.333333%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-9 .num-5 {\n    left: 33.333333%;\n    right: 33.333333%\n}\n\n.wfs-p-layout-view .layout-9 .num-6 {\n    top: 33.333333%;\n    bottom: 33.333333%;\n    left: 66.666666%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-9 .num-7 {\n    left: 0;\n    right: 66.666666%\n}\n\n.wfs-p-layout-view .layout-9 .num-7,\n.wfs-p-layout-view .layout-9 .num-8 {\n    top: 66.666666%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-9 .num-8 {\n    left: 33.333333%;\n    right: 33.333333%\n}\n\n.wfs-p-layout-view .layout-9 .num-9 {\n    top: 66.666666%;\n    bottom: 0;\n    left: 66.666666%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-12 .num-1 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-12 .num-1,\n.wfs-p-layout-view .layout-12 .num-2 {\n    top: 0;\n    bottom: 66.666666%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-2 {\n    left: 25%;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-12 .num-3 {\n    left: 50%;\n    right: 25%\n}\n\n.wfs-p-layout-view .layout-12 .num-3,\n.wfs-p-layout-view .layout-12 .num-4 {\n    top: 0;\n    bottom: 66.666666%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-4 {\n    left: 75%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-5 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-12 .num-5,\n.wfs-p-layout-view .layout-12 .num-6 {\n    top: 33.333333%;\n    bottom: 33.333333%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-6 {\n    left: 25%;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-12 .num-7 {\n    left: 50%;\n    right: 25%\n}\n\n.wfs-p-layout-view .layout-12 .num-7,\n.wfs-p-layout-view .layout-12 .num-8 {\n    top: 33.333333%;\n    bottom: 33.333333%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-8 {\n    left: 75%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-9 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-12 .num-9,\n.wfs-p-layout-view .layout-12 .num-10 {\n    top: 66.666666%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-10 {\n    left: 25%;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-12 .num-11 {\n    top: 66.666666%;\n    bottom: 0;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-12 .num-12 {\n    top: 66.666666%;\n    bottom: 0;\n    left: 75%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-13 .num-1 {\n    top: 25%;\n    bottom: 25%;\n    left: 25%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-2 {\n    top: 0;\n    bottom: 75%;\n    left: 0;\n    right: 75%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-3 {\n    top: 0;\n    bottom: 75%;\n    left: 25%;\n    right: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-4 {\n    top: 0;\n    bottom: 75%;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-5 {\n    top: 0;\n    bottom: 75%;\n    left: 75%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-6 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-13 .num-6,\n.wfs-p-layout-view .layout-13 .num-7 {\n    top: 25%;\n    bottom: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-7 {\n    left: 75%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-8 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-13 .num-8,\n.wfs-p-layout-view .layout-13 .num-9 {\n    top: 50%;\n    bottom: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-9 {\n    left: 75%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-10 {\n    top: 75%;\n    bottom: 0;\n    left: 0;\n    right: 75%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-11 {\n    top: 75%;\n    bottom: 0;\n    left: 25%;\n    right: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-12 {\n    top: 75%;\n    bottom: 0;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-13 .num-13 {\n    top: 75%;\n    bottom: 0;\n    left: 75%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-16 .num-1 {\n    top: 0;\n    bottom: 75%;\n    left: 0;\n    right: 75%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-2 {\n    top: 0;\n    bottom: 75%;\n    left: 25%;\n    right: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-3 {\n    top: 0;\n    bottom: 75%;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-4 {\n    top: 0;\n    bottom: 75%;\n    left: 75%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-5 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-16 .num-5,\n.wfs-p-layout-view .layout-16 .num-6 {\n    top: 25%;\n    bottom: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-6 {\n    left: 25%;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-16 .num-7 {\n    left: 50%;\n    right: 25%\n}\n\n.wfs-p-layout-view .layout-16 .num-7,\n.wfs-p-layout-view .layout-16 .num-8 {\n    top: 25%;\n    bottom: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-8 {\n    left: 75%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-9 {\n    left: 0;\n    right: 75%\n}\n\n.wfs-p-layout-view .layout-16 .num-9,\n.wfs-p-layout-view .layout-16 .num-10 {\n    top: 50%;\n    bottom: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-10 {\n    left: 25%;\n    right: 50%\n}\n\n.wfs-p-layout-view .layout-16 .num-11 {\n    top: 50%;\n    bottom: 25%;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-12 {\n    top: 50%;\n    bottom: 25%;\n    left: 75%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-13 {\n    top: 75%;\n    bottom: 0;\n    left: 0;\n    right: 75%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-14 {\n    top: 75%;\n    bottom: 0;\n    left: 25%;\n    right: 50%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-15 {\n    top: 75%;\n    bottom: 0;\n    left: 50%;\n    right: 25%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-16 .num-16 {\n    top: 75%;\n    bottom: 0;\n    left: 75%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-17 .num-2 {\n    top: 0;\n    bottom: 80%;\n    left: 0;\n    right: 80%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-3 {\n    top: 0;\n    bottom: 80%;\n    left: 20%;\n    right: 60%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-4 {\n    top: 0;\n    bottom: 80%;\n    left: 40%;\n    right: 40%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-5 {\n    top: 0;\n    bottom: 80%;\n    left: 60%;\n    right: 20%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-6 {\n    top: 0;\n    bottom: 80%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-7 {\n    top: 20%;\n    bottom: 60%;\n    left: 0;\n    right: 80%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-1 {\n    top: 20%;\n    bottom: 20%;\n    left: 20%;\n    right: 20%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-8 {\n    top: 20%;\n    bottom: 60%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-9 {\n    left: 0;\n    right: 80%\n}\n\n.wfs-p-layout-view .layout-17 .num-9,\n.wfs-p-layout-view .layout-17 .num-10 {\n    top: 40%;\n    bottom: 40%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-10 {\n    left: 80%;\n    right: 0;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-11 {\n    top: 60%;\n    bottom: 20%;\n    left: 0;\n    right: 80%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-12 {\n    top: 60%;\n    bottom: 20%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-13 {\n    left: 0;\n    right: 80%\n}\n\n.wfs-p-layout-view .layout-17 .num-13,\n.wfs-p-layout-view .layout-17 .num-14 {\n    top: 80%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-14 {\n    left: 20%;\n    right: 60%\n}\n\n.wfs-p-layout-view .layout-17 .num-15 {\n    left: 40%;\n    right: 40%\n}\n\n.wfs-p-layout-view .layout-17 .num-15,\n.wfs-p-layout-view .layout-17 .num-16 {\n    top: 80%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-17 .num-16 {\n    left: 60%;\n    right: 20%\n}\n\n.wfs-p-layout-view .layout-17 .num-17 {\n    top: 80%;\n    bottom: 0;\n    left: 80%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num {\n    position: absolute\n}\n\n.wfs-p-layout-view .layout-25 .num-1 {\n    top: 0;\n    bottom: 80%;\n    left: 0;\n    right: 80%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-2 {\n    top: 0;\n    bottom: 80%;\n    left: 20%;\n    right: 60%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-3 {\n    top: 0;\n    bottom: 80%;\n    left: 40%;\n    right: 40%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-4 {\n    top: 0;\n    bottom: 80%;\n    left: 60%;\n    right: 20%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-5 {\n    top: 0;\n    bottom: 80%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-6 {\n    left: 0;\n    right: 80%\n}\n\n.wfs-p-layout-view .layout-25 .num-6,\n.wfs-p-layout-view .layout-25 .num-7 {\n    top: 20%;\n    bottom: 60%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-7 {\n    left: 20%;\n    right: 60%\n}\n\n.wfs-p-layout-view .layout-25 .num-8 {\n    left: 40%;\n    right: 40%\n}\n\n.wfs-p-layout-view .layout-25 .num-8,\n.wfs-p-layout-view .layout-25 .num-9 {\n    top: 20%;\n    bottom: 60%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-9 {\n    left: 60%;\n    right: 20%\n}\n\n.wfs-p-layout-view .layout-25 .num-10 {\n    top: 20%;\n    bottom: 60%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-11 {\n    top: 40%;\n    bottom: 40%;\n    left: 0;\n    right: 80%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-12 {\n    top: 40%;\n    bottom: 40%;\n    left: 20%;\n    right: 60%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-13 {\n    top: 40%;\n    bottom: 40%;\n    left: 40%;\n    right: 40%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-14 {\n    top: 40%;\n    bottom: 40%;\n    left: 60%;\n    right: 20%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-15 {\n    top: 40%;\n    bottom: 40%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-16 {\n    top: 60%;\n    bottom: 20%;\n    left: 0;\n    right: 80%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-17 {\n    top: 60%;\n    bottom: 20%;\n    left: 20%;\n    right: 60%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-18 {\n    top: 60%;\n    bottom: 20%;\n    left: 40%;\n    right: 40%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-19 {\n    top: 60%;\n    bottom: 20%;\n    left: 60%;\n    right: 20%;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-20 {\n    top: 60%;\n    bottom: 20%;\n    left: 80%;\n    right: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-right: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-21 {\n    left: 0;\n    right: 80%\n}\n\n.wfs-p-layout-view .layout-25 .num-21,\n.wfs-p-layout-view .layout-25 .num-22 {\n    top: 80%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-22 {\n    left: 20%;\n    right: 60%\n}\n\n.wfs-p-layout-view .layout-25 .num-23 {\n    left: 40%;\n    right: 40%\n}\n\n.wfs-p-layout-view .layout-25 .num-23,\n.wfs-p-layout-view .layout-25 .num-24 {\n    top: 80%;\n    bottom: 0;\n    border-top: 1px solid #e8eaec;\n    border-left: 1px solid #e8eaec;\n    border-bottom: 1px solid #e8eaec\n}\n\n.wfs-p-layout-view .layout-25 .num-24 {\n    left: 60%;\n    right: 20%\n}\n\n.wfs-p-layout-view .layout-25 .num-25 {\n    top: 80%;\n    bottom: 0;\n    left: 80%;\n    right: 0;\n    border: 1px solid #e8eaec\n}\n\n.wfsplayer-layout-wrapper {\n    position: relative;\n    width: 100%;\n    height: 100%;\n    font-size: 12px\n}\n\n.wfsplayer-layout-wrapper .player {\n    background-color: #516f8a;\n    z-index: 9\n}\n\n.wfsplayer-layout-wrapper video {\n    width: 100%;\n    height: 100%;\n    -o-object-fit: fill;\n    object-fit: fill\n}\n\n.wfsplayer-layout-wrapper .plate-text {\n    width: calc(100% - 5px);\n    margin-right: 5px;\n    background: transparent;\n    text-align: end;\n    display: block;\n    padding-right: 5px\n}\n\n.wfsplayer-layout-wrapper .ctrl-bar,\n.wfsplayer-layout-wrapper .plate-text {\n    border-radius: 1px;\n    height: 26px;\n    line-height: 26px;\n    color: #fff;\n    font-size: 12px;\n    position: absolute;\n    bottom: 0;\n    -webkit-user-select: none;\n    -moz-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n    -webkit-transition: opacity .3s ease 0s;\n    transition: opacity .3s ease 0s;\n    opacity: 1\n}\n\n.wfsplayer-layout-wrapper .ctrl-bar {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-pack: end;\n    -ms-flex-pack: end;\n    justify-content: flex-end;\n    -ms-flex-wrap: nowrap;\n    flex-wrap: nowrap;\n    -webkit-box-align: center;\n    -ms-flex-align: center;\n    align-items: center;\n    width: calc(100% - 1px);\n    padding-left: 3px;\n    background-color: #fafafa;\n    overflow: hidden\n}\n\n.wfsplayer-layout-wrapper .ctrl-block {\n    margin-right: 2px;\n    width: 26px;\n    height: 100%;\n    background-size: 20px;\n    background-color: initial;\n    color: inherit;\n    -webkit-box-sizing: border-box;\n    box-sizing: border-box;\n    background-repeat: no-repeat;\n    background-position: 50%;\n    overflow: hidden;\n    cursor: pointer\n}\n\n.wfsplayer-layout-wrapper .ctrl-block:hover {\n    border: 1px solid #95a5a6\n}\n\n.wfsplayer-layout-wrapper .ctrl-plate-text {\n    -webkit-box-flex: 1;\n    -ms-flex-positive: 1;\n    flex-grow: 1;\n    color: #5a5a5a;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    overflow: hidden\n}\n\n.wfsplayer-layout-wrapper .ctrl-download-speed {\n    color: #5a5a5a;\n    width: 65px;\n    text-align: end\n}\n\n.wfsplayer-layout-wrapper .ctrl-codetype {\n    color: #4885d4\n}\n\n.wfsplayer-layout-wrapper .ctrl-stop {\n    background-image: url(data:image/png;base64,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)\n}\n\n.wfsplayer-layout-wrapper .ctrl-snapshot {\n    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAgCAYAAACVU7GwAAADCUlEQVRYR81XTVITURD+ehIUq6iSGwBLJCngBISFZlypNwg3wKUMFqHM4FI8AXACceVEFyQnIFQGWRJOIFZpiUqmrR6YYWZ885eklOxS81739/p9/fX3CLfwRx4m3TzeUOLTtD3rxWxPvumvuhVo2tLQ53CctvWy3IqLEwBls3KRw8sS4NHW56caO++GBnQdgBnPm+ulbVW8AKhuXV2p4q5USje7LYCGr5KfhNuWUa4kgkqrwH8BVamfTt67czEfB87h/jYBC2ngs35noKNRYdVb/+PX+FGrPnMu/93rE76Q098hosmsQUe9jpnPWSusfFx7sE9XHUUHI0nCOANxD0zTIEwNFNPhZRqeK7wJB62L/kTHK78vM+6BUWFglUD3s4HkNlUb3S+DXBszjhyi2idjrpOWTH99Ms39/j4RYjnrxZBrJN2M0aeETAy8bRoln6RpoG4EWmSH1CIdCDIAqHh9kbiPt06WPqzNtuOAVhu2VOxJ0kFygWLwV9KKC97Y8QK73cvORkQyegBtWsbcbhCASM/dsW+9JI7lAgXQSjSJbto7AGpxJ2fwftMoPwt+T+v4zKCkSk2jHNKxasNeJcKbdE7xpmWUQ2Os2rA7ccTPDAoIc+mqoy4PM3euVpgJXnsStzKDinZcXtcQdQW6Gd+JmUFF+ZQUVHmdjD1rveRzL4lX/wxUtNIjAXVLry9M9Cx6448Ohb6NhOiSwDJKvlP1LE8Wi6yyvrppnwKYVjrPfLPvb71JI7xqTurmcQ1gEV3lLwfRr/b3QYtRZ/DQPF7QmOvumCFMueMI6MBBPfpqyaJvuUGJjW0apcV0FVev0Bv2AQjKB4O3Izco2Sjz7OfviZWoqUsCKo0xPvZdRlLsnPRBVc3ueXZXeJM26KnTqnatScIhJbFD+xlnlMXfJCWVqgFoaVTsBH2U8KzAPH99VanV8eWD8Z7czeDDtNPm+C5P/PSKKAJKgzjQKq7uuOUl2h34BZIDcexSeQkx16RbQ2Io7YrLy4FOORSuYrEXtDUhUEMFHuHmPyfRoJlWO/FbAAAAAElFTkSuQmCC)\n}\n\n.wfsplayer-layout-wrapper .ctrl-muted {\n    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACp0lEQVRYR8VXTZLSQBh9X4DSKjZ4goGlTii5gcxCyXI8weAJHJcaLLGG6FI8gXgCdBd0IXOCwYLRpdzAcYHllEw+q1PToUk65Icpp5ekyXv9vq/f90K45kXXjI+tCVhH0+aFYZx9tncneQ6Tm0Cz+6Nys7gYgtAUwB4ZDz89u/MhK4lcBMSpmTAkoooEZMbHUcfc1xFo9WaHHtFYp1JmApYz7QL0IgrEx65d99VQl9WbDUA4YMaTUcfsh5+nJhCWPA0BBfzr+bLcHHdrZxsJWK+/V4mxE97keV4F8Aaq5EkE0oCLdwQKCHC+WJ5sBolvMbUHdOD+b4VC1316e66+ZUXgaNqEQV+ydrHYz4xAYh34g1ff9g32hmCM3Y65d6UEksAlWKs3mxDhLoxCTVVhKwXSggsSlnPaBvgdGO/djtmWxHITSALX1dxyZgxg7tpmbSsCSeBBzcEvXbvelWCWMx0DdO/P3/IteSUzK5AELsB8zygtfgLr5hSYmMd77vP6eP0aprgFacDDTefa5uqQ0kXzEEgCF03m2ruDQO7ebA7CzpUQSAT3/Z6rchbIEoj/jTpmI1DFmfUJeIwsCqQDx4Fab1lrBt6ObPMw3ISqKhubMD2474f+NJSWDgKRUWxI04lTJZZANnCFQDCu6dFaT1waUVgVLYHs4CsC4qSl0u9qOHxYl02ZaMX5wFcEdMNMJCIivAnbcMQHmKgvg0PsSCXRcLqlT0T3ndNGAXzC4F9qT0SsWDqYsMjs4PEKSOnjQmskksUlmfgsKM+iV6Dl332aqA2pzQPiR1krtQ/UzUJOg3ngz/XI0hNICjhrCogOvlFctM+X5YEuQCqGEknGm2L5JhKpU3H4JcJw4C0HYryKZ//1w0Qlc22fZkm1Tfs8dwnSAiTt+wevK7s/Y5o+4AAAAABJRU5ErkJggg==)\n}\n\n.wfsplayer-layout-wrapper .ctrl-volume {\n    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACjElEQVRYR+2W0W4SURCGZ5Y2mNSk9Amkl9ol1DeAC2XvhCfo9gnkVhfTTWT1svoE8Ab2clcv5A1qwlYv0SewJjTBCGfMLD317AG2uxZKYuSG5HA4880//5k5CGv+4Jrjw78BUHEHhfzm8IAw9+398wcnWVS9sQKPX32uo5h0ELFAROdBq7RzKwCXWXcQsK4G9B0zU1KZNstAtXbYBKAjzlrPdqUA1usvRZhMOoBQWSSzDmB5ZzYQHYzGW42eu3uu/y+1AklZJ5WAS3Vnc3hCBGWBRvWDs/dJ3T8XwHrZr2Bug3ijEKKAQM2krNN4wGqHXQJ68nN8d1dVIgagOjqLk3WAKOv8qOA/u/9V/c3y+j0C3A4c86FcvwLg+tJkfDrPWFlg2AOciEHiHQAe+s5eV/5/Wo6L7yCo6r8o9Xj9DwCbBaiTJdi8vdKEkfn4PCUY7+dS8LffMm0NoO8C4NGyAPicmhe+QYKy3zKr8lypjgRVFFg+wCPvbD8HdKpeTbk2+rW1w2ZcKUAkuRfSTBmUtZUC6NlGQNzMxGRwKwpYXt8lwnrQMvelB7jHgIEfZzzAnQ4RjpdlQpm9QKOhjujoFiAVfacUtfNYH2BplgEgnU4AbwPHbKp9IL8xHJCRO5RQsU54dXdvQMHScvaIWNQfJ7V2yI+VolqSmVkwNYmoAIii5CCAJgJup+FaNI4jPwA0BRgVdSClmobTx8eFiwBPr4PQAS7b7zEBNQhztq5KKoCYgxG7gHBvEYgOMB3jYAtEWx/FMRNel1nMSAlqrPRFpEKy0QyiLiKU9XGcNpm/UkA/nM0lhxgB/Qic0sw7MQkokwcWHTS9OWMbBPTknE+rwlIA0gabt+8/wNoV+A2EdkkwivO81wAAAABJRU5ErkJggg==)\n}\n\n.wfsplayer-layout-wrapper .ctrl-fullscreen {\n    background-image: url(data:image/png;base64,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)\n}\n\n.wfsplayer-layout-wrapper .ctrl-minimize {\n    background-image: url(data:image/png;base64,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)\n}\n\n.wfsplayer-layout-wrapper .ctrl-pause {\n    background-image: url(data:image/png;base64,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)\n}\n\n.wfsplayer-layout-wrapper .ctrl-playing {\n    background-image: url(data:image/png;base64,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)\n}\n\n.wfsplayer-layout-wrapper .ctrl-download {\n    background-image: url(data:image/png;base64,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)\n}\n\n.wfsplayer-layout-wrapper .ctrl-codetype-pane {\n    position: absolute;\n    bottom: 26px;\n    width: 60px;\n    background-color: rgba(0, 0, 0, .5);\n    color: #fff;\n    right: 100px;\n    cursor: pointer\n}\n\n.wfsplayer-layout-wrapper .ctrl-codetype-pane .codetype-item {\n    padding: 5px 0;\n    text-align: center\n}\n\n.wfsplayer-layout-wrapper .ctrl-codetype-pane .codetype-item:hover {\n    background-color: rgba(41, 182, 246, .4)\n}\n\n.wfsplayer-layout-wrapper .log-pane {\n    border-radius: 1px;\n    width: 100%;\n    height: 40%;\n    line-height: 16px;\n    color: #fff;\n    font-size: 12px;\n    padding-left: 8px;\n    padding-right: 5px;\n    background: transparent;\n    position: absolute;\n    bottom: 0;\n    text-align: center;\n    -webkit-box-align: center;\n    -ms-flex-align: center;\n    align-items: center;\n    -webkit-box-pack: center;\n    -ms-flex-pack: center;\n    justify-content: center;\n    -webkit-user-select: none;\n    -moz-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n    -webkit-transition: opacity .3s ease 0s;\n    transition: opacity .3s ease 0s\n}\n\n.wfsplayer-layout-wrapper .log-pane .log-line {\n    line-height: 16px;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    overflow: hidden;\n    font-size: 13px\n}\n\n.wfsplayer-layout-wrapper .replay-pane {\n    border-radius: 1px;\n    width: 100%;\n    height: 100%;\n    color: #fff;\n    background: transparent;\n    position: absolute;\n    bottom: 0;\n    -webkit-box-align: center;\n    -ms-flex-align: center;\n    align-items: center;\n    -webkit-box-pack: center;\n    -ms-flex-pack: center;\n    justify-content: center;\n    -webkit-user-select: none;\n    -moz-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex\n}\n\n.wfsplayer-layout-wrapper .replay-pane .replay-img {\n    width: 44px;\n    height: 44px;\n    cursor: pointer;\n    background-image: url(data:image/png;base64,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);\n    background-repeat: round\n}\n\n.wfsplayer-layout-wrapper .replay-pane .replay-img:hover {\n    background-image: url(data:image/png;base64,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)\n}\n";

},{}],58:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('./event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _wfs = require('./wfs');

var _wfs2 = _interopRequireDefault(_wfs);

var _playerCss = require('./player.css.js');

var _playerCss2 = _interopRequireDefault(_playerCss);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WFS interface, Jeff Yang 2016.10
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */
// 'use strict';

var Status = {
    IDEL: "idel",
    PLAYING: 'playing',
    PAUSE: 'pause',
    STOP: 'stop'
};

var WfsHandler = function (_EventHandler) {
    _inherits(WfsHandler, _EventHandler);

    function WfsHandler(wfs, player) {
        _classCallCheck(this, WfsHandler);

        var _this = _possibleConstructorReturn(this, (WfsHandler.__proto__ || Object.getPrototypeOf(WfsHandler)).call(this, wfs, _events2.default.MEDIA_ATTACHING, _events2.default.BUFFER_CREATED, _events2.default.FRAG_PARSING_INIT_SEGMENT, _events2.default.WEBSOCKET_DATA_SIZE, _events2.default.WEBSOCKET_RECEIVED_MSG, _events2.default.WEBSOCKET_CONNECT));

        _this.lastReceviedTime = new Date();

        _this.player = player;

        _this.size = 0;
        _this.timeid = setInterval(function () {
            if (_this.player.status == Status.PLAYING) {
                if (new Date().getTime() - _this.lastReceviedTime.getTime() > _this.player.config.timeout * 1000) {
                    //长时间未收到视频数据，断开视频
                    _this.player.stop();
                    _this.player.showMsg('视频信号中断，请重新开始！');
                }
            }
            _this.player.updateNetworkSpeed((_this.size / 1024.0).toFixed(2));
            _this.size = 0;
        }, 1000);
        return _this;
    }

    _createClass(WfsHandler, [{
        key: 'destroy',
        value: function destroy() {
            this.player.updateNetworkSpeed('0.00');
            clearInterval(this.timeid);
            _eventHandler2.default.prototype.destroy.call(this);
        }
    }, {
        key: 'onMediaAttaching',
        value: function onMediaAttaching() {
            this.player.showMsg('正在请求视频。。。');
            console.log('wfsMediaAttaching');
        }
    }, {
        key: 'onBufferCreated',
        value: function onBufferCreated() {
            //
            this.player.showMsg('设备响应成功，视频加载中。');
            console.log('onBufferCreated');
        }
    }, {
        key: 'onFragParsingInitSegment',
        value: function onFragParsingInitSegment() {
            //第一帧
            this.player.hideMsg();
            console.log('onFragParsingInitSegment');
        }
    }, {
        key: 'onWebsocketDataSize',
        value: function onWebsocketDataSize(size) {
            this.size += size;
            this.lastReceviedTime = new Date();
        }
    }, {
        key: 'onWebsocketMsg',
        value: function onWebsocketMsg(data) {
            try {
                var res = JSON.parse(data || '');
                if (res && res.resultCode) {
                    this.player.stop();
                    this.player.showMsg(res.resultMsg || '');
                }
            } catch (e) {}
        }
    }, {
        key: 'onWebsocketConnect',
        value: function onWebsocketConnect() {
            if (!this.player.config.isReal && this.player.config.recodeData) {
                this.player.client && this.player.client.send(this.player.config.recodeData);
            }

            if (this.player.client) {
                this.player.heart();
            }
            // if(this.player.client){
            //     // 发送开始指令
            //     this.player.client.send(`{"url":"${this.player.config.baseUrl}/iot/jt808-out/cameraVedio",
            //     "token":"${this.player.config.token}","temiCode":"${this.player.config.temiCode}",
            //     "channelId":${this.player.config.channel},"streamType":1,"dataType":1}`
            //     )
            // }
        }
    }]);

    return WfsHandler;
}(_eventHandler2.default);

var WfsPlayer = function () {
    _createClass(WfsPlayer, null, [{
        key: 'DefaultConfig',
        get: function get() {
            if (!WfsPlayer.defaultConfig) {
                WfsPlayer.defaultConfig = {
                    id: 'video-container',
                    deviceName: '测试设备',
                    channel: 1,
                    url: 'ws://127.0.0.1:8094/websocket',
                    baseUrl: 'http://192.168.1.217:8100',
                    token: '',
                    temiCode: '',
                    poster: '',
                    timeout: 30,
                    isReal: true //默认是直播
                };
            }
            return WfsPlayer.defaultConfig;
        }
    }]);

    function WfsPlayer() {
        var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, WfsPlayer);

        var defaultConfig = WfsPlayer.DefaultConfig;
        for (var prop in defaultConfig) {
            if (prop in config) {
                continue;
            }
            config[prop] = defaultConfig[prop];
        }
        this.config = config;

        this.status = Status.IDEL;

        WfsPlayer.createStyle();
        this.container = document.querySelector("#" + this.config.id);
        this.container.innerHTML = this.createEl();
        this.media = this.container.querySelector('#container_video_1');

        this.initEvent();
    }

    _createClass(WfsPlayer, [{
        key: 'play',
        value: function play(config) {
            if (config && config.recodeData) {
                this.config.recodeData = config.recodeData;
                this.config.channel = config.channel;
                this.config.url = config.url;
            }
            if (!this.config.isReal && !this.config.recodeData) {
                //没有回放数据则不播放
                return;
            }

            if (this.status == Status.PLAYING) {
                this.stop();
            }
            this.status = Status.PLAYING;

            try {
                this.container.querySelector('.ctrl-stop')['style'] = "";
                this.container.querySelector('.ctrl-playing')['style'] = "display:none;";
                this.container.querySelector('.replay-pane')['style'] = "display:none;";
            } catch (e) {}

            if (!this.client || this.client.readyState == 3) {
                this.wfs = new _wfs2.default();
                this.wfsHandler = new WfsHandler(this.wfs, this);
                this.wfs.attachMedia(this.media);
                this.client = new WebSocket(this.config.url);
                var self = this;
                this.client.onclose = function (e) {
                    self.stop();
                    self.showMsg('视频信号已中断，请重新开始！');
                };
                this.wfs.attachWebsocket(this.client);
            }

            // if(this.client && this.client.readyState == 1){
            //     //恢复播放指令
            //     this.client.send(`{"url":"${this.config.baseUrl}/iot/jt808-out/controllVedio",
            //     "token":"${this.config.token}","temiCode":"${this.config.temiCode}",
            //     "channelId":${this.config.channel},"controllCommand":3,"changeStreamType":1,"audioOrVedio":2}`
            //     )
            // }
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._heart && clearInterval(this._heart);
            this._heart = null;

            this.status = Status.STOP;
            this.media.src = '/';

            try {
                this.container.querySelector('.ctrl-stop')['style'] = "display:none;";
                this.container.querySelector('.ctrl-playing')['style'] = "";
                this.container.querySelector('.replay-pane')['style'] = "";
            } catch (e) {}

            this.hideMsg();

            // if(this.client && this.client.readyState == 1){
            //     //暂停播放指令
            //         this.client.send(`{"url":"${this.config.baseUrl}/iot/jt808-out/controllVedio",
            //     "token":"${this.config.token}","temiCode":"${this.config.temiCode}",
            //     "channelId":${this.config.channel},"controllCommand":2,"changeStreamType":1,"audioOrVedio":2}`
            //     )
            // }

            this.wfsHandler && this.wfsHandler.destroy();
            this.wfs && this.wfs.destroy();
            this.client = null;
        }
    }, {
        key: 'heart',
        value: function heart() {
            var _this2 = this;

            this._heart = setInterval(function () {
                if (_this2.client && _this2.client.readyState == 1) {
                    //心跳指令
                    _this2.client.send('heart');
                }
            }, 5000);
        }
        //进入全屏

    }, {
        key: 'FullScreen',
        value: function FullScreen() {
            var ele = this.container;
            if (ele.requestFullscreen) {
                ele.requestFullscreen();
            } else if (ele.mozRequestFullScreen) {
                ele.mozRequestFullScreen();
            } else if (ele.webkitRequestFullScreen) {
                ele.webkitRequestFullScreen();
            }
        }

        //退出全屏

    }, {
        key: 'exitFullscreen',
        value: function exitFullscreen() {
            var de = document;
            if (de.exitFullscreen) {
                de.exitFullscreen();
            } else if (de.mozCancelFullScreen) {
                de.mozCancelFullScreen();
            } else if (de.webkitCancelFullScreen) {
                de.webkitCancelFullScreen();
            }
        }
    }, {
        key: 'initEvent',
        value: function initEvent() {
            var self = this;
            this.media.addEventListener('playing', function () {
                self.hideMsg();
            }, false);
            this.media.addEventListener('canplay', function () {
                self.media.play();
            }, false);

            this.container.querySelector('.replay-img').addEventListener('click', function () {
                self.media.load();
                self.play();
            });
            this.container.querySelector('.ctrl-playing').addEventListener('click', function () {
                self.media.load();
                self.play();
            });
            this.container.querySelector('.ctrl-stop').onclick = function () {
                self.stop();
            };
            this.container.querySelector('.ctrl-fullscreen').onclick = function () {
                try {
                    self.container.querySelector('.ctrl-fullscreen')['style'] = 'display: none;';
                    self.container.querySelector('.ctrl-minimize')['style'] = '';
                } catch (e) {}

                self.FullScreen();
            };
            this.container.querySelector('.ctrl-minimize').onclick = function () {
                try {
                    self.container.querySelector('.ctrl-minimize')['style'] = 'display: none;';
                    self.container.querySelector('.ctrl-fullscreen')['style'] = '';
                } catch (e) {}

                self.exitFullscreen();
            };

            this.container.querySelector('#container_1').onmouseover = function () {
                try {
                    self.container.querySelector('.ctrl-bar')['style'] = "";
                } catch (e) {}
            };
            this.container.querySelector('#container_1').onmouseout = function () {
                try {
                    self.container.querySelector('.ctrl-bar')['style'] = "display: none;";
                } catch (e) {}
            };
        }
    }, {
        key: 'showMsg',
        value: function showMsg(msg) {
            try {
                var log = this.container.querySelector('.log-pane');
                log['style'] = "display: block;";
                log.innerHTML = msg;
            } catch (e) {}
        }
    }, {
        key: 'hideMsg',
        value: function hideMsg() {
            try {
                this.container.querySelector('.log-pane')['style'] = "display: none;";
            } catch (e) {}
        }
    }, {
        key: 'updateNetworkSpeed',
        value: function updateNetworkSpeed() {
            var speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '0.00';

            try {
                var el = this.container.querySelector('.plate-text');
                el.innerHTML = speed + 'KB/s ' + this.config.deviceName + ' &amp; ' + this.config.channel;

                el = this.container.querySelector('.ctrl-download-speed');
                el.innerHTML = speed + 'KB/s';
            } catch (e) {}
        }
    }, {
        key: 'createEl',
        value: function createEl(name, poster) {
            var content = this.createVideoEl(1, name, poster);
            return '<div class="wfs-p-layout-view wfsplayer-layout-wrapper"><div class="layout-1"><div>' + content + '</div></div></div>';
        }
    }, {
        key: 'createVideoEl',
        value: function createVideoEl(index) {
            document.createElement('div');
            return '<div id="container_' + index + '" draggable="true" class="player num num-' + index + '">\n        <video id="container_video_' + index + '" autoplay="autoplay" preload="none" muted="muted" type="video/mp4" poster="/poster.png">\n            <audio id="container_audio_' + index + '" muted="muted" autoplay="autoplay" ></audio>\n        </video>\n                <div class="log-pane" style="display: none;"></div>\n                <div class="replay-pane" style="">\n                    <div class="replay-img"></div>\n                </div>\n                <div class="plate-text">0.00KB/s ' + this.config.deviceName + ' &amp; ' + this.config.channel + '</div>\n                <div class="ctrl-bar" style="display: none;">\n                    <div class="ctrl-block ctrl-plate-text">' + this.config.deviceName + ' &amp; ' + this.config.channel + '</div>\n                    <div class="ctrl-block ctrl-download-speed">0.00KB/s</div>\n                    <div class="ctrl-block ctrl-codetype" style="">\u6807\u6E05</div>\n                    <div title="\u505C\u6B62" class="ctrl-block ctrl-stop"></div>\n                    <div class="ctrl-block ctrl-playing" style="display: none;"></div>\n                    <div title="\u622A\u56FE" class="ctrl-block ctrl-snapshot" style="display: none;"></div>\n                    <div title="\u5F00\u542F\u97F3\u9891" class="ctrl-block ctrl-muted" style="display: none;"></div>\n                    <div title="\u5168\u5C4F" class="ctrl-block ctrl-fullscreen"></div>\n                    <div title="\u9000\u51FA\u5168\u5C4F" class="ctrl-block ctrl-minimize" style="display: none;"></div>\n                    <div class="ctrl-block ctrl-download" style="display: none;"></div>\n                </div>\n                <div class="ctrl-codetype-pane" style="display: none;">\n                    <div class="codetype-item">\u9AD8\u6E05</div>\n                    <div class="codetype-item">\u6807\u6E05</div>\n                </div>\n            </div>';
        }
    }], [{
        key: 'createStyle',
        value: function createStyle() {
            if (WfsPlayer.__create_style) return;
            WfsPlayer.__create_style = true;
            var style = document.createElement("style");
            style.type = "text/css";
            style.innerHTML = _playerCss2.default;
            document.getElementsByTagName("HEAD").item(0).appendChild(style);
        }
    }]);

    return WfsPlayer;
}();

exports.default = WfsPlayer;

},{"./event-handler":53,"./events":54,"./player.css.js":57,"./wfs":62}],59:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * XHR based logger
*/

var XhrLoader = function () {
  function XhrLoader(config) {
    _classCallCheck(this, XhrLoader);

    if (config && config.xhrSetup) {
      this.xhrSetup = config.xhrSetup;
    }
  }

  _createClass(XhrLoader, [{
    key: 'destroy',
    value: function destroy() {
      this.abort();
      this.loader = null;
    }
  }, {
    key: 'abort',
    value: function abort() {
      var loader = this.loader;
      if (loader && loader.readyState !== 4) {
        this.stats.aborted = true;
        loader.abort();
      }

      window.clearTimeout(this.requestTimeout);
      this.requestTimeout = null;
      window.clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }, {
    key: 'loadHead',
    value: function loadHead(context, config, callbacks) {
      this.context = context;
      this.config = config;
      this.callbacks = callbacks;
      this.stats = { trequest: performance.now(), retry: 0 };
      this.retryDelay = config.retryDelay;
      var xhr = new XMLHttpRequest();
      xhr.open('head', context.url);
      xhr.onload = function () {
        callbacks.onSuccess(xhr.getResponseHeader('content-length'));
      };
      xhr.send();
    }
  }, {
    key: 'load',
    value: function load(context, config, callbacks) {
      this.context = context;
      this.config = config;
      this.callbacks = callbacks;
      this.stats = { trequest: performance.now(), retry: 0 };
      this.retryDelay = config.retryDelay;
      this.loadInternal();
    }
  }, {
    key: 'loadInternal',
    value: function loadInternal() {
      var xhr,
          context = this.context;
      if (typeof XDomainRequest !== 'undefined') {
        xhr = this.loader = new XDomainRequest();
      } else {
        xhr = this.loader = new XMLHttpRequest();
      }
      xhr.onloadend = this.loadend.bind(this);
      xhr.onprogress = this.loadprogress.bind(this);
      xhr.open('GET', context.url, true);
      if (context.rangeEnd) {
        xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1));
      }
      xhr.responseType = context.responseType;
      var stats = this.stats;
      stats.tfirst = 0;
      stats.loaded = 0;
      if (this.xhrSetup) {
        this.xhrSetup(xhr, context.url);
      }
      // setup timeout before we perform request
      this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), this.config.timeout);
      xhr.send();
    }
  }, {
    key: 'loadend',
    value: function loadend(event) {
      var xhr = event.currentTarget,
          status = xhr.status,
          stats = this.stats,
          context = this.context,
          config = this.config;
      // don't proceed if xhr has been aborted
      if (stats.aborted) {
        return;
      }
      // in any case clear the current xhrs timeout
      window.clearTimeout(this.requestTimeout);

      // http status between 200 to 299 are all successful
      if (status >= 200 && status < 300) {
        stats.tload = Math.max(stats.tfirst, performance.now());
        var data = void 0,
            len = void 0;
        if (context.responseType === 'arraybuffer') {
          data = xhr.response;
          len = data.byteLength;
        } else {
          data = xhr.responseText;
          len = data.length;
        }
        stats.loaded = stats.total = len;
        var response = { url: xhr.responseURL, data: data };
        this.callbacks.onSuccess(response, stats, context);
      } else {
        // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
        if (stats.retry >= config.maxRetry || status >= 400 && status < 499) {
          //  logger.error(`${status} while loading ${context.url}` );
          this.callbacks.onError({ code: status, text: xhr.statusText }, context);
        } else {
          // retry
          //  logger.warn(`${status} while loading ${context.url}, retrying in ${this.retryDelay}...`);
          // aborts and resets internal state
          this.destroy();
          // schedule retry
          this.retryTimeout = window.setTimeout(this.loadInternal.bind(this), this.retryDelay);
          // set exponential backoff
          this.retryDelay = Math.min(2 * this.retryDelay, config.maxRetryDelay);
          stats.retry++;
        }
      }
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout() {
      //  logger.warn(`timeout while loading ${this.context.url}` );
      this.callbacks.onTimeout(this.stats, this.context);
    }
  }, {
    key: 'loadprogress',
    value: function loadprogress(event) {
      var stats = this.stats;
      if (stats.tfirst === 0) {
        stats.tfirst = Math.max(performance.now(), stats.trequest);
      }
      stats.loaded = event.loaded;
      if (event.lengthComputable) {
        stats.total = event.total;
      }
      var onProgress = this.callbacks.onProgress;
      if (onProgress) {
        // last args is to provide on progress data
        onProgress(stats, this.context, null);
      }
    }
  }]);

  return XhrLoader;
}();

exports.default = XhrLoader;

},{}],60:[function(require,module,exports){
'use strict';

var _mux = require('mux.js');

var _mux2 = _interopRequireDefault(_mux);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mp4InitSegment(tracks) {
    return _mux2.default.mp4.generator.initSegment(tracks);
}

/**
 * mux.js
 *
 * Copyright (c) 2014 Brightcove
 * All rights reserved.
 *
 * A lightweight readable stream implemention that handles event dispatching.
 * Objects that inherit from streams should call init in their constructors.
 */
var Stream = function Stream() {
    this.init = function () {
        var listeners = {};
        /**
         * Add a listener for a specified event type.
         * @param type {string} the event name
         * @param listener {function} the callback to be invoked when an event of
         * the specified type occurs
         */
        this.on = function (type, listener) {
            if (!listeners[type]) {
                listeners[type] = [];
            }
            listeners[type].push(listener);
        };
        /**
         * Remove a listener for a specified event type.
         * @param type {string} the event name
         * @param listener {function} a function previously registered for this
         * type of event through `on`
         */
        this.off = function (type, listener) {
            var index;
            if (!listeners[type]) {
                return false;
            }
            index = listeners[type].indexOf(listener);
            listeners[type].splice(index, 1);
            return index > -1;
        };
        /**
         * Trigger an event of the specified type on this stream. Any additional
         * arguments to this function are passed as parameters to event listeners.
         * @param type {string} the event name
         */
        this.trigger = function (type) {
            var callbacks, i, length, args;
            callbacks = listeners[type];
            if (!callbacks) {
                return;
            }
            // Slicing the arguments on every invocation of this method
            // can add a significant amount of overhead. Avoid the
            // intermediate object creation for the common case of a
            // single callback argument
            if (arguments.length === 2) {
                length = callbacks.length;
                for (i = 0; i < length; ++i) {
                    callbacks[i].call(this, arguments[1]);
                }
            } else {
                args = [];
                i = arguments.length;
                for (i = 1; i < arguments.length; ++i) {
                    args.push(arguments[i]);
                }
                length = callbacks.length;
                for (i = 0; i < length; ++i) {
                    callbacks[i].apply(this, args);
                }
            }
        };
        /**
         * Destroys the stream and cleans up.
         */
        this.dispose = function () {
            listeners = {};
        };
    };
};

/**
 * Forwards all `data` events on this stream to the destination stream. The
 * destination stream should provide a method `push` to receive the data
 * events as they arrive.
 * @param destination {stream} the stream that will receive all `data` events
 * @param autoFlush {boolean} if false, we will not call `flush` on the destination
 *                            when the current stream emits a 'done' event
 * @see http://nodejs.org/api/stream.html#stream_readable_pipe_destination_options
 */
Stream.prototype.pipe = function (destination) {
    this.on('data', function (data) {
        destination.push(data);
    });

    this.on('done', function (flushSource) {
        destination.flush(flushSource);
    });

    return destination;
};

// Default stream functions that are expected to be overridden to perform
// actual work. These are provided by the prototype as a sort of no-op
// implementation so that we don't have to check for their existence in the
// `pipe` function above.
Stream.prototype.push = function (data) {
    this.trigger('data', data);
};

Stream.prototype.flush = function (flushSource) {
    this.trigger('done', flushSource);
};

/**
 * A Stream that can combine multiple streams (ie. audio & video)
 * into a single output segment for MSE. Also supports audio-only
 * and video-only streams.
 */
var CoalesceStream = function CoalesceStream(options, metadataStream) {
    // Number of Tracks per output segment
    // If greater than 1, we combine multiple
    // tracks into a single segment
    this.numberOfTracks = 0;
    this.metadataStream = metadataStream;

    if (typeof options.remux !== 'undefined') {
        this.remuxTracks = !!options.remux;
    } else {
        this.remuxTracks = true;
    }

    this.pendingTracks = [];
    this.videoTrack = null;
    this.pendingBoxes = [];
    this.pendingCaptions = [];
    this.pendingMetadata = [];
    this.pendingBytes = 0;
    this.emittedTracks = 0;

    CoalesceStream.prototype.init.call(this);

    // Take output from multiple
    this.push = function (output) {
        // buffer incoming captions until the associated video segment
        // finishes
        if (output.text) {
            return this.pendingCaptions.push(output);
        }
        // buffer incoming id3 tags until the final flush
        if (output.frames) {
            return this.pendingMetadata.push(output);
        }

        // Add this track to the list of pending tracks and store
        // important information required for the construction of
        // the final segment
        this.pendingTracks.push(output.track);
        this.pendingBoxes.push(output.boxes);
        this.pendingBytes += output.boxes.byteLength;

        if (output.track.type === 'video') {
            this.videoTrack = output.track;
        }
        if (output.track.type === 'audio') {
            this.audioTrack = output.track;
        }
    };
};

// constants
var AUDIO_PROPERTIES = ['audioobjecttype', 'channelcount', 'samplerate', 'samplingfrequencyindex', 'samplesize'];

var VIDEO_PROPERTIES = ['width', 'height', 'profileIdc', 'levelIdc', 'profileCompatibility'];

CoalesceStream.prototype = new Stream();
CoalesceStream.prototype.flush = function (flushSource) {
    var offset = 0,
        event = {
        captions: [],
        metadata: [],
        info: {}
    },
        caption,
        id3,
        initSegment,
        timelineStartPts = 0,
        i;

    if (this.pendingTracks.length < this.numberOfTracks) {
        if (flushSource !== 'VideoSegmentStream' && flushSource !== 'AudioSegmentStream') {
            // Return because we haven't received a flush from a data-generating
            // portion of the segment (meaning that we have only recieved meta-data
            // or captions.)
            return;
        } else if (this.remuxTracks) {
            // Return until we have enough tracks from the pipeline to remux (if we
            // are remuxing audio and video into a single MP4)
            return;
        } else if (this.pendingTracks.length === 0) {
            // In the case where we receive a flush without any data having been
            // received we consider it an emitted track for the purposes of coalescing
            // `done` events.
            // We do this for the case where there is an audio and video track in the
            // segment but no audio data. (seen in several playlists with alternate
            // audio tracks and no audio present in the main TS segments.)
            this.emittedTracks++;

            if (this.emittedTracks >= this.numberOfTracks) {
                this.trigger('done');
                this.emittedTracks = 0;
            }
            return;
        }
    }

    if (this.videoTrack) {
        timelineStartPts = this.videoTrack.timelineStartInfo.pts;
        VIDEO_PROPERTIES.forEach(function (prop) {
            event.info[prop] = this.videoTrack[prop];
        }, this);
    } else if (this.audioTrack) {
        timelineStartPts = this.audioTrack.timelineStartInfo.pts;
        AUDIO_PROPERTIES.forEach(function (prop) {
            event.info[prop] = this.audioTrack[prop];
        }, this);
    }

    if (this.pendingTracks.length === 1) {
        event.type = this.pendingTracks[0].type;
    } else {
        event.type = 'combined';
    }

    this.emittedTracks += this.pendingTracks.length;

    initSegment = mp4InitSegment(this.pendingTracks);

    // Create a new typed array large enough to hold the init
    // segment and all tracks
    event.data = new Uint8Array(initSegment.byteLength + this.pendingBytes);

    // Create an init segment containing a moov
    // and track definitions
    event.data.set(initSegment);
    offset += initSegment.byteLength;

    // Append each moof+mdat (one per track) after the init segment
    for (i = 0; i < this.pendingBoxes.length; i++) {
        event.data.set(this.pendingBoxes[i], offset);
        offset += this.pendingBoxes[i].byteLength;
    }

    // Translate caption PTS times into second offsets into the
    // video timeline for the segment
    for (i = 0; i < this.pendingCaptions.length; i++) {
        caption = this.pendingCaptions[i];
        caption.startTime = caption.startPts - timelineStartPts;
        caption.startTime /= 90e3;
        caption.endTime = caption.endPts - timelineStartPts;
        caption.endTime /= 90e3;
        event.captions.push(caption);
    }

    // Translate ID3 frame PTS times into second offsets into the
    // video timeline for the segment
    for (i = 0; i < this.pendingMetadata.length; i++) {
        id3 = this.pendingMetadata[i];
        id3.cueTime = id3.pts - timelineStartPts;
        id3.cueTime /= 90e3;
        event.metadata.push(id3);
    }
    // We add this to every single emitted segment even though we only need
    // it for the first
    event.metadata.dispatchType = this.metadataStream.dispatchType;

    // Reset stream state
    this.pendingTracks.length = 0;
    this.videoTrack = null;
    this.pendingBoxes.length = 0;
    this.pendingCaptions.length = 0;
    this.pendingBytes = 0;
    this.pendingMetadata.length = 0;

    // Emit the built segment
    this.trigger('data', event);

    // Only emit `done` if all tracks have been flushed and emitted
    if (this.emittedTracks >= this.numberOfTracks) {
        this.trigger('done');
        this.emittedTracks = 0;
    }
};

module.exports = {
    Stream: Stream,
    CoalesceStream: CoalesceStream
};

},{"mux.js":16}],61:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mux = require('mux.js');

var _mux2 = _interopRequireDefault(_mux);

var _flowMux = require('./flow-mux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The flow(flv live over websocket) objects.
// @see http://download.macromedia.com/f4v/video_file_format_spec_v10_1.pdf
// @see https://github.com/winlinvip/videojs-flow
var FlowReader, FlowTag, FlowCodec, FlowGop, _FlowTransmuxer;

// manage a gop of tags.
FlowGop = function FlowGop() {
    var self = this;
    self.tags = [];
    self.nbKeyframes = 0;
    self.numFrames = 0;

    self.push = function (tag) {
        if (tag.isKeyframe()) {
            self.nbKeyframes++;
            console.log("keyframe " + self.nbKeyframes);
        }
        self.tags.push(tag);
        self.numFrames++;
        // console.log("frame " + self.numFrames);
    };

    self.pop = function () {
        if (self.nbKeyframes < 2) {
            return null;
        }

        var nbKeyframes = 0;
        var tags = [];
        while (self.tags.length > 0) {
            var tag = self.tags[0];

            if (tag.isKeyframe()) {
                // return one gop.
                if (nbKeyframes > 0) {
                    break;
                }

                self.nbKeyframes--;
                nbKeyframes++;
            }

            tags.push(self.tags.shift());
            self.numFrames--;
        }

        console.log("after frame " + self.numFrames);
        return tags;
    };
};

// convert flv to adts for aac or annexb for avc.
FlowCodec = function FlowCodec() {
    // set to the zero to reserved, for array map.
    var SrsCodecVideoAVCFrameReserved = 0,
        SrsCodecVideoAVCFrameReserved1 = 6,
        SrsCodecVideoAVCFrameKeyFrame = 1,
        SrsCodecVideoAVCFrameInterFrame = 2,
        SrsCodecVideoAVCFrameDisposableInterFrame = 3,
        SrsCodecVideoAVCFrameGeneratedKeyFrame = 4,
        SrsCodecVideoAVCFrameVideoInfoFrame = 5;

    // Table 1.1 - Audio Object Type definition
    // @see @see aac-mp4a-format-ISO_IEC_14496-3+2001.pdf, page 23
    var SrsAacObjectTypeReserved = 0,
        SrsAacObjectTypeAacMain = 1,
        SrsAacObjectTypeAacLC = 2,
        SrsAacObjectTypeAacSSR = 3,
        SrsAacObjectTypeAacHE = 5,
        // AAC HE = LC+SBR
    SrsAacObjectTypeAacHEV2 = 29; // AAC HEv2 = LC+SBR+PS

    /**
     * the avc payload format, must be ibmf or annexb format.
     * we guess by annexb first, then ibmf for the first time,
     * and we always use the guessed format for the next time.
     */
    var SrsAvcPayloadFormatGuess = 0,
        SrsAvcPayloadFormatAnnexb = 1,
        SrsAvcPayloadFormatIbmf = 2;

    /**
     * Table 7-1 - NAL unit type codes, syntax element categories, and NAL unit type classes
     * H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 83.
     */
    var SrsAvcNaluTypeReserved = 0,
        SrsAvcNaluTypeNonIDR = 1,
        SrsAvcNaluTypeDataPartitionA = 2,
        SrsAvcNaluTypeDataPartitionB = 3,
        SrsAvcNaluTypeDataPartitionC = 4,
        SrsAvcNaluTypeIDR = 5,
        SrsAvcNaluTypeSEI = 6,
        SrsAvcNaluTypeSPS = 7,
        SrsAvcNaluTypePPS = 8,
        SrsAvcNaluTypeAccessUnitDelimiter = 9,
        SrsAvcNaluTypeEOSequence = 10,
        SrsAvcNaluTypeEOStream = 11,
        SrsAvcNaluTypeFilterData = 12,
        SrsAvcNaluTypeSPSExt = 13,
        SrsAvcNaluTypePrefixNALU = 14,
        SrsAvcNaluTypeSubsetSPS = 15,
        SrsAvcNaluTypeLayerWithoutPartition = 19,
        SrsAvcNaluTypeCodedSliceExt = 20;

    // @see 7.1 Profiles, aac-iso-13818-7.pdf, page 40
    var SrsAacProfileMain = 0,
        SrsAacProfileLC = 1,
        SrsAacProfileSSR = 2,
        SrsAacProfileReserved = 3;

    var self = this;
    self.aac = {
        ok: false,
        object: 0, // SrsAacObjectType
        sampleRate: 0,
        channels: 0
    };
    self.avc = {
        ok: false,
        naluSize: 0,
        sps: null,
        pps: null,
        payload_format: SrsAvcPayloadFormatGuess
    };

    // @see srs_codec_aac_rtmp2ts
    self.aac_rtmp2ts = function (object_type) {
        switch (object_type) {
            case SrsAacObjectTypeAacMain:
                return SrsAacProfileMain;
            case SrsAacObjectTypeAacHE:
            case SrsAacObjectTypeAacHEV2:
            case SrsAacObjectTypeAacLC:
                return SrsAacProfileLC;
            case SrsAacObjectTypeAacSSR:
                return SrsAacProfileSSR;
            default:
                return SrsAacProfileReserved;
        }
    };

    // aac audio to adts format for AdtsStream:
    //      toAdts(tag FlvTag) (frame Uint8Array)
    // @return null if not got adts frame.
    // @see SrsAacEncoder::write_audio
    self.toAdts = function (tag) {
        // for audio, pts equals to dts.
        tag.pts = tag.dts;

        var buf = tag.tag;
        if (buf.byteLength < 2) {
            throw new Error("audio tag invalid, size=" + buf.byteLength);
        }

        // @see: E.4.2 Audio Tags, video_file_format_spec_v10_1.pdf, page 76
        var sound_format = buf[0];
        // @see: SrsAvcAacCodec::audio_aac_demux
        //int8_t sound_type = sound_format & 0x01;
        //int8_t sound_size = (sound_format >> 1) & 0x01;
        //int8_t sound_rate = (sound_format >> 2) & 0x03;
        sound_format = sound_format >> 4 & 0x0f;
        //     10 = AAC
        if (sound_format != 10) {
            throw new Error("audio is not aac, format=" + sound_format);
        }

        var aac_packet_type = buf[1];
        buf = buf.subarray(2);
        if (aac_packet_type == 0) {
            // AudioSpecificConfig
            // 1.6.2.1 AudioSpecificConfig, in aac-mp4a-format-ISO_IEC_14496-3+2001.pdf, page 33.
            //
            // only need to decode the first 2bytes:
            // audioObjectType, 5bits.
            // samplingFrequencyIndex, aac_sample_rate, 4bits.
            // channelConfiguration, aac_channels, 4bits
            if (buf.byteLength < 2) {
                throw new Error("aac sequence header invalid, size=" + buf.byteLength);
            }

            var audioObjectType = buf[0];
            self.aac.sampleRate = buf[1];

            self.aac.channels = self.aac.sampleRate >> 3 & 0x0f;
            self.aac.sampleRate = audioObjectType << 1 & 0x0e | self.aac.sampleRate >> 7 & 0x01;

            self.aac.object = audioObjectType >> 3 & 0x1f;
            self.aac.ok = true;
            return null;
        }

        if (!self.aac.ok) {
            throw new Error("no aac sequence header");
        }

        // the left is the aac raw frame data.
        var aac_raw_length = buf.byteLength;

        // write the ADTS header.
        // @see aac-mp4a-format-ISO_IEC_14496-3+2001.pdf, page 75,
        //      1.A.2.2 Audio_Data_Transport_Stream frame, ADTS
        // @see https://github.com/ossrs/srs/issues/212#issuecomment-64145885
        // byte_alignment()

        // adts_fixed_header:
        //      12bits syncword,
        //      16bits left.
        // adts_variable_header:
        //      28bits
        //      12+16+28=56bits
        // adts_error_check:
        //      16bits if protection_absent
        //      56+16=72bits
        // if protection_absent:
        //      require(7bytes)=56bits
        // else
        //      require(9bytes)=72bits
        var aac_fixed_header = new Uint8Array(7);
        var aac_frame_length = aac_raw_length + 7;

        // Syncword 12 bslbf
        aac_fixed_header[0] = 0xff;
        // 4bits left.
        // adts_fixed_header(), 1.A.2.2.1 Fixed Header of ADTS
        // ID 1 bslbf
        // Layer 2 uimsbf
        // protection_absent 1 bslbf
        aac_fixed_header[1] = 0xf1;

        // profile 2 uimsbf
        // sampling_frequency_index 4 uimsbf
        // private_bit 1 bslbf
        // channel_configuration 3 uimsbf
        // original/copy 1 bslbf
        // home 1 bslbf
        var aac_profile = self.aac_rtmp2ts(self.aac.object);
        aac_fixed_header[2] = aac_profile << 6 & 0xc0 | self.aac.sampleRate << 2 & 0x3c | self.aac.channels >> 2 & 0x01;
        // 4bits left.
        // adts_variable_header(), 1.A.2.2.2 Variable Header of ADTS
        // copyright_identification_bit 1 bslbf
        // copyright_identification_start 1 bslbf
        aac_fixed_header[3] = self.aac.channels << 6 & 0xc0 | aac_frame_length >> 11 & 0x03;

        // aac_frame_length 13 bslbf: Length of the frame including headers and error_check in bytes.
        // use the left 2bits as the 13 and 12 bit,
        // the aac_frame_length is 13bits, so we move 13-2=11.
        aac_fixed_header[4] = aac_frame_length >> 3;
        // adts_buffer_fullness 11 bslbf
        aac_fixed_header[5] = aac_frame_length << 5 & 0xe0;

        // no_raw_data_blocks_in_frame 2 uimsbf
        aac_fixed_header[6] = 0xfc;

        var adts = new Uint8Array(aac_frame_length);
        adts.set(aac_fixed_header);
        adts.set(buf, 7);
        return adts;
    };

    // avc video to annexb format for NalByteStream:
    //      toAdts(tag FlvTag) (frame Uint8Array)
    self.toAnnexb = function (tag) {
        var buf = tag.tag;

        // video sample, contains all NALUs in frame.
        var sample = { ok: false, size: tag.tag.byteLength,
            dts: tag.dts, cts: 0, pts: 0, avc_packet_type: 0, nalus: [], has_idr: false,
            addNalu: function addNalu(nalu) {
                var nal_unit_type = nalu[0] & 0x1f;
                if (nal_unit_type == SrsAvcNaluTypeIDR) {
                    this.has_idr = true;
                }
                //console.log("got nalu " + nalu.byteLength);
                this.nalus.push(nalu);
            }
        };

        // pts = dts + cts.
        sample.cts = 0;
        sample.pts = sample.dts + sample.cts;
        // update tag pts.
        tag.pts = sample.pts;

        self.avc_demux_sps_pps(buf);

        self.avc_demux_sample(buf, sample);
        if (!sample.ok) {
            return null;
        }

        if (null == self.avc.pps || null == self.avc.sps) {
            for (var i in sample.nalus) {
                var nalu = sample.nalus[i];

                // 5bits, 7.3.1 NAL unit syntax,
                // H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 83.
                var nal_unit_type = nalu[0] & 0x1f;

                // ignore SPS/PPS/AUD
                switch (nal_unit_type) {
                    case SrsAvcNaluTypeSPS:
                        self.avc.sps = nalu;
                        break;
                    case SrsAvcNaluTypePPS:
                        self.avc.pps = nalu;
                        break;
                    default:
                        break;
                }
            }
            if (self.avc.sps && self.avc.pps) {
                self.avc.ok = true;
            }
        }

        if (false == self.avc.ok) {
            return null;
        }
        return self.avc_transmux_sample(sample);
    };
    self.avc_demux_sps_pps = function (buf) {

        // parse the NALU size.
        self.avc.naluSize = 3;
        //self.avc.sps = buf.subarray(0, sequenceParameterSetLength);
        //self.avc.pps = buf.subarray(0, pictureParameterSetLength);
        //self.avc.ok = false;
    };
    self.avc_demux_sample = function (buf, sample) {

        // guess for the first time.
        if (self.avc.payload_format == SrsAvcPayloadFormatGuess) {
            // One or more NALUs (Full frames are required)
            // try  "AnnexB" from H.264-AVC-ISO_IEC_14496-10.pdf, page 211.
            if (!self.avc_demux_annexb_format(buf, sample)) {
                // try "ISO Base Media File Format" from H.264-AVC-ISO_IEC_14496-15.pdf, page 20
                if (!self.avc_demux_ibmf_format(buf, sample)) {
                    throw new Error("invalid format, not annexb or ibmf");
                } else {
                    self.avc.payload_format = SrsAvcPayloadFormatIbmf;
                }
            } else {
                self.avc.payload_format = SrsAvcPayloadFormatAnnexb;
            }
        } else if (self.avc.payload_format == SrsAvcPayloadFormatIbmf) {
            // try "ISO Base Media File Format" from H.264-AVC-ISO_IEC_14496-15.pdf, page 20
            if (!self.avc_demux_ibmf_format(buf, sample)) {
                throw new Error("invalid ibmf format.");
            }
        } else {
            // One or more NALUs (Full frames are required)
            // try  "AnnexB" from H.264-AVC-ISO_IEC_14496-10.pdf, page 211.
            if (!self.avc_demux_annexb_format(buf, sample)) {
                // try "ISO Base Media File Format" from H.264-AVC-ISO_IEC_14496-15.pdf, page 20
                if (!self.avc_demux_ibmf_format(buf, sample)) {
                    throw new Error("invalid format, not annexb or ibmf");
                } else {
                    self.avc.payload_format = SrsAvcPayloadFormatIbmf;
                }
            }
        }
    };
    self.avc_demux_annexb_format = function (buf, sample) {
        var srs_avc_startswith_annexb = function srs_avc_startswith_annexb(buf) {
            var p = buf.subarray(0);
            for (;;) {
                if (p.byteLength < 3) {
                    return null;
                }

                // not match
                if (p[0] != 0x00 || p[1] != 0x00) {
                    p = p.subarray(1);
                    continue;
                }

                // match N[00] 00 00 01, where N>=0
                if (p[2] == 0x01) {
                    return p;
                }
                p = p.subarray(1);
            }

            return null;
        };

        buf = srs_avc_startswith_annexb(buf);
        // not annexb, try others
        if (!buf) {
            return false;
        }

        // AnnexB
        // B.1.1 Byte stream NAL unit syntax,
        // H.264-AVC-ISO_IEC_14496-10.pdf, page 211.
        while (buf && buf.byteLength > 0) {
            var next = srs_avc_startswith_annexb(buf.subarray(1));
            var nalu = buf.subarray(3, buf.byteLength - (next ? next.byteLength : 0) - (next ? 1 : 0));
            sample.addNalu(nalu);
            buf = next;
        }

        sample.ok = true;
        return true;
    };
    self.avc_demux_ibmf_format = function (buf, sample) {
        while (buf && buf.byteLength > 0) {
            if (buf.byteLength < self.avc.naluSize + 1) {
                throw new Error("invalid nalu length, require=" + (self.avc.naluSize + 1) + ", size=" + buf.byteLength);
            }
            var NALUnitLength = 0;
            if (self.avc.naluSize == 3) {
                NALUnitLength = buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3];
            } else if (self.avc.naluSize == 1) {
                NALUnitLength = buf[0] << 8 | buf[1];
            } else {
                NALUnitLength = buf[0];
            }
            buf = buf.subarray(self.avc.naluSize + 1);

            // maybe stream is invalid format.
            // see: https://github.com/ossrs/srs/issues/183
            if (NALUnitLength < 0) {
                return false;
            }

            // NALUnit
            if (buf.byteLength < NALUnitLength) {
                throw new Error("invalid nalu, require=" + NALUnitLength + ", size=" + buf.byteLength);
            }
            // 7.3.1 NAL unit syntax, H.264-AVC-ISO_IEC_14496-10.pdf, page 44.
            var nalu = buf.subarray(0, NALUnitLength);
            sample.addNalu(nalu);
            buf = buf.subarray(NALUnitLength);
        }

        sample.ok = true;
        return true;
    };
    self.avc_transmux_sample = function (sample) {
        /*console.log("avc(profile=" + self.avc.profile + ", level=" + self.avc.level
         + ", naluSize=" + self.avc.naluSize + ", sps=" + self.avc.sps.byteLength
         + ", pps=" + self.avc.pps.byteLength + ") frame type=" + sample.frame_type
         + ", size=" + sample.size + ", dts=" + sample.dts + ", pts=" + sample.pts
         + ", nalus=" + sample.nalus.length + ", idr=" + sample.has_idr);*/

        // mux the samples in annexb format,
        // H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 324.
        /**
         * 00 00 00 01 // header
         *       xxxxxxx // data bytes
         * 00 00 01 // continue header
         *       xxxxxxx // data bytes.
         *
         * nal_unit_type specifies the type of RBSP data structure contained in the NAL unit as specified in Table 7-1.
         * Table 7-1 - NAL unit type codes, syntax element categories, and NAL unit type classes
         * H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 83.
         *      1, Coded slice of a non-IDR picture slice_layer_without_partitioning_rbsp( )
         *      2, Coded slice data partition A slice_data_partition_a_layer_rbsp( )
         *      3, Coded slice data partition B slice_data_partition_b_layer_rbsp( )
         *      4, Coded slice data partition C slice_data_partition_c_layer_rbsp( )
         *      5, Coded slice of an IDR picture slice_layer_without_partitioning_rbsp( )
         *      6, Supplemental enhancement information (SEI) sei_rbsp( )
         *      7, Sequence parameter set seq_parameter_set_rbsp( )
         *      8, Picture parameter set pic_parameter_set_rbsp( )
         *      9, Access unit delimiter access_unit_delimiter_rbsp( )
         *      10, End of sequence end_of_seq_rbsp( )
         *      11, End of stream end_of_stream_rbsp( )
         *      12, Filler data filler_data_rbsp( )
         *      13, Sequence parameter set extension seq_parameter_set_extension_rbsp( )
         *      14, Prefix NAL unit prefix_nal_unit_rbsp( )
         *      15, Subset sequence parameter set subset_seq_parameter_set_rbsp( )
         *      19, Coded slice of an auxiliary coded picture without partitioning slice_layer_without_partitioning_rbsp( )
         *      20, Coded slice extension slice_layer_extension_rbsp( )
         * the first ts message of apple sample:
         *      annexb 4B header, 2B aud(nal_unit_type:6)(0x09 0xf0)
         *      annexb 4B header, 19B sps(nal_unit_type:7)
         *      annexb 3B header, 4B pps(nal_unit_type:8)
         *      annexb 3B header, 12B nalu(nal_unit_type:6)
         *      annexb 3B header, 21B nalu(nal_unit_type:6)
         *      annexb 3B header, 2762B nalu(nal_unit_type:5)
         *      annexb 3B header, 3535B nalu(nal_unit_type:5)
         * the second ts message of apple ts sample:
         *      annexb 4B header, 2B aud(nal_unit_type:6)(0x09 0xf0)
         *      annexb 3B header, 21B nalu(nal_unit_type:6)
         *      annexb 3B header, 379B nalu(nal_unit_type:1)
         *      annexb 3B header, 406B nalu(nal_unit_type:1)
         */
        var fresh_nalu_header = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
        var cont_nalu_header = new Uint8Array([0x00, 0x00, 0x01]);

        // the aud(access unit delimiter) before each frame.
        // 7.3.2.4 Access unit delimiter RBSP syntax
        // H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 66.
        //
        // primary_pic_type u(3), the first 3bits, primary_pic_type indicates that the slice_type values
        //      for all slices of the primary coded picture are members of the set listed in Table 7-5 for
        //      the given value of primary_pic_type.
        //      0, slice_type 2, 7
        //      1, slice_type 0, 2, 5, 7
        //      2, slice_type 0, 1, 2, 5, 6, 7
        //      3, slice_type 4, 9
        //      4, slice_type 3, 4, 8, 9
        //      5, slice_type 2, 4, 7, 9
        //      6, slice_type 0, 2, 3, 4, 5, 7, 8, 9
        //      7, slice_type 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
        // 7.4.2.4 Access unit delimiter RBSP semantics
        // H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 102.
        //
        // slice_type specifies the coding type of the slice according to Table 7-6.
        //      0, P (P slice)
        //      1, B (B slice)
        //      2, I (I slice)
        //      3, SP (SP slice)
        //      4, SI (SI slice)
        //      5, P (P slice)
        //      6, B (B slice)
        //      7, I (I slice)
        //      8, SP (SP slice)
        //      9, SI (SI slice)
        // H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 105.
        var aud_nalu_7 = new Uint8Array([0x09, 0xf0]);

        // always append a aud nalu for each frame.
        var frameSize = 4 + 2 + 4 + self.avc.sps.byteLength + 3 + self.avc.pps.byteLength;
        for (var i in sample.nalus) {
            var nalu = sample.nalus[i];
            frameSize += 3 + nalu.byteLength;
        }
        var frame = new Uint8Array(frameSize);
        frameSize = 0;

        // aud.
        frame.set(fresh_nalu_header, frameSize);frameSize += 4;
        frame.set(aud_nalu_7, frameSize);frameSize += 2;

        // when ts message(samples) contains IDR, insert sps+pps.
        if (sample.has_idr) {
            // fresh nalu header before sps.
            if (self.avc.sps.byteLength > 0) {
                // AnnexB prefix, for sps always 4 bytes header
                frame.set(fresh_nalu_header, frameSize);frameSize += 4;
                // sps
                frame.set(self.avc.sps, frameSize);frameSize += self.avc.sps.byteLength;
            }
            // cont nalu header before pps.
            if (self.avc.pps.byteLength > 0) {
                // AnnexB prefix, for pps always 3 bytes header
                frame.set(cont_nalu_header, frameSize);frameSize += 3;
                // pps
                frame.set(self.avc.pps, frameSize);frameSize += self.avc.pps.byteLength;
            }
        }

        // all sample use cont nalu header, except the sps-pps before IDR frame.
        for (var i in sample.nalus) {
            var nalu = sample.nalus[i];

            // 5bits, 7.3.1 NAL unit syntax,
            // H.264-AVC-ISO_IEC_14496-10-2012.pdf, page 83.
            var nal_unit_type = nalu[0] & 0x1f;

            // ignore SPS/PPS/AUD
            switch (nal_unit_type) {
                case SrsAvcNaluTypeSPS:
                case SrsAvcNaluTypePPS:
                case SrsAvcNaluTypeAccessUnitDelimiter:
                    continue;
                default:
                    break;
            }

            // insert cont nalu header before frame.
            frame.set(cont_nalu_header, frameSize);frameSize += 3;
            // sample data
            frame.set(nalu, frameSize);frameSize += nalu.byteLength;
        }

        //console.log(frame.byteLength + ", " + frameSize);
        var annexb = frame.subarray(0, frameSize);
        return annexb;
    };
};

// the flv tag data.
FlowTag = function FlowTag() {
    var self = this;
    self.type = self.dts = self.pts = 0; // uint
    self.tag = null; // Uint8Array.

    self.isAudio = function () {
        return false;
    };
    self.isVideo = function () {
        // should get frome frame header info
        return true;
    };
    self.isKeyframe = function () {
        if (!self.isVideo()) {
            return false;
        }

        if (self.tag.byteLength < 5) {
            throw new Error("invalid keyframe, size=" + self.tag.byteLength);
        }
        // should get from frame header info
        var bRet = false;
        if ((self.tag[4] & 0x1F) == 7 || (self.tag[4] & 0x1F) == 8 || (self.tag[4] & 0x1F) == 5) {
            bRet = true;
        }
        return bRet;
    };
    self.isAac = function () {
        return false;
    };
    self.isAvc = function () {
        return true;
    };
    self.isSequenceHeader = function () {
        return false;
    };
    self.isScriptData = function () {
        return false;
    };
    self.toString = function () {
        var t = self.isAudio() ? "Audio" : self.isVideo() ? "Video" : self.isScriptData() ? "Data" : "Other";
        return t + ', ' + Number(Number(self.dts) / 1000).toFixed(2) + 's, ' + self.tag.byteLength + ' bytes';
    };
};

// read FlvTag from Uint8Array.
FlowReader = function FlowReader() {
    var self = this;
    self.header = {
        ok: false,
        version: 0, // File version (for example, 0x01 for FLV version 1)
        hasAudio: false, // 1 = Audio tags are present
        hasVideo: false // 1 = Video tags are present
    };
    self.sequenceHeader = null;
    self.cache = null;
    self.dts = 0;

    // append bytes to reader:
    //      append(ibytes Uint8Array) void
    self.append = function (ibytes) {
        var everything;
        if (self.cache && self.cache.byteLength > 0) {
            everything = new Uint8Array(self.cache.byteLength + ibytes.byteLength);
            everything.set(self.cache);
            everything.set(ibytes, self.cache.byteLength);
        } else {
            everything = ibytes;
        }

        self.cache = everything;
    };

    // read FlvTag instance from reader.
    //      read() (tag FlvTag)
    // @return null if eof, user should append bytes then parse.
    self.read = function () {
        var everything = self.cache;
        if (!everything) {
            return null;
        }

        while (true) {

            // parse flv header id: FLV.
            if (!self.header.ok) {

                self.header.ok = true;
                self.header.hasAudio = false;
                self.header.hasVideo = true;
            }

            // parse a tag from bytes.
            var obj = new FlowTag();
            obj.tag = everything;
            obj.type = 0;
            obj.dts = self.dts;
            obj.pts = obj.dts;
            self.cache = null;
            self.dts += 40;
            return obj;
        }

        return null;
    };
};

/**
 * A Stream that expects MP2T binary data as input and produces
 * corresponding media segments, suitable for use with Media Source
 * Extension (MSE) implementations that support the ISO BMFF byte
 * stream format, like Chrome.
 */
_FlowTransmuxer = function FlowTransmuxer() {
    var self = this;
    self.flv = new FlowReader();
    self.codec = new FlowCodec();
    self.gop = new FlowGop();
    self.ws = null; // WebSocket

    var videoTrack = { type: 'video', codec: 'avc', timelineStartInfo: { baseMediaDecodeTime: 0 } };
    var audioTrack = { type: 'audio', codec: 'adts', timelineStartInfo: { baseMediaDecodeTime: 0 } };

    var pipeline = {};
    pipeline.type = 'flow'; // FLOW(flv live over websocet), annexb to mp4.
    pipeline.h264Stream = new _mux2.default.codecs.h264.H264Stream();
    pipeline.adtsStream = _mux2.default.codecs.Adts.AdtsStream; // new AdtsStream()
    pipeline.videoSegmentStream = new _mux2.default.mp4.VideoSegmentStream(videoTrack);
    pipeline.audioSegmentStream = new _mux2.default.mp4.AudioSegmentStream(audioTrack);
    pipeline.coalesceStream = new _flowMux.CoalesceStream({}, { dispatchType: _mux2.default.mp2t.METADATA_STREAM_TYPE });
    pipeline.h264Stream.pipe(pipeline.videoSegmentStream).pipe(pipeline.coalesceStream);
    /*pipeline.adtsStream
        .pipe(pipeline.audioSegmentStream)
        .pipe(pipeline.coalesceStream);*/

    _FlowTransmuxer.prototype.init.call(this);

    // append mp4 segment to mse.
    pipeline.coalesceStream.on('data', function (segment) {
        // console.log('append mp4 ' + segment.type + " " + segment.data.buffer.byteLength + " bytes");
        self.trigger('data', segment);
    });

    self.src = function (url) {
        self.ws = new WebSocket(url);
        self.ws.onmessage = function (evt) {
            var b = evt.data; // Blob: https://developer.mozilla.org/en-US/docs/Web/API/Blob
            var reader = new FileReader();
            reader.addEventListener('loadend', function () {
                var bytes = new Uint8Array(reader.result);
                self.transmux(bytes);
            });
            reader.readAsArrayBuffer(b);
        };
    };

    // flv => tag => annexb/adts => mp4 => mse.
    self.transmux = function (bytes) {
        self.flv.append(bytes);

        while (true) {
            var tag = self.flv.read();
            if (!tag) {
                break;
            }

            if (tag.isSequenceHeader()) {
                if (tag.isAudio()) {
                    self.codec.toAdts(tag);
                    //console.log("parse audio sequence header");
                } else {
                    self.codec.toAnnexb(tag);
                    //console.log("parse video sequence header");
                }
                continue;
            }

            // append to the gop and conusme it.
            self.gop.push(tag);
            while (self.consumeGop()) {}
        }
    };
    // parse a gop of tags to mp4.
    self.consumeGop = function () {
        // when got one complete gop, transmux it.
        var tags = self.gop.pop();
        if (!tags) {
            return false;
        }
        var first = tags[0];
        var last = tags[tags.length - 1];
        /*console.log("parse gop " + tags.length + " tags, dts[" + first.dts
         + "," + last.dts + "], duration=" + (last.dts - first.dts));*/

        // parse all tags.
        for (var i in tags) {
            var tag = tags[i];

            if (tag.isAudio()) {
                var frame = self.codec.toAdts(tag);
                if (!frame) {
                    continue;
                }
                //console.log("adts " + frame.byteLength + " bytes");

                // @remark we must use ts tbn(*90 for flv).
                pipeline.adtsStream.push({ type: 'audio', trackId: 100, dts: tag.dts * 180, pts: tag.pts * 180, data: frame });
            } else if (tag.isVideo()) {
                var frame = self.codec.toAnnexb(tag);
                if (!frame) {
                    continue;
                }
                //console.log("annexb " + frame.byteLength + " bytes");

                // @remark we must use ts tbn(*90 for flv).
                // console.log("h264stream " + (tag.dts*90) + " pts " + (tag.pts*90) + " framesize" + frame.byteLength);
                pipeline.h264Stream.push({ type: 'video', trackId: 101, dts: tag.dts * 180, pts: tag.pts * 180, data: frame });
            }
        }

        pipeline.h264Stream.flush();
        //pipeline.adtsStream.flush();

        return true;
    };
};

_FlowTransmuxer.prototype = new _flowMux.Stream();

exports.default = _FlowTransmuxer;

},{"./flow-mux":60,"mux.js":16}],62:[function(require,module,exports){
/**
 * WFS interface, Jeff Yang 2016.10
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _flowController = require('./controller/flow-controller');

var _flowController2 = _interopRequireDefault(_flowController);

var _bufferController = require('./controller/buffer-controller');

var _bufferController2 = _interopRequireDefault(_bufferController);

var _events3 = require('events');

var _events4 = _interopRequireDefault(_events3);

var _xhrLoader = require('./utils/xhr-loader');

var _xhrLoader2 = _interopRequireDefault(_xhrLoader);

var _websocketLoader = require('./loader/websocket-loader');

var _websocketLoader2 = _interopRequireDefault(_websocketLoader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Wfs = function () {
  _createClass(Wfs, null, [{
    key: 'isSupported',
    value: function isSupported() {
      return window.MediaSource && typeof window.MediaSource.isTypeSupported === 'function' && window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42c01f,mp4a.40.2"');
    }
  }, {
    key: 'version',
    get: function get() {
      // replaced with browserify-versionify transform
      return '' + 'v.0.0.0.1';
    }
  }, {
    key: 'Events',
    get: function get() {
      return _events2.default;
    }
  }, {
    key: 'DefaultConfig',
    get: function get() {
      if (!Wfs.defaultConfig) {
        Wfs.defaultConfig = {
          autoStartLoad: true,
          startPosition: -1,
          debug: false,
          fLoader: undefined,
          loader: _xhrLoader2.default,
          //loader: FetchLoader,
          fmp4FileUrl: 'xxxx.mp4',
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
          fragLoadingMaxRetryTimeout: 64000,
          fragLoadingLoopThreshold: 3,
          forceKeyFrameOnDiscontinuity: true,
          appendErrorMaxRetry: 3
        };
      }
      return Wfs.defaultConfig;
    },
    set: function set(defaultConfig) {
      Wfs.defaultConfig = defaultConfig;
    }
  }]);

  function Wfs() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Wfs);

    var defaultConfig = Wfs.DefaultConfig;
    for (var prop in defaultConfig) {
      if (prop in config) {
        continue;
      }
      config[prop] = defaultConfig[prop];
    }
    this.config = config;
    // observer setup
    var observer = this.observer = new _events4.default();
    observer.trigger = function trigger(event) {
      for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        data[_key - 1] = arguments[_key];
      }

      observer.emit.apply(observer, [event, event].concat(data));
    };

    observer.off = function off(event) {
      for (var _len2 = arguments.length, data = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        data[_key2 - 1] = arguments[_key2];
      }

      observer.removeListener.apply(observer, [event].concat(data));
    };
    this.on = observer.on.bind(observer);
    this.off = observer.off.bind(observer);
    this.trigger = observer.trigger.bind(observer);

    this.flowController = new _flowController2.default(this);
    this.bufferController = new _bufferController2.default(this);
    //  this.fileLoader = new FileLoader(this);
    this.websocketLoader = new _websocketLoader2.default(this);
    this.mediaType = undefined;
  }

  _createClass(Wfs, [{
    key: 'destroy',
    value: function destroy() {
      this.flowController.destroy();
      this.bufferController.destroy();
      //   this.fileLoader.destroy();
      this.websocketLoader.destroy();
    }
  }, {
    key: 'attachMedia',
    value: function attachMedia(media) {
      var channelName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'chX';
      var mediaType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'H264Raw';
      var websocketName = arguments[3];
      // 'H264Raw' 'FMp4'    
      this.mediaType = mediaType;
      this.media = media;
      this.trigger(_events2.default.MEDIA_ATTACHING, { media: media, channelName: channelName, mediaType: mediaType, websocketName: websocketName });
    }
  }, {
    key: 'attachWebsocket',
    value: function attachWebsocket(websocket, channelName) {
      this.trigger(_events2.default.WEBSOCKET_ATTACHING, { websocket: websocket, mediaType: this.mediaType, channelName: channelName });
    }
  }]);

  return Wfs;
}();

exports.default = Wfs;

},{"./controller/buffer-controller":51,"./controller/flow-controller":52,"./events":54,"./loader/websocket-loader":56,"./utils/xhr-loader":59,"events":1}]},{},[55])(55)
});
//# sourceMappingURL=wfsplayer.js.map
