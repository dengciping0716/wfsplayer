/**
 * WFS interface, Jeff Yang 2016.10
 */
// 'use strict';

import Event from './events';
import EventHandler from './event-handler'; 
import Wfs from './wfs';
import cssStr from './player.css.js';

const Status = {
  IDEL:"idel",
  PLAYING: 'playing',
  PAUSE: 'pause',
  STOP: 'stop',
}

class WfsHandler extends EventHandler{
    constructor(wfs , player) {
        super(wfs,
            Event.MEDIA_ATTACHING,  
 
            Event.BUFFER_CREATED, 

            Event.FRAG_PARSING_INIT_SEGMENT,
            Event.WEBSOCKET_DATA_SIZE,
            Event.WEBSOCKET_RECEIVED_MSG,
            Event.WEBSOCKET_CONNECT
        );
        this.lastReceviedTime = new Date()

        this.player = player

        this.size = 0;
        this.timeid = setInterval(() => {
            if(this.player.status == Status.PLAYING){
                if(new Date().getTime() - this.lastReceviedTime.getTime() > this.player.config.timeout * 1000 ){
                    //长时间未收到视频数据，断开视频
                    this.player.stop()
                    this.player.showMsg('视频信号中断，请重新开始！')
                }
            }
            this.player.updateNetworkSpeed((this.size/1024.0).toFixed(2))
            this.size = 0
        }, 1000);
    } 
    destroy() {
        this.player.updateNetworkSpeed('0.00')
        clearInterval(this.timeid)
        EventHandler.prototype.destroy.call(this);
    }

    onMediaAttaching(){
        this.player.showMsg('正在请求视频。。。')
        console.log('wfsMediaAttaching')
        
    }
    onBufferCreated(){
        //
        this.player.showMsg('设备响应成功，视频加载中。')
        console.log('onBufferCreated')
    }
    onFragParsingInitSegment(){
        //第一帧
        this.player.hideMsg()
        console.log('onFragParsingInitSegment')
    }

    onWebsocketDataSize(size){
        this.size += size
        this.lastReceviedTime = new Date()
    }
    onWebsocketMsg(data){
        try {
            let res = JSON.parse(data || '')
            if(res && res.resultCode){
                this.player.stop()
                this.player.showMsg(res.resultMsg||'')
            }
        } catch (e) {
        
        }
    }

    onWebsocketConnect(){
        if( !this.player.config.isReal && this.player.config.recodeData){
            this.player.client && this.player.client.send(this.player.config.recodeData)
        }
        
        if(this.player.client){
            this.player.heart()
        }
       
    }
}

class WfsPlayer{

    static get DefaultConfig() {
        if (!WfsPlayer.defaultConfig) {
            WfsPlayer.defaultConfig = {
                id:'video-container',
                deviceName:'测试设备',
                channel: 1,
                url:'ws://127.0.0.1:8094/websocket',
                poster:'',
                timeout: 30,
                isReal:true,//默认是直播
            };
        }
        return WfsPlayer.defaultConfig;
    }
    constructor(config = {}) {
        var defaultConfig = WfsPlayer.DefaultConfig;
        for (var prop in defaultConfig) {
            if (prop in config) { continue; }
            config[prop] = defaultConfig[prop];
        }
        this.config = config;  

        this.status = Status.IDEL

        WfsPlayer.createStyle()
        this.container = document.querySelector("#" + this.config.id);
        this.container.innerHTML = this.createEl()
        this.media = this.container.querySelector('#container_video_1');
        
        this.initEvent()
    }
    play(config) {
        if(config && config.recodeData){
            this.config.recodeData = config.recodeData
            this.config.channel = config.channel
            this.config.url = config.url
        }
        if(!this.config.isReal && !this.config.recodeData){
            //没有回放数据则不播放
            return;
        }

        if(this.status == Status.PLAYING){
            this.stop()
        }
        this.status = Status.PLAYING

        try {
            this.container.querySelector('.ctrl-stop')['style']=""
            this.container.querySelector('.ctrl-playing')['style']="display:none;"
            this.container.querySelector('.replay-pane')['style']="display:none;"
        } catch (e) {
        
        }

        if(!this.client || this.client.readyState == 3){
            this.wfs = new Wfs()
            this.wfsHandler = new WfsHandler(this.wfs , this)
            this.wfs.attachMedia(this.media)
            this.client = new WebSocket(this.config.url)
            let self = this
            this.client.onclose = function(e) {
                self.stop()
                self.showMsg('视频信号已中断，请重新开始！')
            }; 
            this.wfs.attachWebsocket(this.client)
        }
        
    }

    stop(){
        this._heart && clearInterval(this._heart)
        this._heart = null

        this.status = Status.STOP
        this.media.src='/'
        
        try {
            this.container.querySelector('.ctrl-stop')['style']="display:none;"
            this.container.querySelector('.ctrl-playing')['style']=""
            this.container.querySelector('.replay-pane')['style']=""
        } catch (e) {
        
        }
        
        this.hideMsg()

        this.wfsHandler && this.wfsHandler.destroy()
        this.wfs && this.wfs.destroy()
        this.client = null;
    }
    heart(){
        this._heart = setInterval(() => {
            if(this.client && this.client.readyState == 1){
                //心跳指令
                this.client.send('heart')
            }
        }, 5000);
    }
    //进入全屏
    FullScreen() {
        let ele = this.container
        if (ele.requestFullscreen) {
            ele.requestFullscreen();
        } else if (ele.mozRequestFullScreen) {
            ele.mozRequestFullScreen();
        } else if (ele.webkitRequestFullScreen) {
            ele.webkitRequestFullScreen();
        }
    }

    //退出全屏
    exitFullscreen() {
        var de = document;
        if (de.exitFullscreen) {
            de.exitFullscreen();
        } else if (de.mozCancelFullScreen) {
            de.mozCancelFullScreen();
        } else if (de.webkitCancelFullScreen) {
            de.webkitCancelFullScreen();
        }
    }

    initEvent(){
        let self = this
        this.media.addEventListener('playing',function(){
            self.hideMsg()
        },false);
        this.media.addEventListener('canplay',function(){
            self.media.play()
        },false);

        this.container.querySelector('.replay-img').addEventListener('click', function () {
            self.media.load();
            self.play()
        })
        this.container.querySelector('.ctrl-playing').addEventListener('click',function () {
            self.media.load();
            self.play()
        })
        this.container.querySelector('.ctrl-stop').onclick = function () {
            self.stop()
        }
        this.container.querySelector('.ctrl-fullscreen').onclick = function () {
            try {
                self.container.querySelector('.ctrl-fullscreen')['style']='display: none;'
                self.container.querySelector('.ctrl-minimize')['style']=''
            } catch (e) {
            
            }
            
            self.FullScreen()
        }
        this.container.querySelector('.ctrl-minimize').onclick = function () {
            try {
                self.container.querySelector('.ctrl-minimize')['style']='display: none;'
                self.container.querySelector('.ctrl-fullscreen')['style']=''
            } catch (e) {
            
            }
          
            self.exitFullscreen()
        }
        
        this.container.querySelector('#container_1').onmouseover = function () {
            try {
                self.container.querySelector('.ctrl-bar')['style'] = ""
            } catch (e) {
            
            }
        }
        this.container.querySelector('#container_1').onmouseout = function () {
            try {
                self.container.querySelector('.ctrl-bar')['style'] = "display: none;"
            } catch (e) {
            
            }
        }
    }

    showMsg(msg) {
        try {
            let log = this.container.querySelector('.log-pane')
            log['style'] = "display: block;"
            log.innerHTML = msg
        } catch (e) {
        
        }
        
    }

    hideMsg() {
        try {
            this.container.querySelector('.log-pane')['style'] = "display: none;"
        } catch (e) {
        
        }
    }

    updateNetworkSpeed(speed = '0.00'){
        try {
            let el = this.container.querySelector('.plate-text')
            el.innerHTML = `${speed}KB/s ${this.config.deviceName} &amp; ${this.config.channel}`
    
            el = this.container.querySelector('.ctrl-download-speed')
            el.innerHTML = `${speed}KB/s`
        } catch (e) {
        
        }
        
    }

    createEl(name, poster) {
        let content = this.createVideoEl(1, name, poster)
        return `<div class="wfs-p-layout-view wfsplayer-layout-wrapper"><div class="layout-1"><div>${content}</div></div></div>`
    }

    createVideoEl(index) {
        document.createElement('div' )
        return `<div id="container_${index}" draggable="true" class="player num num-${index}">
        <video id="container_video_${index}" autoplay="autoplay" preload="none" muted="muted" type="video/mp4" poster="/poster.png">
            <audio id="container_audio_${index}" muted="muted" autoplay="autoplay" ></audio>
        </video>
                <div class="log-pane" style="display: none;"></div>
                <div class="replay-pane" style="">
                    <div class="replay-img"></div>
                </div>
                <div class="plate-text">0.00KB/s ${this.config.deviceName} &amp; ${this.config.channel}</div>
                <div class="ctrl-bar" style="display: none;">
                    <div class="ctrl-block ctrl-plate-text">${this.config.deviceName} &amp; ${this.config.channel}</div>
                    <div class="ctrl-block ctrl-download-speed">0.00KB/s</div>
                    <div class="ctrl-block ctrl-codetype" style="">标清</div>
                    <div title="停止" class="ctrl-block ctrl-stop"></div>
                    <div class="ctrl-block ctrl-playing" style="display: none;"></div>
                    <div title="截图" class="ctrl-block ctrl-snapshot" style="display: none;"></div>
                    <div title="开启音频" class="ctrl-block ctrl-muted" style="display: none;"></div>
                    <div title="全屏" class="ctrl-block ctrl-fullscreen"></div>
                    <div title="退出全屏" class="ctrl-block ctrl-minimize" style="display: none;"></div>
                    <div class="ctrl-block ctrl-download" style="display: none;"></div>
                </div>
                <div class="ctrl-codetype-pane" style="display: none;">
                    <div class="codetype-item">高清</div>
                    <div class="codetype-item">标清</div>
                </div>
            </div>`
    }

    static createStyle() {
        if(WfsPlayer.__create_style)return
        WfsPlayer.__create_style = true
        let style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = cssStr;
        document.getElementsByTagName("HEAD").item(0).appendChild(style);
    }

}



export default WfsPlayer