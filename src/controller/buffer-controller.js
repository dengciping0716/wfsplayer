/*
 * Buffer Controller
*/

import Event from '../events';
import EventHandler from '../event-handler';
import FlowTransmuxer from '../videojs/flow'

class BufferController extends EventHandler {

  constructor(wfs) {
    super(wfs,
      Event.MEDIA_ATTACHING,
      Event.BUFFER_APPENDING,
      Event.BUFFER_RESET,
      Event.H264_DATA_PARSING
    );
    
    this.mediaSource = null;
    this.media = null;
    this.pendingTracks = {};
    this.sourceBuffer = {};
    this.segments = [];
 
    this.appended = 0;
    this._msDuration = null;

    // Source Buffer listeners
    this.onsbue = this.onSBUpdateEnd.bind(this);

    this.browserType = 0;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1){
      this.browserType = 1;
    }
    this.mediaType = 'H264Raw';

    this.websocketName = undefined; 
    this.channelName = undefined;
  }

  destroy() {
    if(this.flow)this.flow.dispose();
    EventHandler.prototype.destroy.call(this);
  }
 
  onMediaAttaching(data) {
    let media = this.media = data.media;
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

  onMediaDetaching() {
 
  }
   
  onBufferAppending(data) { 
    if (!this.segments) {
      this.segments = [ data ];
    } else {
      this.segments.push(data); 
    }
    this.doAppending(); 
  }
  
  onMediaSourceClose() {
    console.log('media source closed');
  }

  onMediaSourceEnded() {
    console.log('media source ended');
  }

  onSBUpdateEnd(event) { 
    // Firefox
    if (this.browserType === 1){
      this.mediaSource.endOfStream();
      this.media.play();  
    }
 
    this.appending = false;
    this.doAppending();
    this.updateMediaElementDuration();
 
  }
 
  updateMediaElementDuration() {
  
  }

  onMediaSourceOpen() { 
    let mediaSource = this.mediaSource;
    if (mediaSource) {
      // once received, don't listen anymore to sourceopen event
      mediaSource.removeEventListener('sourceopen', this.onmso);
    }

    let videoSourceBuffer = mediaSource.addSourceBuffer('video/mp4;codecs="avc1.42E01E"')
    this.flow = new FlowTransmuxer();
    this.flow.on('data' , function(segment){
      if(segment.type == 'audio'){
        // sudioSourceBuffer.appendBuffer(segment.data.buffer)
      }else{
        videoSourceBuffer.appendBuffer(segment.data.buffer)
      }
    })

    this.wfs.trigger(Event.MEDIA_ATTACHED, {media:this.media, channelName:this.channelName, mediaType: this.mediaType, websocketName:this.websocketName});
  }

  onH264DataParsing(event) {
		var b = event.data; // Blob: https://developer.mozilla.org/en-US/docs/Web/API/Blob
    var reader = new FileReader();
    reader.addEventListener('loadend', ()=>{
        var bytes = new Uint8Array(reader.result);
        this.flow.transmux(bytes);
    });
    reader.readAsArrayBuffer(b);
	}
}

export default BufferController;
