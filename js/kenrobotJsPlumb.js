/**
 * <div id="flowchart_if" data-item="flowchart_if_item" class="flowchart-item flowchart-prismatic">判定</div>
 *	右侧拖拽栏中的id只是用来最后的标志，虽然可以事后识别，但最好还是带上意义，比如if
 *	data-item对象才是重点，对应flowchart-item-set.js中配置的关键字
 *	参数jsPlumb_container所指定的区域是绘制流程图的区域，即id为jsPlumb_container的DIV
 *	需要为jsPlumb_container设定css样式，控制描图区域
 *	需要为jsPlumb_container+"-item"元素指定css样式，控制每个生成的流程元素块的大小
 */
define(["jquery","jsplumb","eventcenter","d3","flowchart_item_set","jquery-ui"],function($,jsPlumb,eventcenter,d3,fis){
	var jsPlumb_container='flowchart-container';
	var jsPlumb_instance=null;
	var jsPlumb_nodes=[];
	var jsPlumb_selected_node=null;

	var data_transfer={};

	/**
	 * 整个处理的入口，需要初始化
	 * @param string strContainer 用来绘制流程图的DIV
	 * @param string itemClass 可以拖拽的元素
	 */
	function init(itemClass,strContainer){
		jsPlumb_container=strContainer;
		if(jsPlumb_container.length==0){
			alert("缺少搭建流程图的位置");
			return false;
		}

		jsPlumb.ready(function(){
		    //Initialize JsPlumb
		    initJsPlumbInstance();
		      
			$('div.'+itemClass).attr('draggable','true').on('dragstart', function(ev){
				initDrag(ev,this);
			}).on('touchstart',function(ev){
				initDrag(ev,this);
			});
			
			$('#'+jsPlumb_container).on('drop', function(ev){
				finishDrag(ev)
			}).on('dragover', function(ev){
				ev.preventDefault();
			});
			
		    jsPlumb.fire("jsFlowLoaded", jsPlumb_instance);
		});
	}

	/**
	 * 为jsPlumb面板增加一个流程元素
	 * @param object param {id:"",data-item:"",text:"",x:"",y:""}的信息集
	 */
	function initNode(param){
		var node = addNode(jsPlumb_container, param);
		jsPlumb_nodes.push(param);
		if(node===false){
			return false;
		}
		addPorts(node);
		jsPlumb_instance.draggable($(node));

		$(node).dblclick(function(ev){
			jsPlumb_instance.remove(this);

			for(var i=0;i<jsPlumb_nodes.length;i++){
				if(jsPlumb_nodes[i]['id']==$(node).attr('id')){
					jsPlumb_nodes.splice(i,1);
				}
			}
		}).click(function(e){
			//为流程元素新增选中激活时间
			var divElement=$("#"+$(node).attr('id'));
			if(divElement.hasClass("flowchart-item-border-show")){
				divElement.removeClass("flowchart-item-border-show");
				jsPlumb_selected_node=null;
				eventcenter.trigger("kenrobot","jsplumb_element_click",null);
			}else{
				$(".flowchart-item-border-show").removeClass("flowchart-item-border-show");
				divElement.addClass("flowchart-item-border-show");
				jsPlumb_selected_node=node;
				for(var i=0;i<jsPlumb_nodes.length;i++){
					if($(jsPlumb_selected_node).attr('id')==jsPlumb_nodes[i]['id']){
						eventcenter.trigger("kenrobot","jsplumb_element_click",jsPlumb_nodes[i]);
						break;
					}
				}
			}
		});
	}

	/**
	 * 新增一个流程元素
	 * @param string parentId 整个流程图绘制版DIV的id
	 * @param object param {id:"",data-item:"",text:"",x:"",y:""}的信息集
	 */
	function addNode(parentId, param) {
		var objSet=fis[param['data-item']];
		var panel = d3.select("#" + parentId);

		if(objSet.unique && $("div[data-item='"+param['data-item']+"']",$("#"+parentId)).length>0){
			alert("指定元素在流程中只能使用一次");
			return false;
		}

	  	panel.append('div')
	  		.style('position','absolute')
	  		.style('top',param['y'])
	  		.style('left',param['x'])
	  		.attr('align','center')
			.attr('id',param['id'])
			.attr('data-item',param['data-item'])
			.classed(objSet.className,true)
			.classed('node',true)
			.classed(jsPlumb_container+'-item',true)
			.text(param['text']);
		return jsPlumb.getSelector('#' + param['id'])[0];
	}

	/**
	 * 根据配置为流程增加endpoint
	 * @param element node 一个流程元素
	 */
	function addPorts(node) {
		//Assume horizental layout
		var arrAnchor=fis[$(node).attr('data-item')].points;
		for(var i=0;i<arrAnchor.length;i++){
			var tmpUuid=node.getAttribute("id") + "_" + arrAnchor[i].position;
			jsPlumb_instance.addEndpoint(node, {
				uuid:tmpUuid,
				paintStyle: { radius:5, fillStyle:arrAnchor[i].color },
				anchor:arrAnchor[i].position,
				maxConnections:-1,
				isSource:arrAnchor[i].source,
				isTarget:arrAnchor[i].target,
			});
		}
	}

	/**
	 * 连接两个endpoint
	 * @param string source_id 起点endpoint的uuid	
	 * @param string target_id 终点endpoint的uuid
	 */
	function connectPortsByUuid(source_id , target_id) {
		jsPlumb_instance.connect({uuids:[source_id, target_id]});
	}

	/**
	 * 连接两个endpoint
	 * @param string/endpoint source 起点	
	 * @param string/endpoint target 终点
	 */
	function connectPortsBySt(source,target){
		jsPlumb_instance.connect({source:source,target:target});
	}

	/**
	 * 初始化整个画板，同时增加双击链接取消链接功能
	 */
	function initJsPlumbInstance(){
		var color = "#E8C870";
		jsPlumb_instance = jsPlumb.getInstance({     
			Connector : [ "Flowchart", { curviness:50 } ],
			DragOptions : { cursor: "pointer", zIndex:2000 },
			PaintStyle : { strokeStyle:color, lineWidth:2 },
			EndpointStyle : { radius:5, fillStyle:color },
			HoverPaintStyle : {strokeStyle:"#7073EB" },
			EndpointHoverStyle : {fillStyle:"#7073EB" },
			ConnectionOverlays : [["Arrow",{ width:10,length:10,location:-5}]],
			Container:jsPlumb_container
	    });
		jsPlumb_instance.bind("dblclick", function(conn, e) {
	    	jsPlumb_instance.detach(conn);
	    });
	}

	/**
	 * 初始化拖拽功能
	 * @param event e 鼠标拖拽实践
	 */
	function initDrag(e){
		try{
			e.originalEvent.dataTransfer.setData('text',e.target.id);
			e.originalEvent.dataTransfer.setData('offsetX',e.originalEvent.offsetX);
			e.originalEvent.dataTransfer.setData('offsetY',e.originalEvent.offsetY);
		}catch(ev){
			data_transfer['text']=e.target.id;
			data_transfer['offsetX']=e.originalEvent.offsetX;
			data_transfer['offsetY']=e.originalEvent.offsetY;
		}
	}

	/**
	 * 完成元素拖拽后的处理
	 * @param event e 鼠标拖拽实践
	 */
	function finishDrag(e){
		if (e.target.className.indexOf('_jsPlumb') >= 0 ) {
			return;
		}
		e.preventDefault();
		//生成流程图元素的样式、位置
		var flowchart_obj_param={};
		var objId="";
		var startOffsetX=0;
		var startOffsetY=0;
		try{
			objId=e.originalEvent.dataTransfer.getData('text');
			startOffsetX=e.originalEvent.dataTransfer.getData('offsetX');
			startOffsetY=e.originalEvent.dataTransfer.getData('offsetY');
		}catch(ev){
			objId=data_transfer['text'];
			startOffsetX=data_transfer['offsetX'];
			startOffsetY=data_transfer['offsetY'];
		}
		flowchart_obj_param['x'] = '' + ( e.originalEvent.offsetX-startOffsetX) + 'px';
		flowchart_obj_param['y'] = '' + ( e.originalEvent.offsetY-startOffsetY) + 'px';

		flowchart_obj_param['id'] = objId+"_"+(new Date().getTime());
		flowchart_obj_param['data-item']= $("#"+objId).attr('data-item');
		flowchart_obj_param['text'] = $("#"+objId).text();

		initNode(flowchart_obj_param);
		
		try{
			e.originalEvent.dataTransfer.clearData();
		}catch(ev){
			data_transfer={};
		}
	}

	/**
	 * 获取整个流程图的链接信息
	 */
	function getConnections(){
		$.each(jsPlumb_instance.getAllConnections(), function(id, connection) {
			console.log(connection);
			// $.each(scopeConnections, function(i, el) {
			// 	locations.push($.extend(el.source.offset(), { nodeId: el.source.data("id") }));
			// 	locations.push($.extend(el.target.offset(), { nodeId: el.target.data("id") }));
			// 	connections.push({ source: el.source.data("id"), target: el.target.data("id") });
			// });
		});
		console.log(JSON.stringify(connections));
	};

	/**
	 * 获取整个流程图信息
	 */
	function getFlowchart(){
		var arrFlowchart=[];
		$.each(jsPlumb_instance.getConnections(),function(id,connection){
			arrFlowchart.push({
				"source":connection.sourceId,
				"target":connection.targetId
			})
		});
		console.log(arrFlowchart);
	}

	/**
	 * 将目前绘制的流程图清除
	 */
	function clear(){
		$.each(jsPlumb_nodes,function(i,o){
			jsPlumb_instance.remove(jsPlumb_instance.getSelector("#"+o['id'])[0]);
		});
		jsPlumb_nodes=[];
	}

	/**
	 * 获取展示中所有的元素，包括流程元素、线，主要用于绘制
	 */
	function getFlowchartElements(){
		var jsPlumb_links=[];
		$.each(jsPlumb_instance.getConnections(),function(id,connection){
			jsPlumb_links.push({
				"source_id":connection.endpoints[0].getUuid(),
				"target_id":connection.endpoints[1].getUuid()
			});
		});
		//更新每个点的实时坐标
		for(var i=0;i<jsPlumb_nodes.length;i++){
			jsPlumb_nodes[i]['x']=""+$("#"+jsPlumb_nodes[i]['id']).position().left+"px";
			jsPlumb_nodes[i]['y']=""+$("#"+jsPlumb_nodes[i]['id']).position().top+"px";
		}
		return {"nodes":jsPlumb_nodes,"links":jsPlumb_links};
	}

	/**
	 * 设置当前选中元素的额外附加信息
	 */
	function setSelectedNodeInfo(jsPlumb_add_info){
		if(jsPlumb_selected_node==null)return false;
		for(var i=0;i<jsPlumb_nodes.length;i++){
			if($(jsPlumb_selected_node).attr('id')==jsPlumb_nodes[i]['id']){
				jsPlumb_nodes[i]['add_info']=jsPlumb_add_info;
			}
		}
	}

	/**
	 * 根据点、线信息绘制流程图
	 * @param object flowchart {"nodes":[],"links":[]}格式数据，可通过getFlowchartElements获取
	 */
	function draw(flowchart){
		if(jsPlumb_nodes.length>0){
			if(confirm("是否覆盖重绘?")){
				clear();
			}else{
				return false;
			}
		}
		$.each(flowchart["nodes"],function(i,o){
			initNode(o);
		});
		$.each(flowchart["links"],function(i,o){
			var sourceId=o["source_id"];
			var targetId=o["target_id"];
			connectPortsByUuid(sourceId, targetId);
		});
	}

	/**
	 * @return function init 初始化流程图绘制工具
	 * @return function getConnections 获取连接信息
	 * @return function getFlowchart 获取流程图信息
	 * @return function getFlowchartElements 获取流程图元素集
	 * @return function clear 清空整个流程图面板
	 * @return function draw 根据给定元素绘制流程图
	 */
	return {
		init:init,
		getConnections:getConnections,
		getFlowchart:getFlowchart,
		getFlowchartElements:getFlowchartElements,
		clear:clear,
		draw:draw,
		setSelectedNodeInfo:setSelectedNodeInfo
	}
});