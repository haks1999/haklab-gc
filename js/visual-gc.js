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
    			MARK_RATE : 400,
    			DEL_RATE : 400
    		}
    	};



function edenAllocate(){
	var locNum = 1;
	var allocateFnc = function(allocateObjNum, currentAllocatePos, timeout ){
		var _tf = setTimeout(function(){
			$("#eden-allocate .eden .object").slice(currentAllocatePos, allocateObjNum + currentAllocatePos).fadeIn("slow");            			
		},timeout);
		timeoutList.push(_tf);
	}
	var currentAllocatePos = 0;
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
	markNotuse("old",fullGC_compactAndSweep)
};

function fullGC_CMS01(){
	markUse("old",fullGC_initialMark)
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

function markUse(target, callback){
	var maxSize = CONST.OLD.MAX_SIZE;
	var markRate = CONST.OLD.MARK_RATE;
	var survivoredObjNum = getRandomInt(5,10);
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
	console.log(survivoredObjPosArr);
	
	var markUseFnc = function(survivoredObjPos, timeout, callbackFnc){
		var _tf=setTimeout(function(){
			//$(".carousel-inner .item.active ." + target + " .object").slice(befSurvivoredObjPos, survivoredObjPos).addClass("notuse");
			$(".carousel-inner .item.active ." + target + " .object:eq(" + survivoredObjPos + ")").addClass("markuse");
			//if( callbackFnc ) callbackFnc.call(null, posArr);	
		},timeout);
		timeoutList.push(_tf);
	};
	survivoredObjPosArr.sort(function(a, b){return a-b});
	
	for(var inx = 0 ; inx < survivoredObjPosArr.length ; inx++ ){
		markUseFnc(Number(survivoredObjPosArr[inx]-1), markRate*inx);
		//$(".carousel-inner .item.active ." + target + " .object:eq(" + (survivoredObjPosArr[inx]-1) + ")").addClass("use");
		//befSurvivoredObjPos = Number(survivoredObjPosArr[inx]);
	}
	//markUseFnc(maxSize,markRate*survivoredObjPosArr.length,callback,survivoredObjPosArr );
};

function copyObjects(src, trg, posArr){
	var startingPos = getStartingOffset();
	
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

function fullGC_initialMark(posArr){
	return;
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


function getStartingOffset(){
	var _offset = $(".carousel-inner .item.active .heap").offset();
	return {left:Number(_offset.left)-10, top: Number(_offset.top)+5};
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};