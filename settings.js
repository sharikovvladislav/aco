// for dracula's library
var redraw, g, renderer;

// for graph
var vertexCount = 0;
var totalVertex = 0;
var weightArray = {};

// for a*
var heuristicArray = {};
var tmpLoadedArray = [];

// for aco

// vars for both algo's
var startPoint = null;
var stopPoint  = null;

var tmp;
/* only do all this when document has finished loading (needed for RaphaelJS) */
window.onload = function() {
    var width = $(document).width() - 20;
    var height = $(document).height() - 350;
    $('#canvas').css('height', height);
	$('#canvas').css('width', width);
	
    g = new Graph();
		
    /* layout the graph using the Spring layout implementation */
    var layouter = new Graph.Layout.Spring(g);
    
    /* draw the graph using the RaphaelJS draw implementation */
    renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
    
    redraw = function() {
        layouter.layout();
        renderer.draw();
    };
	
    hide = function(id) {
        g.nodes[id].hide();
    };
	
    show = function(id) {
        g.nodes[id].show();
    };
	
	setStartAndStop = function (startFieldId, stopFieldId) {
		var source = $('#'+startFieldId).val();
		var dest = $('#'+stopFieldId).val();
				
		if(dest == source) 
		{
			alert("Нельзя выбрать одинаковые начальную и целевую вершину!");
			return false;
		}
		
		startPoint = parseInt(source, 10);
		stopPoint = parseInt(dest, 10);
		
		for (node in g.nodes)
		{
			g.nodes[node].isStart = false;
			g.nodes[node].isStop = false;
			$(g.nodes[node].shape)[0].attr('fill', '#ccc');
		}
		g.nodes[source].isStart = true;
		$(g.nodes[source].shape)[0].attr('fill', 'green');
			
		g.nodes[dest].isStop = true;
		$(g.nodes[dest].shape)[0].attr('fill', 'red');

		resetAco();
		resetAStar();
		
		updateVertexNames();
		
		redraw();
		
		drawTable();
	}
	
	unsetStartAndStop = function() {
		for (node in g.nodes)
		{
			g.nodes[node].isStart = false;
			g.nodes[node].isStop = false;
			$(g.nodes[node].shape)[0].attr('fill', '#ccc');
		}

		startPoint = null;
		stopPoint = null;
		
		resetAco();
		resetAStar();
		
		updateVertexNames();
		
		redraw();
		
		drawTable();
	}

	updateVertexNames = function() {
		for(i in g.nodes) {
			var node = g.nodes[i];
			var id = node.id;
			if(isEmptyObject(heuristicArray)) {
				node.shape.items["1"].attr("text", id);
			}
			else
			{
				if(stopPoint != null) {
					var heuristicCost = heuristicArray[stopPoint][id];
					node.shape.items["1"].attr("text", id+"("+heuristicCost+")");
				}
			}
			
		}
	}
	
	startAndStopIsSetCheck = function () {
		if(startPoint != null && stopPoint != null) {
			return true;
		}
		else
		{
			return false;
		}
	}
	
	newNode = function() {
		// добавим строку и столбец в матрицу
		addVertex();
	
		// обновим кол-во вершин
		vertexCount = vertexCount + 1;
		totalVertex = totalVertex + 1;
		
		// название вершины соотвествует порядковому номеру, 
		//по нему же будем обращаться
		nodeName = totalVertex;
		
		var settings = {
			isStart: false,
			isStop: false
		};
		
		// добавим вершину
		g.addNode(nodeName, settings);
		redraw();
		
		// добавим в селекты новые вершины
		$("#source,#dest,#deleteNode,#start,#stop, #delSource, #delDest").append( $('<option value="'+nodeName+'">'+nodeName+'</option>'));
			
		// делаем селекты активными, если добавлена вершина
		if(vertexCount > 0)
		{
			$('fieldset#edges, .deleteNode, #settings, #astar, #aco').removeAttr('disabled');
			$('fieldset#edges, .deleteNode, #settings, #astar, #aco').removeAttr('title');
			$('#vertexCountLabel').html("Грузим файл для "+vertexCount+" вершин<br>Размер матрицы должен быть: "+vertexCount+"x"+vertexCount);
		}

		resetHeur();	
		resetAco();
		resetAStar();
		
		updateVertexNames();
		
		drawTable();
	};

	newEdge = function() {
		var source = $('#source').val();
		var dest = $('#dest').val();
		var weight = parseInt($('#weight').val(), 10);
		
		if (source == dest) {
			alert("Нельзя, чтобы начало и конец ребра были одинаковыми");
			return;
		}
		if (weight == "") {
			alert("Введите вес");
			return;
		}
		var reg = /^[1-9][0-9]*$/;
		if(!reg.test(weight)){
			alert("В поле \"Вес\" можно ввести только цифры и значение должно быть больше нуля");
			return;
		}
		if(ifEdgeExist(source, dest) || ifEdgeExist(dest, source)) {
			alert("Такая связь уже есть!");
			return;
		}
		
		var label = settings(weight);
				
		weightArray[source][dest] = weight;
		weightArray[dest][source] = weight;
		
		drawTable();
		resetAco();
		resetAStar();
		
		// если нет, то рисуем
		g.addEdge(source, dest, label);
		redraw();
	}
	
	removeNode = function() {
		var target = $('#deleteNode').val();

		removeNodeAction(target);
	}
	
	function removeNodeAction(target) {
		console.log(g.nodes[target]);
		if(g.nodes[target].isStart == true || g.nodes[target].isStop == true) {
			if(g.nodes[target].isStart == true) {
				// удалим точку старта
				startPoint = null;
			}
			if(g.nodes[target].isStop == true) {
				// удалим точку конечную
				stopPoint = null;
			}
		}	
		
		g.nodes[target].hide();
		g.removeNode(target);
		
		$("#source [value='"+target+"'],#dest [value='"+target+"'],#deleteNode [value='"+target+"'],#start [value='"+target+"'],#stop [value='"+target+"'], #delSource [value='"+target+"'], #delDest [value='"+target+"']"). remove();
		
		vertexCount = vertexCount - 1;
		
		if(vertexCount == 0)
		{
			$('fieldset#edges, .deleteNode, #settings, #astar, #aco').attr('disabled', 'disabled');
			$('fieldset#edges, .deleteNode, #settings, #astar, #aco').attr('title', 'Сначала добавьте вершины!');
			$('#vertexCountLabel').html("");
		}
		else
		{
			$('#vertexCountLabel').html("Грузим файл для "+vertexCount+" вершин<br>Размер матрицы должен быть: "+vertexCount+"x"+vertexCount);
		}
		
		delete weightArray[target];
		for (row in weightArray)
		{
			delete weightArray[row][target];
		}
		
		redraw();
		
		resetAco();
		resetAStar();
		resetHeur();
		
		updateVertexNames();
		
		drawTable();
	}
	
	removeEdge = function() {
		var source = $('#delSource').val();
		var dest = $('#delDest').val();
				
		if (source == dest) {
			alert("Такого пути не может быть. Ошибка!");
			return;
		}
				
		if (weightArray[source][dest] == 0) {
			alert("Нет такого пути!");
			return;
		}
				
		g.removeEdge(source, dest);
		g.removeEdge(dest, source);
		
		redraw();
		
		weightArray[source][dest] = 0;
		weightArray[dest][source] = 0;
		
		drawTable();
		resetAco();
		resetAStar();
		resetHeur();
	}
	
	loadGraph = function() {	
		console.log('вызвали функцию');
		console.dir(weightArray);
		if(confirm('Вы уверены? Все нарисованные вершины будут стерты!')) {
			// очистка	
			console.log('weightArray: ');
			console.dir(weightArray);
			console.log('начали чистку');
			
			for(e in g.nodes) {
				var target = g.nodes[e].id;
				removeNodeAction(target);
			}
			
			console.log('weightArray after clearing: ');
			console.dir(weightArray);
			
			// читаем файл и мочим
			var file = document.getElementById("fileGraph").files[0];
			if (file) {
				var reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = function (evt) {
					var fileContents = evt.target.result;
					var result = fileContents.split(/\r\n/g).map(function(s) { return s.split(' '); });
					console.log('result: ');
					console.log(result);
					for(row in result) {
						newNode();
						console.log(row);
					}

					console.log('totalVertex: '+vertexCount);
					console.log('weightArray after creating new nodes: ');
					console.dir(weightArray);
					
					var i = totalVertex-vertexCount+1, j = totalVertex-vertexCount+1;
					for(row in result) {
						j=totalVertex-vertexCount+1;
						for(col in result[row]) {
							weight = result[row][col];
							
							if(weight != 0) {
								var label = settings(weight);
								
								var allowAdd = true;
								
								for(edge in g.edges) { // проверка нарисовано ли уже такое же ребро
									var edgeSource = g.edges[edge].source.id;
									var edgeTarget = g.edges[edge].target.id;
									if(edgeTarget == i && edgeSource == j) {
										allowAdd = false;
									}
								}
								if(allowAdd == true) {
									g.addEdge(i, j, label);
								}
								weightArray[i][j] = parseInt(weight, 10);
								console.log('source = '+i+' dest ='+j+' weight = '+weight);
							}
							j++;
							
						}
						i++;
					}
					console.log('weight array after all actions:');
					console.dir(weightArray);
					redraw();
			
					drawTable();
				}
				reader.onerror = function (evt) {
					alert("error reading file");
				}
			}	
		}
	}
	
	loadHeur = function() {	
		// читаем файл и мочим
		var file = document.getElementById("fileHeur").files[0];
		if (file) {
			var reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = function (evt) {
				var fileContents = evt.target.result;
				var result = fileContents.split(/\r\n/g).map(function(s) { return s.split(' '); });
				console.log('result: ');
				console.log(result);

				var count = 0;
				for(row in result) {
					for(col in result[row]) {
						count = count + 1;
					}
				}
				
				if (count != vertexCount*vertexCount) {
					alert("Неправильная матрица эвристик!!! Матрица не будет загружена!");
					return false;
				}
				
				// массив эвристик по структуре должен быть такой же как и массив ребер, копируем матрицу реебр
				heuristicArray = jQuery.extend(true, {}, weightArray);
				// сбросим матрицу эвристик
				for(row in heuristicArray) {
					for(col in heuristicArray[row]) {
						heuristicArray[row][col] = 0;
					}
				}
				
				console.log('totalVertex: '+vertexCount);
				console.log('heuristics after copy: ');
				console.log(JSON.stringify(heuristicArray));
				

				
				var i = 0;
				var j = 0;
				for(row in heuristicArray) {
					j = 0;
					for(col in heuristicArray[row]) {
						heuristicArray[row][col] = result[i][j];
						j++;
					}
					i++;
				}
				
				console.log('heur array after adding new bobs');
				console.log(JSON.stringify(heuristicArray));
				
				updateVertexNames();
				drawTable();
			}
			reader.onerror = function (evt) {
				alert("error reading file");
			}
			
		}	
		
	}
	
	resetHeur = function() {
		heuristicArray = {};
	}
	
	// для тестирования
	getInfo = function() {
		var bro;
		f_get('bro.txt', bro);
		console.log(bro);
	}
	
	acoAlgo = function() {
		var ants = parseInt($("#antCount").val(), 10) || null;
		var steps = parseInt($("#stepCount").val(), 10) || null;
		
		if(startPoint == null || stopPoint == null) {
			alert("Установите начало и конец");
			return;
		}
		if(ants == null) {
			alert("Введите кол-во муравьев");
			return;
		}
		if(steps == null) {
			alert("Введите кол-во шагов");
			return;
		}
		
		console.log(ants);
		
		var settings = {
			antCount: ants,
			graph: weightArray,
			start: startPoint,
			stop: stopPoint,
			step: steps,
		};
		
		var results = aco(settings);
		
		console.dir(results);
		
		
		$("#acoResults").html(results.totalResult);
		$("#acoPheroMatrix").html(results.pheromonesMatrix);
	}
	
	resetAco = function () {
		
	}
	
	aStarAlgo = function() {
		if(!startAndStopIsSetCheck()) {
			alert('Не установлены начальная и конечные вершины! Необходимо установить');
			return;
		}
		if(isEmptyObject(heuristicArray)) {
			alert('Матрица эвристик не загружена. Нужно загрузить.');
			return;
		}
		var source = startPoint;//parseInt($('#start').val(), 10);
		var dest = stopPoint;//parseInt($('#stop').val(), 10);
			
		var settings = {
			start: 	source,
			stop: dest,
			graph: weightArray,
			vertexCount: vertexCount,
			heuristic: heuristicArray
		};
		
		
		var result = aStar(settings);
		var output = "";
		if(result.result == true) {
			output += "<p>Оптимальный путь найден!</p>";
			output += "<p>"+result.path+"</p>";
		} 
		else
		{
			output += "<p>Путь не найден!</p>";
		}
		output += "<br><br>Протокол поиска: <br>"+result.outputHTML;
		$("#aStarResults").html(output);
	}
	
	resetAStar = function() {
		$("#aStarResults").html("");
	}
	
	settings = function(label) {
		var label = { 
			label : label,
            "label-style" : {
				"font-size":20,
				"font-color": "red"
            }
        };
		return label;
	};	
	
	addVertex = function() {
		// 1. Upgrade old rows and add 1 new column to each
		for (row in weightArray)
		{	
			weightArray[row][totalVertex+1] = 0;
		}
		
		// 2. Add new row
		weightArray[totalVertex+1] = {};
		
		// 3. Fill this row with zeros
		for (row in weightArray)
		{
			weightArray[totalVertex+1][row] = 0;
		}

	}
	
	ifEdgeExist = function(source, dest) {
		if(weightArray[source][dest] == 0) {
			return false;
		}
		else
		{
			return true;
		}
	}
	
	ifEdgeMirrorExist = function(source, dest) {
		if(weightArray[dest][source] == 0) {
			return false;
		}
		else
		{
			return true;
		}
	}
	
	drawTable = function() {
		drawWeightsTable();
		drawHeuristicTable();
	}
	
	drawWeightsTable = function() {
		$("#matrix").html("");
		if(!isEmptyObject(weightArray)) 
		{
			var table = "<table border=1>";
			
			for (row in weightArray)
			{
				table += "<tr>";
				table += "<td>&nbsp;</td>";
				for (col in weightArray[row])
				{
					table += "<td>"+col+"</td>";
				}
				table += "</tr>";
				break;
			}
			for (row in weightArray)
			{	
				
				table += "<tr>";
				table += "<td>"+row+"</td>";
				for (col in weightArray[row])
				{
					table += "<td>"+weightArray[row][col]+"</td>";
				}
				table += "<tr>";
			}
			table += "</table>";
			$("#matrix").html(table);
		}
		else 
		{
			$("#matrix").html("Вершины еще не добавлены");
		}
	}
	
	drawHeuristicTable = function() {
		$("#heuristic").html("Не задана");
		if(!isEmptyObject(heuristicArray))
		{
			var table = "<table border=1>";
			
			for (row in heuristicArray)
			{
				table += "<tr>";
				table += "<td>&nbsp;</td>";
				for (col in heuristicArray[row])
				{
					table += "<td>"+col+"</td>";
				}
				table += "</tr>";
				break;
			}
			for (row in heuristicArray)
			{	
				
				table += "<tr>";
				table += "<td>"+row+"</td>";
				for (col in heuristicArray[row])
				{
					table += "<td>"+heuristicArray[row][col]+"</td>";
				}
				table += "<tr>";
			}
			table += "</table>";
			$("#heuristic").html(table);
		}
		else 
		{
			$("#heuristic").html("Еще не задана");
		}
	}
	
	// функция для проверки пустой ли объект
	function isEmptyObject(obj) { 
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop))
				return false;
		}

		return true;
	}
	
};

