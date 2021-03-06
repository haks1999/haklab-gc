var CONST = {
    		OBJ:{
    			COPY_SPD: 800
    		},
    		EDEN : {
    			MAX_SIZE : 20,
    			LOC_RATE : 500,
    			MARK_RATE : 600
    		},
    		SUV : {
    			MAX_SIZE : 8,
    			MARK_RATE : 600
    		},
    		OLD : {
    			MAX_SIZE : 40,
    			CMS_SIZE : 30,
    			MARK_RATE : 400,
    			DEL_RATE : 400,
    			MARK_USE_RATE : 700
    		},
    		G1:{
    			LOC_RATE:400,
    			COPY_SPD:1200,
    			MARK_RATE:300,
    			CON_MARK_RATE : 700
    		}
    	};



function edenAllocate(){
	var locNum = 1;
	var allocateFnc = function(allocateObjNum, currentAllocatePos, timeout ){
		var _tf = setTimeout(function(){
			$(".carousel-inner .item.active .eden .object").slice(currentAllocatePos, allocateObjNum + currentAllocatePos).fadeIn("slow").removeClass("empty");            			
		},timeout);
		timeoutList.push(_tf);
	}
	var currentAllocatePos = $(".carousel-inner .item.active .eden .object").not(".empty").length;
	while( currentAllocatePos < CONST.EDEN.MAX_SIZE ){
		var allocateObjNum = getRandomInt(1,3);
		allocateFnc(allocateObjNum, currentAllocatePos,CONST.EDEN.LOC_RATE*locNum++);
		currentAllocatePos += allocateObjNum;
	}
};

function minorGC01(){
	markNotuse("eden", minorGC_allocateEdenToS1);
};

function minorGC02(){
	markNotuse("eden", minorGC_allocateEdenToS2);
	markNotuse("s1", minorGC_allocateS1ToS2);
};

function minorGC03(){
	markNotuse("eden", minorGC_allocateEdenToS1);
	markNotuse("s2", minorGC_allocateS2ToS1);
};

function minorGC04(){
	markNotuse("eden", minorGC_allocateEdenToS2);
	markNotuse("s1", minorGC_allocateS1ToS2Old);
};

function minorGC05(){
	markNotuse("eden", minorGC_allocateEdenToS2);
	markNotuse("s1", minorGC_allocateS1ToS2Old);
};

function fullGC_Serial(){
	markNotuse("old",fullGC_compactAndSweep);
};

function fullGC_CMS(){
	cmsPauseMarking(cmsConcurrentMarking);
};



var timeoutList = [];
function markNotuse(target, callback){
	var maxSize = target == 'eden'?CONST.EDEN.MAX_SIZE:(target=='old'?CONST.OLD.MAX_SIZE:CONST.SUV.MAX_SIZE);
	var markRate = target == 'eden'?CONST.EDEN.MARK_RATE:(target=='old'?CONST.OLD.MARK_RATE:CONST.SUV.MARK_RATE);
	var survivoredObjNum = target=='old'?getRandomInt(10,20):getRandomInt(2,4);
	var survivoredObjPosArr = [];
	var curSurvivoredObjNum = 0;
	while( curSurvivoredObjNum < survivoredObjNum ){
		var randPos = getRandomInt(1,maxSize);
		var dupRandPos = false;
		for( var inx = 0 ; inx < survivoredObjPosArr.length;inx++ ){
			dupRandPos = Number(survivoredObjPosArr[inx]) == randPos; 
		}
		if( !dupRandPos ){
			curSurvivoredObjNum++;
			survivoredObjPosArr.push(randPos);
		}
	}
	
	var markNotUseFnc = function(befSurvivoredObjPos, survivoredObjPos, timeout, callbackFnc, posArr){
		var _tf=setTimeout(function(){
			$(".carousel-inner .item.active ." + target + " .object").slice(befSurvivoredObjPos, survivoredObjPos).addClass("notuse");
			if( callbackFnc ) callbackFnc.call(null, posArr);	
		},timeout);
		timeoutList.push(_tf);
	};
	survivoredObjPosArr.sort(function(a, b){return a-b});
	
	var befSurvivoredObjPos = 0;
	for(var inx = 0 ; inx < survivoredObjPosArr.length ; inx++ ){
		markNotUseFnc(befSurvivoredObjPos, Number(survivoredObjPosArr[inx]-1), markRate*inx);
		$(".carousel-inner .item.active ." + target + " .object:eq(" + (survivoredObjPosArr[inx]-1) + ")").addClass("use");
		befSurvivoredObjPos = Number(survivoredObjPosArr[inx]);
	}
	markNotUseFnc(befSurvivoredObjPos,maxSize,markRate*survivoredObjPosArr.length,callback,survivoredObjPosArr );
};

function cmsPauseMarking(callback){
	var survivoredObjNum = getRandomInt(5,10);
	var survivoredObjPosArr = [];
	var curSurvivoredObjNum = 0;
	while( curSurvivoredObjNum < survivoredObjNum ){
		var randPos = getRandomInt(1,CONST.OLD.CMS_SIZE);
		var dupRandPos = false;
		for( var inx = 0 ; inx < survivoredObjPosArr.length;inx++ ){
			dupRandPos = Number(survivoredObjPosArr[inx]) == randPos; 
		}
		if( !dupRandPos && !$(".carousel-inner .item.active .old .object:eq(" + (randPos-1) + ")").hasClass("markuse") ){
			curSurvivoredObjNum++;
			survivoredObjPosArr.push(randPos);
		}
	}
	
	var markUseFnc = function(survivoredObjPos, timeout){
		var _tf=setTimeout(function(){
			if($(".carousel-inner .item.active .old .object:eq(" + survivoredObjPos + ")").hasClass("markuse")) return;
			$(".carousel-inner .item.active .old .object:eq(" + survivoredObjPos + ")").addClass("markuse").fadeTo('fast', 0.5).fadeTo('fast', 1.0);
		},timeout);
		timeoutList.push(_tf);
	};
	survivoredObjPosArr.sort(function(a, b){return a-b});
	
	for(var inx = 0 ; inx < survivoredObjPosArr.length ; inx++ ){
		markUseFnc(Number(survivoredObjPosArr[inx]-1), CONST.OLD.MARK_USE_RATE*(inx+1));
	}

	var cmsMarkingFnc = function(posArr, timeout, callbackFnc){
		var _tf = setTimeout(function(){
			callbackFnc.call(null, posArr);	
		},timeout);
		timeoutList.push(_tf);
	};
	if( callback ) cmsMarkingFnc(survivoredObjPosArr,CONST.OLD.MARK_USE_RATE*(survivoredObjPosArr.length), callback );
};

function cmsConcurrentMarking(posArr){
	$("#full-gc-cms div.app-state").text("Application is running and [Concurrent Marking] is proceeding.");
	
	edenAllocate();
	
	var instance = jsPlumb.getInstance({
		//Connector:"Bezier",
		Connector:"StateMachine",
		PaintStyle:{ lineWidth:3, strokeStyle:"rgb(68, 85, 102)","dashstyle":"1 1" },
		Endpoint:[ "Dot", { radius:2 } ]
		//EndpointStyle:{ fillStyle:"#ffa500" }
	});
	var cmsMarkingFnc = function(obj, randPos, timeout){
		var _tf=setTimeout(function(){
			$(".carousel-inner .item.active .old .object:eq(" + (randPos-1) + ")").addClass("markuse").fadeTo('fast', 0.5).fadeTo('fast', 1.0);
			instance.connect({
				id:"mytest" + (randPos-1),
				source: $(obj), 
				target:$(".carousel-inner .item.active .old .object:eq(" + (randPos-1) + ")"), 
				anchor:"AutoDefault",
				overlays:[ 
				          [ "PlainArrow", { width:10, length:7,location:1 } ] 
				      ]
			});
		}, timeout );
		
		$("#mytest" + (randPos-1)).fadeOut("slow");
		timeoutList.push(_tf);
	};
	var markUseIdx = 1;
	$(".carousel-inner .item.active .old .object.markuse").each(function(){
		var isDup = true;
		var randPos = 0;
		while(isDup){
			isDup = false;
			randPos = getRandomInt(1,CONST.OLD.CMS_SIZE);
			for( var inx = 0 ; inx < posArr.length ; inx++ ){
				if( posArr[inx] == randPos ) isDup = true;
			}
		}
		if(getRandomInt(1,10) < 3) return;
		cmsMarkingFnc($(this), randPos,CONST.OLD.MARK_USE_RATE*markUseIdx++ );
	});
	
	var _tfClear=setTimeout(function(){
		jsPlumb.reset();
		$("#full-gc-cms svg").remove();
		$("#full-gc-cms div._jsPlumb_endpoint").remove();
	},CONST.OLD.MARK_USE_RATE*markUseIdx++);
	timeoutList.push(_tfClear);
	
	var _tfRemark=setTimeout(function(){
		$("#full-gc-cms div.app-state").text("The Application is stopped for [Remark & Sweeping].");
		cmsPauseMarking(cmsSweeping);
	},CONST.OLD.MARK_USE_RATE*++markUseIdx);
	timeoutList.push(_tfRemark);
};

function cmsSweeping(){
	
	var cmsSweepingFnc = function(obj, timeout){
		var _tf=setTimeout(function(){
			$(obj).addClass("copying").fadeTo("fast" , 0.1, function() {
			    $(this).css("visibility","hidden");
			  });
		}, timeout );
		timeoutList.push(_tf);
	};
	
	var markNotuseIdx = 1;
	$(".carousel-inner .item.active .old .object").not(".markuse").not(".empty").each(function(){
		cmsSweepingFnc($(this), CONST.OLD.DEL_RATE*markNotuseIdx++ );
	});
	var _tfResetDirty=setTimeout(function(){
		$(".carousel-inner .item.active .old .object.markuse").removeClass("markuse");
	},CONST.OLD.DEL_RATE*++markNotuseIdx);
	timeoutList.push(_tfResetDirty);

};

function copyObjects(src, trg, posArr){
	var startingPos = getStartingOffset({target:".carousel-inner .item.active .heap"});
	
	var movingPosToArr = [];
	$(".carousel-inner .item.active ." + trg + " .object.empty:not(.copying)").slice(0, posArr.length).removeClass("empty").addClass("copying _" + src );
	$(".carousel-inner .item.active ." + trg + " .object.copying._" + src).each(function(){
		movingPosToArr.push({left:$(this).offset().left-startingPos.left,top:$(this).offset().top-startingPos.top});
	});

	var movingPosToArrIdx = 0;
	$(".carousel-inner .item.active ." + src + " .object.use").addClass("copying");
	$(".carousel-inner .item.active ." + src + " .object.use").each(function(){
		if(movingPosToArrIdx > movingPosToArr.length - 1) return;
		var position = $(this).offset();
		var copyingObj = $(this).clone();
		$(copyingObj).css("position","absolute").css("left",position.left-startingPos.left).css("top", position.top-startingPos.top).addClass("moving").appendTo($(".carousel-inner .item.active .heap"));
		$(copyingObj).animate({left:movingPosToArr[movingPosToArrIdx].left,top:movingPosToArr[movingPosToArrIdx++].top},CONST.OBJ.COPY_SPD);    		
	});
	var _tf = setTimeout(function(){
		$(".carousel-inner .item.active ." + src + " .object").fadeOut("slow");
	},CONST.OBJ.COPY_SPD);
	timeoutList.push(_tf);
};

function minorGC_allocateEdenToS1(posArr){
	copyObjects("eden", "s1", posArr);
};

function minorGC_allocateEdenToS2(posArr){
	copyObjects("eden", "s2", posArr);
};

function minorGC_allocateS1ToS2(posArr){
	copyObjects("s1", "s2", posArr);
};

function minorGC_allocateS2ToS1(posArr){
	copyObjects("s2", "s1", posArr);
};

function minorGC_allocateS1ToS2Old(posArr){
	if( posArr.length > 1 ){
		copyObjects("s1", "s2", posArr.slice(0,1));
		copyObjects("s1", "old", posArr.slice(1,posArr.length));
	}else{
		copyObjects("s1", "old", posArr);
	}
};

function minorGC_allocateS2ToS1Old(posArr){
	if( posArr.length > 1 ){
		copyObjects("s2", "s1", posArr.slice(0,1));
		copyObjects("s2", "old", posArr.slice(1,posArr.length));
	}else{
		copyObjects("s2", "old", posArr);
	}
};

function fullGC_compactAndSweep(posArr){
	
	var sweepFnc = function(sweepStartPos, sweepEndPos, timeout, del){
		var _tf=setTimeout(function(){
			if(del){
				$(".carousel-inner .item.active .old .object").slice(sweepStartPos,sweepEndPos).fadeOut("slow");
			}else{
				$(".carousel-inner .item.active .old .object").slice(sweepStartPos,sweepEndPos).removeClass("notuse").addClass("copying");
			}
		},timeout);
		timeoutList.push(_tf);
	};
	
	var befPos = 0;
	var posIdx = 0;
	var delTimer = 1;
	$(".carousel-inner .item.active .old .object").each(function(){
		if($(this).hasClass("use")){
			sweepFnc(befPos,posIdx,CONST.OLD.DEL_RATE*delTimer++);
			befPos = posIdx+1;
		}
		posIdx++;
	});
	sweepFnc(befPos,posIdx,CONST.OLD.DEL_RATE*delTimer++);
	
	var befPos = 0;
	var posIdx = 0;
	$(".carousel-inner .item.active .old .object").each(function(){
		if($(this).hasClass("use")){
			sweepFnc(befPos,posIdx,CONST.OLD.DEL_RATE*delTimer++,true);
			befPos = posIdx+1;
		}
		posIdx++;
	});
	sweepFnc(befPos,posIdx,CONST.OLD.DEL_RATE*delTimer++,true);
};

function allocateG1(args){
	var targetElem = args.target?("#"+args.target):".carousel-inner .item.active";
	var targetSpace = args.space?args.space:"eden";
	var density = args.density?args.density:8;
	var allocateFnc = function( allocatePos, timeout ){
		var _tf = setTimeout(function(){
			$(targetElem + " .space .object.empty:eq(" + allocatePos + ")").switchClass("empty",targetSpace,400);
		},timeout);
		timeoutList.push(_tf);
	}
	var allocateLimit = $(targetElem + " .space .object.empty").length;
	var currentPos = 0;
	var timerCnt = 1;
	while( currentPos < allocateLimit ){
		currentPos += getRandomInt(1,density);
		if(args.useTimer){
			allocateFnc(currentPos, CONST.G1.LOC_RATE*timerCnt++);
		}else{
			$(targetElem + " .space .object.empty:eq(" + currentPos + ")").removeClass("empty").addClass(targetSpace);
		}
		
	}
};

function copyObjectsG1(args){
	var startingPos = getStartingOffset({target:".carousel-inner .item.active .cheap"});
	
	var switchObjFnc = function(targetObj, target, timeout){
		var _tf = setTimeout(function(){
			$(targetObj).removeClass("empty " + target).addClass(target);
		},timeout);
		timeoutList.push(_tf);
	}
	
	$(".carousel-inner .item.active .space .object." + args.src).each(function(){
		if( getRandomInt(1,10) > 5 ){
			$(this).switchClass(args.src,"empty",1000);
			return;
		}
		var targetObjIdx = getRandomInt(1,$(".carousel-inner .item.active .space .object.empty").length-1);
		var targetObj = $(".carousel-inner .item.active .space .object.empty:eq(" + targetObjIdx + ")");
		var targetObjOffset = $(targetObj).offset();
		
		var position = $(this).offset();
		var copyingObj = $(this).clone();
		if( $(this).hasClass("empty")) return;
		$(this).addClass("empty").removeClass(args.src);
		$(copyingObj).css("position","absolute").css("left",position.left-startingPos.left).css("top", position.top-startingPos.top).appendTo($(".carousel-inner .item.active .cheap"));
		$(copyingObj).animate({left:targetObjOffset.left-startingPos.left,top:targetObjOffset.top-startingPos.top},CONST.G1.COPY_SPD,function(){
			switchObjFnc($(targetObj), args.trg, 1);
			$(this).fadeOut("fast",function(){
				$(this).remove();
			});
		});    		
	});
};

function initialMarkingG1(){
	copyObjectsG1({src:"survivor",trg:"old"});
	copyObjectsG1({src:"eden",trg:"survivor"});
	
	var markUseFnc = function(targetObj, timeout){
		var _tf=setTimeout(function(){
			$(targetObj).addClass("markuse").fadeTo('fast', 0.8).fadeTo('fast', 1.0);;
		},timeout);
		timeoutList.push(_tf);
	};
	
	var timerIdx = 1;
	$(".carousel-inner .item.active .space .object.old").each(function(){
		if( getRandomInt(1,10) > 3 ){
			return;
		}
		markUseFnc($(this),CONST.G1.MARK_RATE*timerIdx++);
	});
	
	var _tf=setTimeout(function(){
		concurrentMarkingG1();
	},CONST.G1.MARK_RATE*(timerIdx+3));
	timeoutList.push(_tf);
};

function concurrentMarkingG1(){
	$("#full-gc-g1 div.app-state").text("Application is running and [Concurrent Marking] is proceeding.");
	allocateG1({useTimer:true});
	
	var instance = jsPlumb.getInstance({
		Connector:"StateMachine",
		PaintStyle:{ lineWidth:3, strokeStyle:"#eee","dashstyle":"1 1" },
		Endpoint:[ "Dot", { radius:2 } ]
	});
	var conMarkUseFnc = function(srcObj, trgObj, timeout){
		var _tf=setTimeout(function(){
			instance.connect({
				source: $(srcObj), 
				target: $(trgObj),
				anchor:"AutoDefault",
				overlays:[ 
				          [ "PlainArrow", { width:10, length:7,location:1 } ] 
				      ]
			});
			$(trgObj).addClass("markuse").fadeTo('fast', 0.8).fadeTo('fast', 1.0);;
		}, timeout );
		timeoutList.push(_tf);
	};
	var timerIdx = 1;
	var unmarkedOldObjSize = $(".carousel-inner .item.active .space .object.old").not(".markuse").length;
	$(".carousel-inner .item.active .space .object.survivor").each(function(){
		var targetOldObj = $(".carousel-inner .item.active .space .object.old:not(.markuse):eq(" + getRandomInt(1,unmarkedOldObjSize) + ")");
		conMarkUseFnc($(this),$(targetOldObj), CONST.G1.CON_MARK_RATE*timerIdx++);
	});
	
	var _tfClear=setTimeout(function(){
		jsPlumb.reset();
		$("#full-gc-g1 svg").remove();
		$("#full-gc-g1 div._jsPlumb_endpoint").remove();
	},CONST.G1.CON_MARK_RATE*timerIdx++);
	timeoutList.push(_tfClear);
	
	var _tfRemark=setTimeout(function(){
		remarkG1();
	},CONST.G1.CON_MARK_RATE*(timerIdx+2));
	timeoutList.push(_tfRemark);
};

function remarkG1(){
	$("#full-gc-g1 div.app-state").text("The Application is stopped for [Remark]");
	
	var markUseFnc = function(targetObj, timeout){
		var _tf=setTimeout(function(){
			$(targetObj).addClass("markuse").fadeTo('fast', 0.8).fadeTo('fast', 1.0);;
		},timeout);
		timeoutList.push(_tf);
	};
	
	var timerIdx = 1;
	$(".carousel-inner .item.active .space .object.old:not(.markuse)").each(function(){
		if( getRandomInt(1,10) > 2 ){
			return;
		}
		markUseFnc($(this),CONST.G1.MARK_RATE*timerIdx++);
	});
	
	var _tf=setTimeout(function(){
		remarkAndRemoveG1();
	},CONST.G1.MARK_RATE*timerIdx++);
	timeoutList.push(_tf);
};

function remarkAndRemoveG1(){
	var removeFnc = function(targetObj, timeout){
		var _tf=setTimeout(function(){
			$(targetObj).switchClass("old","empty",400);
		},timeout);
		timeoutList.push(_tf);
	};
	
	var timerIdx = 1;
	$(".carousel-inner .item.active .space .object.old:not(.markuse)").each(function(){
		removeFnc($(this),CONST.G1.MARK_RATE*timerIdx++);
	});
	
	var _tf=setTimeout(function(){
		copyAndCleanupObjectsG1();
	},CONST.G1.MARK_RATE*timerIdx++);
	timeoutList.push(_tf);
};

function copyAndCleanupObjectsG1(){
	$("#full-gc-g1 div.app-state").text("The Application is stopped for [Copying/Cleanup]");
	$(".carousel-inner .item.active .space .object.markuse").removeClass("markuse");
	
	var startingPos = getStartingOffset({target:".carousel-inner .item.active .cheap"});
	
	var switchObjFnc = function(targetObj, target, timeout){
		var _tf = setTimeout(function(){
			$(targetObj).removeClass("empty").addClass(target);
		},timeout);
		timeoutList.push(_tf);
	}
	
	var targetObjIdx = -1;
	var cleanupCompact = 10;
	$(".carousel-inner .item.active .space .object.old").each(function(){
		if( getRandomInt(1,10) > 6 ){
			return;
		}
		if( cleanupCompact > 4 ){
			targetObjIdx = getRandomInt(1,$(".carousel-inner .item.active .space .object.empty").length-1);
			cleanupCompact = 0;
		}
		cleanupCompact++;
		
		var targetObj = $(".carousel-inner .item.active .space .object.empty:eq(" + targetObjIdx + ")");
		
		if( $(this).hasClass("empty")) return;
		
		var targetObjOffset = $(targetObj).offset();
		
		var position = $(this).offset();
		var copyingObj = $(this).clone();
		
		$(this).addClass("empty").removeClass("old");
		$(copyingObj).css("position","absolute").css("left",position.left-startingPos.left).css("top", position.top-startingPos.top).addClass("old").appendTo($(".carousel-inner .item.active .cheap"));
		$(copyingObj).animate({left:targetObjOffset.left-startingPos.left,top:targetObjOffset.top-startingPos.top},CONST.G1.COPY_SPD,function(){
			switchObjFnc($(targetObj), "old", 1);
			$(this).fadeOut("fast",function(){
				$(this).remove();
			});
		});    		
	});
	
	copyObjectsG1({src:"survivor",trg:"old"});
	copyObjectsG1({src:"eden",trg:"survivor"});
};

function getStartingOffset(args){
	var _offset = $(args.target).offset();
	return {left:Number(_offset.left)-10, top: Number(_offset.top)+5};
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};