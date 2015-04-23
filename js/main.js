require.config({
	baseUrl:"js/lib",
	paths: {
		"jquery": "jquery-1.11.2.min",
		"jquery-ui":"jquery-ui-1.11.3.min",
		"jsplumb":"jsPlumb/jsplumb",
		"bootstrap":"bootstrap/bootstrap.min",
		"d3":"d3.min",
		"flowchart_item_set":"../flowchart-item-set",
		"kenrobotJsPlumb":"../kenrobotJsPlumb",
		"eventcenter":"../eventcenter"
	},
	shim: {
        'jquery-ui': {
            deps: ['jquery'],
            exports: 'jquery-ui'
        },
        'bootstrap': {
            deps: ['jquery'],
            exports: 'bootstrap'
        }
    }
});

require(['jquery','kenrobotJsPlumb','eventcenter'], function($,kenrobotJsPlumb,eventcenter) {
	//flowchart-container为流程图绘制区域，flowchart-item为即将成为拖拽生成流程图对象的元素，详细参照kenrobotJsPlumb
	kenrobotJsPlumb.init('flowchart-item','flowchart-container');
	var flowchartImg={};
	$("#save_btn").click(function(e){
		flowchartImg=kenrobotJsPlumb.getFlowchartElements();
		kenrobotJsPlumb.clear();
	});

	$("#draw_btn").click(function(e){
		kenrobotJsPlumb.draw(flowchartImg);
	});
	
	$(".flowchart_input_text").on("change",function(e){
		kenrobotJsPlumb.setSelectedNodeInfo($(this).val());
		$(this).val("");
	});

	eventcenter.bind("kenrobot","jsplumb_element_click",function(args){
		if(args==null || (args['add_info'] && args['add_info'].length==0)){
			$(".flowchart_input_text").val('');
			return false;
		}else{
			$(".flowchart_input_text").val(args['add_info']);
		}
	});
});