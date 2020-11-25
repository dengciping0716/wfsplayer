export default `
.wfs-p-layout-view {
    position: relative;
    width: 100%;
    height: 100%
}

.wfs-p-layout-view .maximize {
    position: absolute !important;
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    border: 1px solid #e8eaec !important;
    z-index: 10 !important
}

.wfs-p-layout-view .maximize .exit {
    content: "X";
    position: absolute;
    top: 5px;
    right: 10px;
    color: #fff;
    font-size: 20px;
    cursor: pointer
}

.wfs-p-layout-view .single-line {
    overflow-x: auto;
    width: 100%;
    height: 100%;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center
}

.wfs-p-layout-view .single-line,
.wfs-p-layout-view .single-line>div {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    position: relative
}

.wfs-p-layout-view .single-line .num {
    position: relative;
    width: 320px;
    height: 240px;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .single-line .num:last-child {
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .single-column {
    overflow-y: auto;
    width: 100%;
    height: 100%;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center
}

.wfs-p-layout-view .single-column,
.wfs-p-layout-view .single-column>div {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    position: relative;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column
}

.wfs-p-layout-view .single-column .num {
    position: relative;
    width: 281px;
    height: 180px;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .single-column .num:last-child {
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-1 .num-1 {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-2 .num {
    position: absolute;
    top: 0;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-2 .num-1 {
    left: 0;
    right: 50%
}

.wfs-p-layout-view .layout-2 .num-2 {
    left: 50%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-4 .num {
    position: absolute
}

.wfs-p-layout-view .layout-4 .num-1 {
    left: 0;
    right: 50%
}

.wfs-p-layout-view .layout-4 .num-1,
.wfs-p-layout-view .layout-4 .num-2 {
    top: 0;
    bottom: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-4 .num-2 {
    left: 50%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-4 .num-3 {
    top: 50%;
    bottom: 0;
    left: 0;
    right: 50%;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-4 .num-4 {
    top: 50%;
    bottom: 0;
    left: 50%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-6 .num {
    position: absolute
}

.wfs-p-layout-view .layout-6 .num-1 {
    top: 0;
    left: 0;
    right: 33.333333%;
    bottom: 33.333333%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-6 .num-2 {
    top: 0;
    bottom: 66.666666%
}

.wfs-p-layout-view .layout-6 .num-2,
.wfs-p-layout-view .layout-6 .num-3 {
    left: 66.666666%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-6 .num-3 {
    top: 33.333333%;
    bottom: 33.333333%
}

.wfs-p-layout-view .layout-6 .num-4 {
    left: 0;
    right: 66.666666%
}

.wfs-p-layout-view .layout-6 .num-4,
.wfs-p-layout-view .layout-6 .num-5 {
    top: 66.666666%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-6 .num-5 {
    left: 33.333333%;
    right: 33.333333%
}

.wfs-p-layout-view .layout-6 .num-6 {
    top: 66.666666%;
    bottom: 0;
    left: 66.666666%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-8 .num {
    position: absolute
}

.wfs-p-layout-view .layout-8 .num-1 {
    top: 0;
    bottom: 25%;
    left: 0;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-8 .num-2 {
    top: 0;
    bottom: 75%
}

.wfs-p-layout-view .layout-8 .num-2,
.wfs-p-layout-view .layout-8 .num-3 {
    left: 75%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-8 .num-3 {
    top: 25%;
    bottom: 50%
}

.wfs-p-layout-view .layout-8 .num-4 {
    top: 50%;
    bottom: 25%;
    left: 75%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-8 .num-5 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-8 .num-5,
.wfs-p-layout-view .layout-8 .num-6 {
    top: 75%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-8 .num-6 {
    left: 25%;
    right: 50%
}

.wfs-p-layout-view .layout-8 .num-7 {
    top: 75%;
    bottom: 0;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-8 .num-8 {
    top: 75%;
    bottom: 0;
    left: 75%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-9 .num {
    position: absolute
}

.wfs-p-layout-view .layout-9 .num-1 {
    left: 0;
    right: 66.666666%
}

.wfs-p-layout-view .layout-9 .num-1,
.wfs-p-layout-view .layout-9 .num-2 {
    top: 0;
    bottom: 66.666666%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-9 .num-2 {
    left: 33.333333%;
    right: 33.333333%
}

.wfs-p-layout-view .layout-9 .num-3 {
    top: 0;
    bottom: 66.666666%;
    left: 66.666666%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-9 .num-4 {
    left: 0;
    right: 66.666666%
}

.wfs-p-layout-view .layout-9 .num-4,
.wfs-p-layout-view .layout-9 .num-5 {
    top: 33.333333%;
    bottom: 33.333333%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-9 .num-5 {
    left: 33.333333%;
    right: 33.333333%
}

.wfs-p-layout-view .layout-9 .num-6 {
    top: 33.333333%;
    bottom: 33.333333%;
    left: 66.666666%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-9 .num-7 {
    left: 0;
    right: 66.666666%
}

.wfs-p-layout-view .layout-9 .num-7,
.wfs-p-layout-view .layout-9 .num-8 {
    top: 66.666666%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-9 .num-8 {
    left: 33.333333%;
    right: 33.333333%
}

.wfs-p-layout-view .layout-9 .num-9 {
    top: 66.666666%;
    bottom: 0;
    left: 66.666666%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num {
    position: absolute
}

.wfs-p-layout-view .layout-12 .num-1 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-12 .num-1,
.wfs-p-layout-view .layout-12 .num-2 {
    top: 0;
    bottom: 66.666666%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-2 {
    left: 25%;
    right: 50%
}

.wfs-p-layout-view .layout-12 .num-3 {
    left: 50%;
    right: 25%
}

.wfs-p-layout-view .layout-12 .num-3,
.wfs-p-layout-view .layout-12 .num-4 {
    top: 0;
    bottom: 66.666666%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-4 {
    left: 75%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-5 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-12 .num-5,
.wfs-p-layout-view .layout-12 .num-6 {
    top: 33.333333%;
    bottom: 33.333333%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-6 {
    left: 25%;
    right: 50%
}

.wfs-p-layout-view .layout-12 .num-7 {
    left: 50%;
    right: 25%
}

.wfs-p-layout-view .layout-12 .num-7,
.wfs-p-layout-view .layout-12 .num-8 {
    top: 33.333333%;
    bottom: 33.333333%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-8 {
    left: 75%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-9 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-12 .num-9,
.wfs-p-layout-view .layout-12 .num-10 {
    top: 66.666666%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-10 {
    left: 25%;
    right: 50%
}

.wfs-p-layout-view .layout-12 .num-11 {
    top: 66.666666%;
    bottom: 0;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-12 .num-12 {
    top: 66.666666%;
    bottom: 0;
    left: 75%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num {
    position: absolute
}

.wfs-p-layout-view .layout-13 .num-1 {
    top: 25%;
    bottom: 25%;
    left: 25%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-2 {
    top: 0;
    bottom: 75%;
    left: 0;
    right: 75%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-3 {
    top: 0;
    bottom: 75%;
    left: 25%;
    right: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-4 {
    top: 0;
    bottom: 75%;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-5 {
    top: 0;
    bottom: 75%;
    left: 75%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-6 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-13 .num-6,
.wfs-p-layout-view .layout-13 .num-7 {
    top: 25%;
    bottom: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-7 {
    left: 75%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-8 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-13 .num-8,
.wfs-p-layout-view .layout-13 .num-9 {
    top: 50%;
    bottom: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-9 {
    left: 75%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-10 {
    top: 75%;
    bottom: 0;
    left: 0;
    right: 75%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-11 {
    top: 75%;
    bottom: 0;
    left: 25%;
    right: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-12 {
    top: 75%;
    bottom: 0;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-13 .num-13 {
    top: 75%;
    bottom: 0;
    left: 75%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num {
    position: absolute
}

.wfs-p-layout-view .layout-16 .num-1 {
    top: 0;
    bottom: 75%;
    left: 0;
    right: 75%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-2 {
    top: 0;
    bottom: 75%;
    left: 25%;
    right: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-3 {
    top: 0;
    bottom: 75%;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-4 {
    top: 0;
    bottom: 75%;
    left: 75%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-5 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-16 .num-5,
.wfs-p-layout-view .layout-16 .num-6 {
    top: 25%;
    bottom: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-6 {
    left: 25%;
    right: 50%
}

.wfs-p-layout-view .layout-16 .num-7 {
    left: 50%;
    right: 25%
}

.wfs-p-layout-view .layout-16 .num-7,
.wfs-p-layout-view .layout-16 .num-8 {
    top: 25%;
    bottom: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-8 {
    left: 75%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-9 {
    left: 0;
    right: 75%
}

.wfs-p-layout-view .layout-16 .num-9,
.wfs-p-layout-view .layout-16 .num-10 {
    top: 50%;
    bottom: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-10 {
    left: 25%;
    right: 50%
}

.wfs-p-layout-view .layout-16 .num-11 {
    top: 50%;
    bottom: 25%;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-12 {
    top: 50%;
    bottom: 25%;
    left: 75%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-13 {
    top: 75%;
    bottom: 0;
    left: 0;
    right: 75%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-14 {
    top: 75%;
    bottom: 0;
    left: 25%;
    right: 50%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-15 {
    top: 75%;
    bottom: 0;
    left: 50%;
    right: 25%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-16 .num-16 {
    top: 75%;
    bottom: 0;
    left: 75%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num {
    position: absolute
}

.wfs-p-layout-view .layout-17 .num-2 {
    top: 0;
    bottom: 80%;
    left: 0;
    right: 80%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-3 {
    top: 0;
    bottom: 80%;
    left: 20%;
    right: 60%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-4 {
    top: 0;
    bottom: 80%;
    left: 40%;
    right: 40%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-5 {
    top: 0;
    bottom: 80%;
    left: 60%;
    right: 20%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-6 {
    top: 0;
    bottom: 80%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-7 {
    top: 20%;
    bottom: 60%;
    left: 0;
    right: 80%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-1 {
    top: 20%;
    bottom: 20%;
    left: 20%;
    right: 20%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-8 {
    top: 20%;
    bottom: 60%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-9 {
    left: 0;
    right: 80%
}

.wfs-p-layout-view .layout-17 .num-9,
.wfs-p-layout-view .layout-17 .num-10 {
    top: 40%;
    bottom: 40%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-10 {
    left: 80%;
    right: 0;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-11 {
    top: 60%;
    bottom: 20%;
    left: 0;
    right: 80%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-12 {
    top: 60%;
    bottom: 20%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-13 {
    left: 0;
    right: 80%
}

.wfs-p-layout-view .layout-17 .num-13,
.wfs-p-layout-view .layout-17 .num-14 {
    top: 80%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-14 {
    left: 20%;
    right: 60%
}

.wfs-p-layout-view .layout-17 .num-15 {
    left: 40%;
    right: 40%
}

.wfs-p-layout-view .layout-17 .num-15,
.wfs-p-layout-view .layout-17 .num-16 {
    top: 80%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-17 .num-16 {
    left: 60%;
    right: 20%
}

.wfs-p-layout-view .layout-17 .num-17 {
    top: 80%;
    bottom: 0;
    left: 80%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num {
    position: absolute
}

.wfs-p-layout-view .layout-25 .num-1 {
    top: 0;
    bottom: 80%;
    left: 0;
    right: 80%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-2 {
    top: 0;
    bottom: 80%;
    left: 20%;
    right: 60%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-3 {
    top: 0;
    bottom: 80%;
    left: 40%;
    right: 40%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-4 {
    top: 0;
    bottom: 80%;
    left: 60%;
    right: 20%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-5 {
    top: 0;
    bottom: 80%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-6 {
    left: 0;
    right: 80%
}

.wfs-p-layout-view .layout-25 .num-6,
.wfs-p-layout-view .layout-25 .num-7 {
    top: 20%;
    bottom: 60%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-7 {
    left: 20%;
    right: 60%
}

.wfs-p-layout-view .layout-25 .num-8 {
    left: 40%;
    right: 40%
}

.wfs-p-layout-view .layout-25 .num-8,
.wfs-p-layout-view .layout-25 .num-9 {
    top: 20%;
    bottom: 60%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-9 {
    left: 60%;
    right: 20%
}

.wfs-p-layout-view .layout-25 .num-10 {
    top: 20%;
    bottom: 60%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-11 {
    top: 40%;
    bottom: 40%;
    left: 0;
    right: 80%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-12 {
    top: 40%;
    bottom: 40%;
    left: 20%;
    right: 60%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-13 {
    top: 40%;
    bottom: 40%;
    left: 40%;
    right: 40%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-14 {
    top: 40%;
    bottom: 40%;
    left: 60%;
    right: 20%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-15 {
    top: 40%;
    bottom: 40%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-16 {
    top: 60%;
    bottom: 20%;
    left: 0;
    right: 80%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-17 {
    top: 60%;
    bottom: 20%;
    left: 20%;
    right: 60%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-18 {
    top: 60%;
    bottom: 20%;
    left: 40%;
    right: 40%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-19 {
    top: 60%;
    bottom: 20%;
    left: 60%;
    right: 20%;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-20 {
    top: 60%;
    bottom: 20%;
    left: 80%;
    right: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-right: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-21 {
    left: 0;
    right: 80%
}

.wfs-p-layout-view .layout-25 .num-21,
.wfs-p-layout-view .layout-25 .num-22 {
    top: 80%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-22 {
    left: 20%;
    right: 60%
}

.wfs-p-layout-view .layout-25 .num-23 {
    left: 40%;
    right: 40%
}

.wfs-p-layout-view .layout-25 .num-23,
.wfs-p-layout-view .layout-25 .num-24 {
    top: 80%;
    bottom: 0;
    border-top: 1px solid #e8eaec;
    border-left: 1px solid #e8eaec;
    border-bottom: 1px solid #e8eaec
}

.wfs-p-layout-view .layout-25 .num-24 {
    left: 60%;
    right: 20%
}

.wfs-p-layout-view .layout-25 .num-25 {
    top: 80%;
    bottom: 0;
    left: 80%;
    right: 0;
    border: 1px solid #e8eaec
}

.wfsplayer-layout-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    font-size: 12px
}

.wfsplayer-layout-wrapper .player {
    background-color: #516f8a;
    z-index: 9
}

.wfsplayer-layout-wrapper video {
    width: 100%;
    height: 100%;
    -o-object-fit: fill;
    object-fit: fill
}

.wfsplayer-layout-wrapper .plate-text {
    width: calc(100% - 5px);
    margin-right: 5px;
    background: transparent;
    text-align: end;
    display: block;
    padding-right: 5px
}

.wfsplayer-layout-wrapper .ctrl-bar,
.wfsplayer-layout-wrapper .plate-text {
    border-radius: 1px;
    height: 26px;
    line-height: 26px;
    color: #fff;
    font-size: 12px;
    position: absolute;
    bottom: 0;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-transition: opacity .3s ease 0s;
    transition: opacity .3s ease 0s;
    opacity: 1
}

.wfsplayer-layout-wrapper .ctrl-bar {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: end;
    -ms-flex-pack: end;
    justify-content: flex-end;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    width: calc(100% - 1px);
    padding-left: 3px;
    background-color: #fafafa;
    overflow: hidden
}

.wfsplayer-layout-wrapper .ctrl-block {
    margin-right: 2px;
    width: 26px;
    height: 100%;
    background-size: 20px;
    background-color: initial;
    color: inherit;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    background-repeat: no-repeat;
    background-position: 50%;
    overflow: hidden;
    cursor: pointer
}

.wfsplayer-layout-wrapper .ctrl-block:hover {
    border: 1px solid #95a5a6
}

.wfsplayer-layout-wrapper .ctrl-plate-text {
    -webkit-box-flex: 1;
    -ms-flex-positive: 1;
    flex-grow: 1;
    color: #5a5a5a;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden
}

.wfsplayer-layout-wrapper .ctrl-download-speed {
    color: #5a5a5a;
    width: 65px;
    text-align: end
}

.wfsplayer-layout-wrapper .ctrl-codetype {
    color: #4885d4
}

.wfsplayer-layout-wrapper .ctrl-stop {
    background-image: url(data:image/png;base64,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)
}

.wfsplayer-layout-wrapper .ctrl-snapshot {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAgCAYAAACVU7GwAAADCUlEQVRYR81XTVITURD+ehIUq6iSGwBLJCngBISFZlypNwg3wKUMFqHM4FI8AXACceVEFyQnIFQGWRJOIFZpiUqmrR6YYWZ885eklOxS81739/p9/fX3CLfwRx4m3TzeUOLTtD3rxWxPvumvuhVo2tLQ53CctvWy3IqLEwBls3KRw8sS4NHW56caO++GBnQdgBnPm+ulbVW8AKhuXV2p4q5USje7LYCGr5KfhNuWUa4kgkqrwH8BVamfTt67czEfB87h/jYBC2ngs35noKNRYdVb/+PX+FGrPnMu/93rE76Q098hosmsQUe9jpnPWSusfFx7sE9XHUUHI0nCOANxD0zTIEwNFNPhZRqeK7wJB62L/kTHK78vM+6BUWFglUD3s4HkNlUb3S+DXBszjhyi2idjrpOWTH99Ms39/j4RYjnrxZBrJN2M0aeETAy8bRoln6RpoG4EWmSH1CIdCDIAqHh9kbiPt06WPqzNtuOAVhu2VOxJ0kFygWLwV9KKC97Y8QK73cvORkQyegBtWsbcbhCASM/dsW+9JI7lAgXQSjSJbto7AGpxJ2fwftMoPwt+T+v4zKCkSk2jHNKxasNeJcKbdE7xpmWUQ2Os2rA7ccTPDAoIc+mqoy4PM3euVpgJXnsStzKDinZcXtcQdQW6Gd+JmUFF+ZQUVHmdjD1rveRzL4lX/wxUtNIjAXVLry9M9Cx6448Ohb6NhOiSwDJKvlP1LE8Wi6yyvrppnwKYVjrPfLPvb71JI7xqTurmcQ1gEV3lLwfRr/b3QYtRZ/DQPF7QmOvumCFMueMI6MBBPfpqyaJvuUGJjW0apcV0FVev0Bv2AQjKB4O3Izco2Sjz7OfviZWoqUsCKo0xPvZdRlLsnPRBVc3ueXZXeJM26KnTqnatScIhJbFD+xlnlMXfJCWVqgFoaVTsBH2U8KzAPH99VanV8eWD8Z7czeDDtNPm+C5P/PSKKAJKgzjQKq7uuOUl2h34BZIDcexSeQkx16RbQ2Io7YrLy4FOORSuYrEXtDUhUEMFHuHmPyfRoJlWO/FbAAAAAElFTkSuQmCC)
}

.wfsplayer-layout-wrapper .ctrl-muted {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACp0lEQVRYR8VXTZLSQBh9X4DSKjZ4goGlTii5gcxCyXI8weAJHJcaLLGG6FI8gXgCdBd0IXOCwYLRpdzAcYHllEw+q1PToUk65Icpp5ekyXv9vq/f90K45kXXjI+tCVhH0+aFYZx9tncneQ6Tm0Cz+6Nys7gYgtAUwB4ZDz89u/MhK4lcBMSpmTAkoooEZMbHUcfc1xFo9WaHHtFYp1JmApYz7QL0IgrEx65d99VQl9WbDUA4YMaTUcfsh5+nJhCWPA0BBfzr+bLcHHdrZxsJWK+/V4mxE97keV4F8Aaq5EkE0oCLdwQKCHC+WJ5sBolvMbUHdOD+b4VC1316e66+ZUXgaNqEQV+ydrHYz4xAYh34g1ff9g32hmCM3Y65d6UEksAlWKs3mxDhLoxCTVVhKwXSggsSlnPaBvgdGO/djtmWxHITSALX1dxyZgxg7tpmbSsCSeBBzcEvXbvelWCWMx0DdO/P3/IteSUzK5AELsB8zygtfgLr5hSYmMd77vP6eP0aprgFacDDTefa5uqQ0kXzEEgCF03m2ruDQO7ebA7CzpUQSAT3/Z6rchbIEoj/jTpmI1DFmfUJeIwsCqQDx4Fab1lrBt6ObPMw3ISqKhubMD2474f+NJSWDgKRUWxI04lTJZZANnCFQDCu6dFaT1waUVgVLYHs4CsC4qSl0u9qOHxYl02ZaMX5wFcEdMNMJCIivAnbcMQHmKgvg0PsSCXRcLqlT0T3ndNGAXzC4F9qT0SsWDqYsMjs4PEKSOnjQmskksUlmfgsKM+iV6Dl332aqA2pzQPiR1krtQ/UzUJOg3ngz/XI0hNICjhrCogOvlFctM+X5YEuQCqGEknGm2L5JhKpU3H4JcJw4C0HYryKZ//1w0Qlc22fZkm1Tfs8dwnSAiTt+wevK7s/Y5o+4AAAAABJRU5ErkJggg==)
}

.wfsplayer-layout-wrapper .ctrl-volume {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACjElEQVRYR+2W0W4SURCGZ5Y2mNSk9Amkl9ol1DeAC2XvhCfo9gnkVhfTTWT1svoE8Ab2clcv5A1qwlYv0SewJjTBCGfMLD317AG2uxZKYuSG5HA4880//5k5CGv+4Jrjw78BUHEHhfzm8IAw9+398wcnWVS9sQKPX32uo5h0ELFAROdBq7RzKwCXWXcQsK4G9B0zU1KZNstAtXbYBKAjzlrPdqUA1usvRZhMOoBQWSSzDmB5ZzYQHYzGW42eu3uu/y+1AklZJ5WAS3Vnc3hCBGWBRvWDs/dJ3T8XwHrZr2Bug3ijEKKAQM2krNN4wGqHXQJ68nN8d1dVIgagOjqLk3WAKOv8qOA/u/9V/c3y+j0C3A4c86FcvwLg+tJkfDrPWFlg2AOciEHiHQAe+s5eV/5/Wo6L7yCo6r8o9Xj9DwCbBaiTJdi8vdKEkfn4PCUY7+dS8LffMm0NoO8C4NGyAPicmhe+QYKy3zKr8lypjgRVFFg+wCPvbD8HdKpeTbk2+rW1w2ZcKUAkuRfSTBmUtZUC6NlGQNzMxGRwKwpYXt8lwnrQMvelB7jHgIEfZzzAnQ4RjpdlQpm9QKOhjujoFiAVfacUtfNYH2BplgEgnU4AbwPHbKp9IL8xHJCRO5RQsU54dXdvQMHScvaIWNQfJ7V2yI+VolqSmVkwNYmoAIii5CCAJgJup+FaNI4jPwA0BRgVdSClmobTx8eFiwBPr4PQAS7b7zEBNQhztq5KKoCYgxG7gHBvEYgOMB3jYAtEWx/FMRNel1nMSAlqrPRFpEKy0QyiLiKU9XGcNpm/UkA/nM0lhxgB/Qic0sw7MQkokwcWHTS9OWMbBPTknE+rwlIA0gabt+8/wNoV+A2EdkkwivO81wAAAABJRU5ErkJggg==)
}

.wfsplayer-layout-wrapper .ctrl-fullscreen {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/sl0p8zAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAOYSURBVHja7JdNaB1VGIaf98zNrRJjkQiC1E1RESrYhYtqMaGK0UIXiquKuBGh4FprKWQhaKkKWbkouHPTlcVVbBYpDYiiCC1WShHctKBoFWsajPfeOW8XcyaZmd6/SCEbv+Ewv+d873m/35FttlMC2yzbDqBVvZl7/9J8pvAq9jpwMz1W5TwBXAVOyfFsda6lF0BHgF1AFyhtGylu7kdMR/P50vE9R/oCCPAaeDciGwJ6r2P2W+7sbGPuywr5oeaaSXoq2A4BXgL6A5BYBzLgW+AbYK1qJuHM1s1onW9qiOZ0Zn6RfI9RDuqmufvBsxtsyH8ONAGwms7LwCngRsUEpRnyBKwpXwEXig0oAn8Dz4NfqeIUDAVQ2q0DXK/4wTjSNfqrcn8APA88DFwG/Q5+ZlQUlLu9C2gP1lV8FkKsDUnluzlgAXgK+B70NrCSXmqcMByZnUIwUn2kaQeBD4EnQBdA7wJfJtMND8MmusFipNh8mAEvgk8Ce0AXgaPAOWAn+O5+OpoAdiRvnxgGplB+G0lPAh8DjwGXgGPAEhjhFtByseSOYSa4BqzZWrUVbVEbgDEKPXz78UjynSugY8AiUM6NtlZT9FwbxsAndvg5xtZyPdQKGwf1iuv+5HxRANDlFJLYgRgDoDVgOYTeTilfHAZgKUYtNektPDyOcoxV4NMBPtMBVmLUSpZtsRiNqfwOV0P1i9itySb9m4sqZCPD8A6IiTHDDv+JgbkQvACaAfXLhPuA14Gp0UtXaVQbMSPlCylLDmTgLSk+l6lzA/jBqFOxwiHgI0ltYwOfNXceNvwmB9cS3yTiWeBNYHeRH/ozsAuYFJ4SDtqMhoPgEynJdIR+EvXDbmGrLNvNNB2Ep4DJpGMgA/+mqO+BeqVZgBPA48CPoKPAd7VeIIZi/yGWWaNfbelWdYwox/onleIDwMlUWC6m9LrY9HZbW4kYjxMFZWGZB/Ym5e+UtiupLnavcQuoxqmGZU2dSZ3Mo8DXwHHgnDAGorMx9NWkA6yPy0AOnknXV0DvFc2E7wMHUNmSdRvzJpKTZQ0lLsrxRoMzuBwbplWLDP2a2qj9SUGWcv75NKryNDCbckQ1BmMCti9pmRrMgDWNCGlSTN3sbKUmAvSC/GB0HUAQh4E3jIZl19yxno9rH0c4HazDyH8IX+/zY9IGroremZbc7JHOAA8ADyWbu2ICAffGGLTebX9Q88z/f063G8CtAQD2YF8bMWoAeAAAAABJRU5ErkJggg==)
}

.wfsplayer-layout-wrapper .ctrl-minimize {
    background-image: url(data:image/png;base64,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)
}

.wfsplayer-layout-wrapper .ctrl-pause {
    background-image: url(data:image/png;base64,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)
}

.wfsplayer-layout-wrapper .ctrl-playing {
    background-image: url(data:image/png;base64,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)
}

.wfsplayer-layout-wrapper .ctrl-download {
    background-image: url(data:image/png;base64,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)
}

.wfsplayer-layout-wrapper .ctrl-codetype-pane {
    position: absolute;
    bottom: 26px;
    width: 60px;
    background-color: rgba(0, 0, 0, .5);
    color: #fff;
    right: 100px;
    cursor: pointer
}

.wfsplayer-layout-wrapper .ctrl-codetype-pane .codetype-item {
    padding: 5px 0;
    text-align: center
}

.wfsplayer-layout-wrapper .ctrl-codetype-pane .codetype-item:hover {
    background-color: rgba(41, 182, 246, .4)
}

.wfsplayer-layout-wrapper .log-pane {
    border-radius: 1px;
    width: 100%;
    height: 40%;
    line-height: 16px;
    color: #fff;
    font-size: 12px;
    padding-left: 8px;
    padding-right: 5px;
    background: transparent;
    position: absolute;
    bottom: 0;
    text-align: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-transition: opacity .3s ease 0s;
    transition: opacity .3s ease 0s
}

.wfsplayer-layout-wrapper .log-pane .log-line {
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-size: 13px
}

.wfsplayer-layout-wrapper .replay-pane {
    border-radius: 1px;
    width: 100%;
    height: 100%;
    color: #fff;
    background: transparent;
    position: absolute;
    bottom: 0;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex
}

.wfsplayer-layout-wrapper .replay-pane .replay-img {
    width: 44px;
    height: 44px;
    cursor: pointer;
    background-image: url(data:image/png;base64,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);
    background-repeat: round
}

.wfsplayer-layout-wrapper .replay-pane .replay-img:hover {
    background-image: url(data:image/png;base64,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)
}
`