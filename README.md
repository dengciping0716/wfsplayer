wfs.js - html5 player for raw h.264 streams. 
================
 
基于 https://github.com/ChihChengYang/wfs.js.git 库的修改版本，解决黑屏和卡顿问题。使用video.js mux库中的 h264解码。

A javascript library which implements websocket client for watching and focusing on raw h.264 live streams in your browser that works directly on top of a standard HTML5 element and MediaSource Extensions.
 
It works by transmuxing H264 NAL unit into ISO BMFF (MP4) fragments.

Also,Implement a demo server to push video streams.
 
##  Build

```
git clone https://github.com/ChihChengYang/wfs.js.git
cd wfs.js
```

### wfs.js

Setup node.js/npm dev environment, then run:

```
npm install
npm run build
```

### Demo server

Setup go's dev environment, then run:

```
go get "github.com/gorilla/websocket"
go get "github.com/satori/go.uuid"
go get "github.com/kardianos/osext"
./server/build_lite.sh
```

Demo server serves with raw h.264 files,
yet that can be easily transfered and connected to RTSP or other sources (h.264 streaming).

##  Demo
1. run ./demo/wfs_server

2. open a browser e.g. Chrome , 127.0.0.1:8888

##  Reference

[hls.js](https://github.com/dailymotion/hls.js "hls.js")
[mux.js](https://github.com/videojs/mux.js/)