/**
 * Created by wudengke on 2017/2/1.
 */
$(function(){
    var defaults={
        canvasWidth:500,
        canvasHeight:600,
        sourceCanvas:"source-canvas",
        DestinationCanvas:"destination-canvas",
        //滤镜
        opacity:{
            opacity:{min:0,max:1.00,step:0.01,default:1.00,percentage:true}
        },
        grey:{
            grey:{min:0,max:3.0,step:0.1,default:1.0,percentage:true}
        },
        blackWhite:{
            threshold:{min:0,max:255,step:1,default:125}
        },
        blur:{
            distance:{min:4,max:16,step:1,default:8}
        },
        mosaic:{
            size:{min:5,max:20,step:1,default:10},
            distance:{min:1,max:6,step:1,default:3},
            x:0,
            y:0
        },
        bright:{
            brightness:{min:0,max:3.00,step:0.01,default:2.00,percentage:true}
        },
        saturation:{
            saturation:{min:0,max:3.0,step:0.1,default:1.0,percentage:true}
        },
        rotate:{
            angle:{min:0,max:360,step:1,default:0}
        },
        //裁剪工具
        cutTools:{
            cutAreaColor:"#fff",
            cutAreaBorderColor:"#fff",
            cutAreaOpacity:0.3
        }
    };
    var canvasS=document.getElementById("source-canvas"),
        contextS=canvasS.getContext("2d"),
        canvasD=document.getElementById("destination-canvas"),
        contextD=canvasD.getContext("2d"),
        canvasM=document.getElementById("middle-canvas"),
        contextM=canvasM.getContext("2d");
    canvasS.width=defaults.canvasWidth;
    canvasS.height=defaults.canvasHeight;
    canvasD.width=defaults.canvasWidth;
    canvasD.height=defaults.canvasHeight;

    var SourceCanvas=$("#source-canvas"),
        DestinationCanvas=$("#destination-canvas"),
        MiddleCanvas=$("#middle-canvas");
    SourceCanvas.status={
        isMouseDown:false,
        lastMouseLocationX:0,
        lastMouseLocationY:0,
        lastImageLocationX:0,
        lastImageLocationY:0,
        startX:0,
        startY:0,
        endX:0,
        endY:0,
        curImageWidth:0,
        curImageHeight:0
    };
    DestinationCanvas.status={
        isMouseDown:false,
        lastMouseLocationX:0,
        lastMouseLocationY:0,
        lastImageLocationX:0,
        lastImageLocationY:0,
        curImageWidth:0,
        curImageHeight:0
    };
    DestinationCanvas.cutStatus={};
    var image=new Image(),
        imageWidth=0,
        imageHeight=0;
    var maxScale=5.0,
        minScale=0.1;
    var maxImageWidth=0,
        maxImageHeight=0,
        minImageWidth=0,
        minImageHeight=0;

    image.src="./dist/jana.jpg";
    imageWidth=image.width;
    imageHeight=image.height;
    maxImageWidth=imageWidth*maxScale;
    maxImageHeight=imageHeight*maxScale;
    minImageWidth=imageWidth*minScale;
    minImageHeight=imageHeight*minScale;

    canvasM.width=imageWidth;
    canvasM.height=imageHeight;

    SourceCanvas.status.curImageWidth=imageWidth;
    SourceCanvas.status.curImageHeight=imageHeight;
    DestinationCanvas.status.curImageWidth=imageWidth;
    DestinationCanvas.status.curImageHeight=imageHeight;

    var startTamp=0;

    image.onload=function(){
        contextS.save();

        contextS.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextS);
        contextS.drawImage(image,0,0,imageWidth,imageHeight);
        contextS.beginPath();
        contextS.rect(0,0,SourceCanvas.status.curImageWidth,SourceCanvas.status.curImageHeight);
        contextS.strokeStyle="white";
        contextS.stroke();

        contextS.restore();
    };

    $("canvas").not("#middle-canvas").on("mousedown.drag",function(e){
        var _self=getCanvas(this);
        _self.status.isMouseDown=true;
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        _self.status.lastMouseLocationX=locationToCanvas.x;
        _self.status.lastMouseLocationY=locationToCanvas.y;
    }).on("mouseup.drag",function(){
        var _self=getCanvas(this);
        _self.status.isMouseDown=false;
    }).on("mouseout.drag",function(){
        var _self=getCanvas(this);
        _self.status.isMouseDown=false;
    }).on("mousemove.drag",function(e){
        var _self=getCanvas(this);
        //鼠标拖放
        if(_self.status.isMouseDown){
            var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
            var curImageLocationX=_self.status.lastImageLocationX+locationToCanvas.x-_self.status.lastMouseLocationX,
                curImageLocationY=_self.status.lastImageLocationY+locationToCanvas.y-_self.status.lastMouseLocationY;
            _self.status.lastImageLocationX=curImageLocationX;
            _self.status.lastImageLocationY=curImageLocationY;
            _self.status.lastMouseLocationX=locationToCanvas.x;
            _self.status.lastMouseLocationY=locationToCanvas.y;
            //移动图片
            $.filter.moveImage(_self);
        }
    }).on("mousewheel.drag",function(e){
        var _self=getCanvas(this);
        //滚轮缩放
        var scaleByX=-imageWidth*0.1*e.deltaY,
            scaleByY=-imageHeight*0.1*e.deltaY;
        _self.status.curImageWidth-=scaleByX;
        _self.status.curImageHeight-=scaleByY;
        if(_self.status.curImageWidth>=minImageWidth&&_self.status.curImageWidth<=maxImageWidth&&_self.status.curImageHeight>=minImageHeight&&_self.status.curImageHeight<=maxImageHeight){
            var locationToCanvas=getLocationToCanvas($(this),e.clientX,e.clientY);
            (locationToCanvas.x<_self.status.lastImageLocationX)&&(locationToCanvas.x=_self.status.lastImageLocationX);
            (locationToCanvas.y<_self.status.lastImageLocationY)&&(locationToCanvas.y=_self.status.lastImageLocationY);
            (locationToCanvas.x>_self.status.lastImageLocationX+_self.status.curImageWidth)&&(locationToCanvas.x=_self.status.lastImageLocationX+_self.status.curImageWidth);
            (locationToCanvas.y>_self.status.lastImageLocationY+_self.status.curImageHeight)&&(locationToCanvas.y=_self.status.lastImageLocationY+_self.status.curImageHeight);
            var curImageLocationX=_self.status.lastImageLocationX+(locationToCanvas.x-_self.status.lastImageLocationX)/_self.status.curImageWidth*scaleByX,
                curImageLocationY=_self.status.lastImageLocationY+(locationToCanvas.y-_self.status.lastImageLocationY)/_self.status.curImageHeight*scaleByY;

            _self.status.lastImageLocationX=curImageLocationX;
            _self.status.lastImageLocationY=curImageLocationY;
            //更新图片
            $.filter.moveImage(_self);
        }else{
            //复原！！！
            _self.status.curImageWidth+=scaleByX;
            _self.status.curImageHeight+=scaleByY;
        }
    });
    $("#effect").on("change",function(){
        if(this.value){
            var effect=this.value;
            $.filter(effect);
        }
    });

    function drawBackground(context){
        context.save();
        context.rect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        context.fillStyle="black";
        context.fill();
        context.restore();
    }
    function getCanvas(dom){
        if(dom.getAttribute("id")==defaults.sourceCanvas){
            return SourceCanvas;
        }else{
            return DestinationCanvas;
        }
    }
    function getDrawTarget(dom){
        if(dom.getAttribute("id")==defaults.sourceCanvas){
            return image;
        }else{
            return canvasM;
        }
    }
    function getLocationToCanvas(Canvas,x,y){
        var canvasLocation=Canvas.offset(),
            locationX=x-canvasLocation.left,
            locationY=y-canvasLocation.top;
        return {
            x:locationX,
            y:locationY
        }
    }

    //根据当前图片状态绘制
    function drawImage(drawTarget,x,y,Canvas){
        var context=Canvas[0].getContext("2d");
        context.save();

        context.drawImage(drawTarget,x,y,Canvas.status.curImageWidth,Canvas.status.curImageHeight);
        //绘制白色边框
        context.beginPath();
        context.rect(x,y,Canvas.status.curImageWidth,Canvas.status.curImageHeight);
        context.strokeStyle="white";
        context.stroke();

        context.restore();
    }
    //滤镜，实现各种效果
    $.filter=function(effect){
        if(!effect){
            console.log("effect is`not given");
            return;
        }
        $.filter.effect=effect;
        /*//重置为初始值
        SourceCanvas.status.curImageWidth=imageWidth;
        SourceCanvas.status.curImageHeight=imageHeight;
        SourceCanvas.status.lastImageLocationX=0;
        SourceCanvas.status.lastImageLocationY=0;
        DestinationCanvas.status.curImageWidth=imageWidth;
        DestinationCanvas.status.curImageHeight=imageHeight;
        DestinationCanvas.status.lastImageLocationX=0;
        DestinationCanvas.status.lastImageLocationY=0;*/

        contextM.clearRect(0,0,contextM.width,contextM.height);
        contextM.drawImage(image,0,0,imageWidth,imageHeight);

        switch (effect){
            case "opacity":
            case "grey":
            case "blackWhite":
            case "blur":
            case "mosaic":
            case "bright":
            case "saturation":
            case "rotate":
                for(var slider in defaults[effect]){
                    $.filter.initSlider(slider,defaults[effect][slider].percentage);
                }
                $.filter[effect]();
                break;
            default:
                $(".controller-slider>li").hide();
                $.filter[effect]();
        }
        $.filter.drawImage();
    };
    //调整效果参数后更新DestinationCanvas
    $.filter.update=function(){
        contextM.clearRect(0,0,contextM.width,contextM.height);
        contextM.drawImage(image,0,0,imageWidth,imageHeight);

        startTamp=new Date().getTime();
        $.filter[$.filter.effect]();

        $.filter.drawImage($.filter.effect=="rotate");
    };
    $.filter.initSlider=function(slider,isPercentage){
        $(".controller-slider>li>input[id^="+this.effect+"]").parent().show().siblings().hide();
        var Slider=$("#"+this.effect+"-"+slider);
        var min=defaults[this.effect][slider].min,
            max=defaults[this.effect][slider].max;
        if(isPercentage){
            min=min*100+"%";
            max=max*100+"%";
        }
        Slider.on("change.slider",function(){
            $.filter.settings[$.filter.effect][slider]=this.value;
            $.filter.update($.filter.effect);
            $.filter.updateSlider($(this),isPercentage)
        }).prop({
            min:defaults[this.effect][slider].min,
            max:defaults[this.effect][slider].max,
            step:defaults[this.effect][slider].step,
            value:defaults[this.effect][slider].default
        }).parent()
            .append("<span class='min'>"+min+"</span>")
            .append("<span class='max'>"+max+"</span>");
        $.filter.updateSlider(Slider,isPercentage);
    };
    $.filter.updateSlider=function(Slider,isPercentage){
        var curValue=Slider.val(),
            html=Slider.prev().html();
        html=html.indexOf("<b>")<0?html.substring(0):html.substring(0,html.indexOf("<b>"));
        if(isPercentage){
            curValue=curValue*100+"%";
        }
        Slider.prev().html(html+"<b>"+curValue+"</b>");
    };
    //前缀是当前滤镜
    $.filter.settings={
        opacity:{
            opacity:defaults.opacity.opacity.default
        },
        grey:{
            grey:defaults.grey.grey.default
        },
        blackWhite:{
            threshold:defaults.blackWhite.threshold.default
        },
        blur:{
            distance:defaults.blur.distance.default
        },
        mosaic:{
            Size:defaults.mosaic.size.default,
            distance:defaults.mosaic.distance.default,
            x:defaults.mosaic.x,
            y:defaults.mosaic.y,
            width:imageWidth,
            height:imageHeight
        },
        bright:{
            brightness:defaults.bright.brightness.default
        },
        saturation:{
            saturation:defaults.saturation.saturation.default
        },
        rotate:{
            angle:defaults.rotate.angle.default
        }
    };
    $.filter.moveImage=function(Canvas){
        var context=Canvas[0].getContext("2d");
        context.save();

        context.clearRect(0,0,canvasD.width,canvasD.height);
        context.drawImage(getDrawTarget(Canvas[0]),Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas.status.curImageWidth,Canvas.status.curImageHeight);
        context.beginPath();
        context.rect(Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas.status.curImageWidth,Canvas.status.curImageHeight);
        context.strokeStyle="white";
        context.stroke();
        context.restore();
    };
    $.filter.drawImage=function(rotate){
        $.filter.drawBorder();
        if(rotate){
            var angle=this.settings.rotate.angle/180*Math.PI;
            contextD.save();

            contextD.clearRect(0,0,canvasD.width,canvasD.height);
            contextD.translate(DestinationCanvas.status.curImageWidth/2,DestinationCanvas.status.curImageHeight/2);
            contextD.rotate(angle);
            contextD.drawImage(canvasM,DestinationCanvas.status.lastImageLocationX-DestinationCanvas.status.curImageWidth/2,
                DestinationCanvas.status.lastImageLocationY-DestinationCanvas.status.curImageHeight/2,DestinationCanvas.status.curImageWidth,DestinationCanvas.status.curImageHeight);

            contextD.restore();
        }else{
            contextD.save();

            contextD.clearRect(0,0,canvasD.width,canvasD.height);
            contextD.drawImage(canvasM,DestinationCanvas.status.lastImageLocationX,DestinationCanvas.status.lastImageLocationY,DestinationCanvas.status.curImageWidth,DestinationCanvas.status.curImageHeight);

            contextD.restore();
        }
    };
    //在MiddleCanvas上绘制边框
    $.filter.drawBorder=function(){
        contextM.save();
        contextM.beginPath();
        contextM.rect(0,0,imageWidth,imageHeight);
        contextM.strokeStyle="white";
        contextM.stroke();
        contextM.restore();
    };
    /*
     * 各种滤镜
     */
    $.filter.opacity=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        for(var i=0;i<imageWidth*imageHeight;i++){
            pixelData[4*i+3]=255*this.settings.opacity.opacity;
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //灰度滤镜
    $.filter.grey=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        var grey=this.settings.grey.grey;
        for(var i=0;i<imageWidth*imageHeight;i++){
            var r=pixelData[4*i],
                g=pixelData[4*i+1],
                b=pixelData[4*i+2],
                a=pixelData[4*i+3];
            var value=(r*0.3+g*0.59+b*0.11)*grey;
            pixelData[4*i]=value;
            pixelData[4*i+1]=value;
            pixelData[4*i+2]=value;
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //黑白滤镜
    $.filter.blackWhite=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        var threshold=this.settings.blackWhite.threshold;
        for(var i=0;i<imageWidth*imageHeight;i++){
            var r=pixelData[4*i],
                g=pixelData[4*i+1],
                b=pixelData[4*i+2],
                a=pixelData[4*i+3];
            var grey=r*0.3+g*0.59+b*0.11,
                v=0;
            grey>threshold?v=255:v=0;
            pixelData[4*i]=v;
            pixelData[4*i+1]=v;
            pixelData[4*i+2]=v;
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //反色滤镜
    $.filter.reverse=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        for(var i=0;i<imageWidth*imageHeight;i++){
            var r=pixelData[4*i],
                g=pixelData[4*i+1],
                b=pixelData[4*i+2],
                a=pixelData[4*i+3];
            pixelData[4*i]=255-r;
            pixelData[4*i+1]=255-g;
            pixelData[4*i+2]=255-b;
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //模糊滤镜
    $.filter.blur=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        var blurDistance=this.settings.blur.distance;
        for(var i=0;i<imageHeight;i++){
            for(var j=0;j<imageWidth;j++){
                var totalR=0,totalG=0,totalB=0,totalNum=0;
                for(var dr=-blurDistance;dr<=blurDistance;dr++){
                    for(var dc=-blurDistance;dc<=blurDistance;dc++){
                        var row=i+dr,
                            col=j+dc;
                        if(0<=row&&row<imageHeight&&0<=col&&col<imageWidth){
                            totalNum+=1;
                            var dp=row*imageWidth+col;
                            totalR+=pixelData[4*dp];
                            totalG+=pixelData[4*dp+1];
                            totalB+=pixelData[4*dp+2];
                        }
                    }
                }
                var p=i*imageWidth+j;
                pixelData[4*p]  =totalR/totalNum;
                pixelData[4*p+1]=totalG/totalNum;
                pixelData[4*p+2]=totalB/totalNum;
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //镜像滤镜
    $.filter.mirror=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        for(var i=0;i<imageHeight;i++){
            for(var j=0;j<imageWidth/2;j++){
                var p=i*imageWidth+j;
                var mirrorP=i*imageWidth+imageWidth-j;
                var tamp=0;
                tamp=pixelData[4*p];
                pixelData[4*p]=pixelData[4*mirrorP];
                pixelData[4*mirrorP]=tamp;
                tamp=pixelData[4*p+1];
                pixelData[4*p+1]=pixelData[4*mirrorP+1];
                pixelData[4*mirrorP+1]=tamp;
                tamp=pixelData[4*p+2];
                pixelData[4*p+2]=pixelData[4*mirrorP+2];
                pixelData[4*mirrorP+2]=tamp;
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    $.filter.mirror2=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        for(var i=0;i<imageHeight;i++){
            for(var j=0;j<imageWidth;j++){
                var p=i*imageWidth+j;
                var mirrorP=i*imageWidth+imageWidth-j;
                pixelData[4*p]=pixelData[4*mirrorP];
                pixelData[4*p+1]=pixelData[4*mirrorP+1];
                pixelData[4*p+2]=pixelData[4*mirrorP+2];
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };

    $.filter.mirror3=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        for(var i=0;i<imageHeight;i++){
            for(var j=0;j<imageWidth;j++){
                var p=i*imageWidth+j;
                if(j>imageWidth/2){
                    var mirrorP=i*imageWidth+imageWidth-j;
                    pixelData[4*p]=pixelData[4*mirrorP];
                    pixelData[4*p+1]=pixelData[4*mirrorP+1];
                    pixelData[4*p+2]=pixelData[4*mirrorP+2];
                }
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //马赛克滤镜
    $.filter.mosaic=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        var size=this.settings.mosaic.size,
            distance=this.settings.mosaic.distance,
            dx=this.settings.mosaic.x,
            dy=this.settings.mosaic.y,
            dw=this.settings.mosaic.width,
            dh=this.settings.mosaic.height;
        console.log(size);
        for(var i=dy-1;i<dy+dh-1;i+=size){
            for(var j=dx-1;j<dx+dw-1;j+=size){
                var totalR=0,totalG=0,totalB=0,totalNum=0;
                for(var dr1=-distance;dr1<distance+size;dr1++){
                    for(var dc1=-distance;dc1<distance+size;dc1++){
                        var row1=i+dr1,
                            col1=j+dc1;
                        if(dy-1<=row1&&row1<dy+dh-1&&dx-1<=col1&&col1<dx+dw-1){
                            totalNum+=1;
                            var dp=row1*imageWidth+col1;
                            totalR+=pixelData[4*dp];
                            totalG+=pixelData[4*dp+1];
                            totalB+=pixelData[4*dp+2];
                        }
                    }
                }
                for(var dr2=0;dr2<=size;dr2++){
                    for(var dc2=0;dc2<=size;dc2++){
                        var row2=i+dr2,
                            col2=j+dc2;
                        if(dy-1<=row2&&row2<dy+dh-1&&dx-1<=col2&&col2<dx+dw-1){
                            var p=row2*imageWidth+col2;
                            pixelData[4*p]=totalR/totalNum;
                            pixelData[4*p+1]=totalG/totalNum;
                            pixelData[4*p+2]=totalB/totalNum;
                        }
                    }
                }
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
        //console.log(pixelData)
    };
    //亮度滤镜
    $.filter.bright=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        var brightness=this.settings.bright.brightness;
        for(var i=0;i<imageHeight;i++){
            for(var j=0;j<imageWidth;j++){
                var p=i*imageWidth+j;
                var r=pixelData[4*p],
                    g=pixelData[4*p+1],
                    b=pixelData[4*p+2],
                    a=pixelData[4*p+3];
                pixelData[4*p]=r*brightness;
                pixelData[4*p+1]=g*brightness;
                pixelData[4*p+2]=b*brightness;
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //饱和度滤镜
    $.filter.saturation=function(){
        var imageData=contextM.getImageData(0,0,imageWidth,imageHeight);
        var pixelData=imageData.data;
        var saturation=this.settings.saturation.saturation;
        for(var i=0;i<imageHeight;i++){
            for(var j=0;j<imageWidth;j++){
                var p=i*imageWidth+j;
                var r=pixelData[4*p],
                    g=pixelData[4*p+1],
                    b=pixelData[4*p+2],
                    average=1/3*(r+g+b);
                pixelData[4*p]=r+(saturation-1)*(r-average);
                pixelData[4*p+1]=g+(saturation-1)*(g-average);
                pixelData[4*p+2]=b+(saturation-1)*(b-average);
            }
        }
        contextM.putImageData(imageData,0,0,0,0,imageWidth,imageHeight);
    };
    //旋转
    $.filter.rotate=function(){
        contextM.clearRect(0,0,imageWidth,imageHeight);
        contextM.save();
        contextM.drawImage(image,0,0,imageWidth,imageHeight);
        contextM.restore();
    };

    /*
     *裁剪工具
     */
    $.cutTools={};
    //矩形裁剪工具
    $.cutTools.rect={};
    $.cutTools.rect.cutStatus={
        isMouseDown:false,
        hasStarted:false,
        done:false,
        lastMouseLocationX:0,
        lastMouseLocationY:0,
        startX:0,
        startY:0,
        width:0,
        height:0
    };
    $.cutTools.rect.mouseDown=function(e){
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if(_self.css("cursor")=="move"){//移动选区

        }else{
            if(!$.cutTools.cutStatus.hasStarted){//开始新选区
                $.cutTools.cutStatus=$.extend(true,{},$.cutTools.rect.cutStatus);
                $.cutTools.cutStatus.hasStarted=true;
                $.cutTools.cutStatus.startX=locationToCanvas.x;
                $.cutTools.cutStatus.startY=locationToCanvas.y;
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
        $.cutTools.cutStatus.isMouseDown=true;
    };
    $.cutTools.rect.mouseUp=function(e){
        var _self=getCanvas(this);
        if(_self.css("cursor")!="move"){
            var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
            $.cutTools.rect.calcAttr(locationToCanvas);
        }
        $.cutTools.rect.fillCutArea(_self);

        $.cutTools.cutStatus.isMouseDown=false;
        $.cutTools.cutStatus.done=true;
        $.cutTools.cutStatus.hasStarted=false;
    };
    $.cutTools.rect.mouseMove=function (e) {
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if($.cutTools.cutStatus.isMouseDown){
            if(_self.css("cursor")=="move"){//移动选区
                $.cutTools.rect.moveBy(locationToCanvas);

                $.cutTools.rect.fillCutArea(_self);
            }else{//新建选区
                $.cutTools.rect.calcAttr(locationToCanvas);

                $.cutTools.rect.stroke(_self);
            }
        }else{
            if($.cutTools.cutStatus.done){
                contextD.save();
                $.cutTools.rect.buildPath();
                if(contextD.isPointInPath(locationToCanvas.x,locationToCanvas.y)){
                    _self.css("cursor","move");
                }else{
                    _self.css("cursor","crosshair");
                }
                contextD.restore();
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
    };
    $.cutTools.rect.moveBy=function(locationToCanvas){
        $.cutTools.cutStatus.startX=$.cutTools.cutStatus.startX+locationToCanvas.x-$.cutTools.cutStatus.lastMouseLocationX;
        $.cutTools.cutStatus.startY=$.cutTools.cutStatus.startY+locationToCanvas.y-$.cutTools.cutStatus.lastMouseLocationY;
    };
    $.cutTools.rect.calcAttr=function(locationToCanvas){
        $.cutTools.cutStatus.width=locationToCanvas.x-$.cutTools.cutStatus.startX;
        $.cutTools.cutStatus.height=locationToCanvas.y-$.cutTools.cutStatus.startY;
    };
    $.cutTools.rect.stroke=function(Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        $.filter.drawImage();
        contextD.save();
        $.cutTools.rect.buildPath();
        contextD.lineWidth=1;
        contextD.strokeStyle=defaults.cutTools.cutAreaBorderColor;
        contextD.stroke();
        contextD.restore();
    };
    $.cutTools.rect.fillCutArea=function (Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        contextD.globalAlpha=defaults.cutTools.cutAreaOpacity;
        $.cutTools.rect.buildPath();
        contextD.fillStyle=defaults.cutTools.cutAreaColor;
        contextD.fill();
        contextD.restore();
    };
    $.cutTools.rect.buildPath=function(){
        contextD.beginPath();
        contextD.rect($.cutTools.cutStatus.startX,$.cutTools.cutStatus.startY,$.cutTools.cutStatus.width,$.cutTools.cutStatus.height);
    };

    //圆形裁剪工具
    $.cutTools.circle={};
    $.cutTools.circle.cutStatus={
        isMouseDown:false,
        hasStarted:false,
        done:false,
        lastMouseLocationX:0,
        lastMouseLocationY:0,
        startX:0,
        startY:0,
        cx:0,
        cy:0,
        radius:0
    };
    $.cutTools.circle.mouseDown=function(e){
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if(_self.css("cursor")=="move"){//移动选区

        }else{
            if(!$.cutTools.cutStatus.hasStarted){//开始新选区
                $.cutTools.cutStatus=$.extend(true,{},$.cutTools.circle.cutStatus);
                $.cutTools.cutStatus.hasStarted=true;
                $.cutTools.cutStatus.startX=locationToCanvas.x;
                $.cutTools.cutStatus.startY=locationToCanvas.y;
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
        $.cutTools.cutStatus.isMouseDown=true;
    };
    $.cutTools.circle.mouseUp=function(e){
        var _self=getCanvas(this);

        if(_self.css("cursor")!="move"){
            var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
            //圆形选区属性确定
            $.cutTools.circle.calcAttr(locationToCanvas);
        }
        $.cutTools.circle.fillCutArea(_self);

        $.cutTools.cutStatus.isMouseDown=false;
        $.cutTools.cutStatus.done=true;
        $.cutTools.cutStatus.hasStarted=false;
    };
    $.cutTools.circle.mouseMove=function (e) {
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if($.cutTools.cutStatus.isMouseDown){
            if(_self.css("cursor")=="move"){//移动选区
                $.cutTools.circle.moveBy(locationToCanvas);

                $.cutTools.circle.fillCutArea(_self);
            }else{//新建选区
                //圆形选区属性确定
                $.cutTools.circle.calcAttr(locationToCanvas);

                $.cutTools.circle.stroke(_self);
            }
        }else{
            if($.cutTools.cutStatus.done){
                contextD.save();
                $.cutTools.circle.buildPath();
                if(contextD.isPointInPath(locationToCanvas.x,locationToCanvas.y)){
                    _self.css("cursor","move");
                }else{
                    _self.css("cursor","crosshair");
                }
                contextD.restore();
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
    };
    $.cutTools.circle.moveBy=function(locationToCanvas){
        $.cutTools.cutStatus.cx=$.cutTools.cutStatus.cx+locationToCanvas.x-$.cutTools.cutStatus.lastMouseLocationX;
        $.cutTools.cutStatus.cy=$.cutTools.cutStatus.cy+locationToCanvas.y-$.cutTools.cutStatus.lastMouseLocationY;
    };
    $.cutTools.circle.calcAttr=function(locationToCanvas){
        var cx=$.cutTools.cutStatus.startX/2+locationToCanvas.x/2,
            cy=$.cutTools.cutStatus.startY/2+locationToCanvas.y/2,
            radius=Math.sqrt((locationToCanvas.x-cx)*(locationToCanvas.x-cx)+(locationToCanvas.y-cy)*(locationToCanvas.y-cy));
        $.cutTools.cutStatus.cx=cx;
        $.cutTools.cutStatus.cy=cy;
        $.cutTools.cutStatus.radius=radius;
    };
    $.cutTools.circle.stroke=function(Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        $.cutTools.circle.buildPath();
        contextD.lineWidth=1;
        contextD.strokeStyle=defaults.cutTools.cutAreaBorderColor;
        contextD.stroke();
        contextD.restore();
    };
    $.cutTools.circle.fillCutArea=function (Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        contextD.globalAlpha=defaults.cutTools.cutAreaOpacity;
        $.cutTools.circle.buildPath();
        contextD.fillStyle=defaults.cutTools.cutAreaColor;
        contextD.fill();
        contextD.restore();
    };
    $.cutTools.circle.buildPath=function(){
        contextD.beginPath();
        contextD.arc($.cutTools.cutStatus.cx,$.cutTools.cutStatus.cy,$.cutTools.cutStatus.radius,0,Math.PI*2);
    };

    //多边形裁剪工具
    $.cutTools.polygon={};
    $.cutTools.polygon.cutStatus={
        isMouseDown:false,
        hasStarted:false,
        lastMouseLocationX:0,
        lastMouseLocationY:0,
        dirtyX:0,
        dirtyY:0,
        points:[],
        done:false
    };
    $.cutTools.polygon.mouseDown=function(e){
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if(_self.css("cursor")=="move"){//移动选区

        }else{
            if(!$.cutTools.cutStatus.hasStarted){//开始新选区
                $.cutTools.cutStatus=$.extend(true,{},$.cutTools.polygon.cutStatus);
                $.cutTools.cutStatus.hasStarted=true;
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
        $.cutTools.cutStatus.isMouseDown=true;
    };
    $.cutTools.polygon.mouseUp=function(e){
        var _self=getCanvas(this);
        $.cutTools.cutStatus.isMouseDown=false;
        if(_self.css("cursor")!="move"){//选区过程
            if($.cutTools.cutStatus.hasStarted){
                var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
                //增加一个点
                $.cutTools.cutStatus.points.push([locationToCanvas.x,locationToCanvas.y]);
                //绘制边
                $.cutTools.polygon.stroke(_self);
            }
        }else{//移动选区
            $.cutTools.polygon.fillCutArea(_self);
        }
    };
    $.cutTools.polygon.dbClick=function(e){//选区完成
        e.preventDefault();
        var _self=getCanvas(this);
        $.cutTools.cutStatus.hasStarted=false;
        $.cutTools.cutStatus.done=true;
        $.cutTools.polygon.fillCutArea(_self);
    };
    $.cutTools.polygon.mouseMove=function (e) {
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if($.cutTools.cutStatus.isMouseDown){
            if(_self.css("cursor")=="move"){//移动选区
                $.cutTools.polygon.moveBy(locationToCanvas);

                $.cutTools.polygon.fillCutArea(_self);
            }
        }else{
            if($.cutTools.cutStatus.done){
                contextD.save();
                contextD.beginPath();
                $.cutTools.polygon.buildPath();
                contextD.closePath();
                if(contextD.isPointInPath(locationToCanvas.x,locationToCanvas.y)){
                    _self.css("cursor","move");
                }else{
                    _self.css("cursor","crosshair");
                }
                contextD.restore();
            }
        }
        if(!$.cutTools.cutStatus.done&&$.cutTools.cutStatus.hasStarted){
            $.cutTools.cutStatus.points.dirtyX=locationToCanvas.x;
            $.cutTools.cutStatus.points.dirtyY=locationToCanvas.y;

            //绘制边
            $.cutTools.polygon.stroke(_self,true);
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
    };
    $.cutTools.polygon.moveBy=function(locationToCanvas){
        var moveByX=locationToCanvas.x-$.cutTools.cutStatus.lastMouseLocationX,
            moveByY=locationToCanvas.y-$.cutTools.cutStatus.lastMouseLocationY;

        var length=$.cutTools.cutStatus.points.length;
        for(var i=0;i<length;i++){
            $.cutTools.cutStatus.points[i][0]+=moveByX;
            $.cutTools.cutStatus.points[i][1]+=moveByY;
        }
    };
    $.cutTools.polygon.stroke=function(Canvas,dirty){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        contextD.beginPath();
        $.cutTools.polygon.buildPath(dirty);
        contextD.strokeStyle=defaults.cutTools.cutAreaBorderColor;
        contextD.stroke();
        contextD.restore();
    };
    $.cutTools.polygon.fillCutArea=function (Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        contextD.globalAlpha=defaults.cutTools.cutAreaOpacity;
        $.cutTools.polygon.buildPath();
        contextD.fillStyle=defaults.cutTools.cutAreaColor;
        contextD.fill();
        contextD.restore();
    };
    $.cutTools.polygon.buildPath=function(dirty){
        contextD.beginPath();
        var length=$.cutTools.cutStatus.points.length;
        for(var i=0;i<length;i++){
            i==length?contextD.moveTo($.cutTools.cutStatus.points[i][0],$.cutTools.cutStatus.points[i][1]):
                contextD.lineTo($.cutTools.cutStatus.points[i][0],$.cutTools.cutStatus.points[i][1]);
        }
        if(dirty){
            contextD.lineTo($.cutTools.cutStatus.points.dirtyX,$.cutTools.cutStatus.points.dirtyY);
        }
    };

    //椭圆裁剪工具
    $.cutTools.ellipse={};
    $.cutTools.ellipse.cutStatus={
        isMouseDown:false,
        lastMouseLocationX:0,
        lastMouseLocationY:0,
        startX:0,
        startY:0,
        x:0,
        y:0,
        a:0,
        b:0,
        done:false
    };
    $.cutTools.ellipse.mouseDown=function(e){
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if(_self.css("cursor")=="move"){//移动选区

        }else{
            if(!$.cutTools.cutStatus.hasStarted){//开始新选区
                $.cutTools.cutStatus=$.extend(true,{},$.cutTools.ellipse.cutStatus);
                $.cutTools.cutStatus.hasStarted=true;
                $.cutTools.cutStatus.startX=locationToCanvas.x;
                $.cutTools.cutStatus.startY=locationToCanvas.y;
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
        $.cutTools.cutStatus.isMouseDown=true;
    };
    $.cutTools.ellipse.mouseUp=function(e){
        var _self=getCanvas(this);
        if(_self.css("cursor")!="move"){//选区过程
            var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
            $.cutTools.ellipse.calcAttr(locationToCanvas);
        }
        $.cutTools.ellipse.fillCutArea(_self);

        $.cutTools.cutStatus.isMouseDown=false;
        $.cutTools.cutStatus.done=true;
        $.cutTools.cutStatus.hasStarted=false;
    };
    $.cutTools.ellipse.mouseMove=function (e) {
        var _self=getCanvas(this);
        var locationToCanvas=getLocationToCanvas(_self,e.clientX,e.clientY);
        if($.cutTools.cutStatus.isMouseDown){
            if(_self.css("cursor")=="move"){//移动选区
                $.cutTools.ellipse.moveBy(locationToCanvas);

                $.cutTools.ellipse.fillCutArea(_self);
            }else{//新建选区
                //椭圆形选区属性确定
                $.cutTools.ellipse.calcAttr(locationToCanvas);

                $.cutTools.ellipse.stroke(_self);
            }
        }else{
            if($.cutTools.cutStatus.done){
                contextD.save();
                $.cutTools.ellipse.buildPath();
                if(contextD.isPointInPath(locationToCanvas.x,locationToCanvas.y)){
                    _self.css("cursor","move");
                }else{
                    _self.css("cursor","crosshair");
                }
                contextD.restore();
            }
        }
        $.cutTools.cutStatus.lastMouseLocationX=locationToCanvas.x;
        $.cutTools.cutStatus.lastMouseLocationY=locationToCanvas.y;
    };
    $.cutTools.ellipse.moveBy=function(locationToCanvas){
        $.cutTools.cutStatus.x+=locationToCanvas.x-$.cutTools.cutStatus.lastMouseLocationX;
        $.cutTools.cutStatus.y+=locationToCanvas.y-$.cutTools.cutStatus.lastMouseLocationY;
    };
    $.cutTools.ellipse.calcAttr=function(locationToCanvas){
        $.cutTools.cutStatus.x=locationToCanvas.x/2+$.cutTools.cutStatus.startX/2;
        $.cutTools.cutStatus.y=locationToCanvas.y/2+$.cutTools.cutStatus.startY/2;
        $.cutTools.cutStatus.a=Math.abs(locationToCanvas.x/2-$.cutTools.cutStatus.startX/2);
        $.cutTools.cutStatus.b=Math.abs(locationToCanvas.y/2-$.cutTools.cutStatus.startY/2);
    };
    $.cutTools.ellipse.fillCutArea=function (Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        contextD.globalAlpha=defaults.cutTools.cutAreaOpacity;
        $.cutTools.ellipse.buildPath();
        contextD.fillStyle=defaults.cutTools.cutAreaColor;
        contextD.fill();
        contextD.restore();
    };
    $.cutTools.ellipse.stroke=function(Canvas){
        contextD.clearRect(0,0,defaults.canvasWidth,defaults.canvasHeight);
        drawBackground(contextD);
        drawImage(canvasM,Canvas.status.lastImageLocationX,Canvas.status.lastImageLocationY,Canvas);
        contextD.save();
        $.cutTools.ellipse.buildPath();
        contextD.lineWidth=1;
        contextD.strokeStyle=defaults.cutTools.cutAreaBorderColor;
        contextD.stroke();
        contextD.restore();
    };
    $.cutTools.ellipse.buildPath=function(){
        var r=$.cutTools.cutStatus.a>$.cutTools.cutStatus.b?$.cutTools.cutStatus.a:$.cutTools.cutStatus.b;
        var ratioX=$.cutTools.cutStatus.a/r,
            ratioY=$.cutTools.cutStatus.b/r;
        contextD.scale(ratioX,ratioY);
        contextD.beginPath();
        contextD.arc($.cutTools.cutStatus.x/ratioX,$.cutTools.cutStatus.y/ratioY,r,0,Math.PI*2);


    };

    //裁剪工具创建
    $.cutTools.create=function(tool){
        $("#"+tool).on("click",function(){
            $.cutTools.cutStatus=$.extend(true,{},$.cutTools[tool].cutStatus);//!!!深拷贝
            DestinationCanvas
                .css("cursor","crosshair")
                .unbind(".drag")
                .unbind(".cut") //解绑!!!!!
                .on("mousedown.cut",$.cutTools[tool].mouseDown)
                .on("mouseup.cut",$.cutTools[tool].mouseUp)
                .on("mousemove.cut",$.cutTools[tool].mouseMove);
            if($.cutTools[tool].dbClick){
                DestinationCanvas.on("dblclick",$.cutTools[tool].dbClick);
            }
        });
    };

    $.cutTools.create("rect");
    $.cutTools.create("circle");
    $.cutTools.create("polygon");
    $.cutTools.create("ellipse");


});
/*1.图片border是在MiddleCanvas中画还是在DestinationCanvas中画
 *
 *
 */