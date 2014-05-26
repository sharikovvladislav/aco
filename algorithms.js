function aco(settings) {
	var vertexCount = settings.vertexCount;
	var antCount = settings.antCount;
	var graph = settings.graph;
	var start = settings.start;
	var stop = settings.stop;
	var redraw = settings.redraw;
	var pheromone = settings.pheromone;
	var step = settings.step;
	var bestLength = settings.bestLength;
	var bestPath = settings.bestPath;
	
	var pathFound = settings.pathFound || false;
	var bestCycleLength = 10000000;
	var pathString = "";
	
	var alpha = 0.3; // коэф. коллективного интеллекта
	var beta = 0.7; // коэф. личного интеллекта
	var ktau = 0.01; // коэф. испарени¤ феромона
	
	var currentVertex;
	
	console.log('graph: ');
	console.log(JSON.stringify(graph));

	// пам¤ть муравь¤
	var visited = {};
	
	visited.reset = function() {
		for(row in graph) {
			visited[row] = false;
		}
	}
	visited.reset();
	
	var output;
	output = toHtml('<b>НАЧАЛО '+step+' ЦИКЛА ПОИСКА</b>');
	// начало цикла перебора всех муравьев
	var count = 0;
	while(antCount > 0) {
		count += 1;
		currentVertex = start;
		var path = [];
		path.push(currentVertex); // добавим начальную вершину
		// начало цикла одного муравь¤, который проходит по всем вершинам
		// делать или пока не достигнет конца
		while(checkAvailability(currentVertex)) {
		//checkAvailability(currentVertex);
			console.log('current vertex: '+currentVertex);
			var intervals = {};
			intervals.last = 0;
			
			var denom = 0;
			for(col in graph[currentVertex]) {  // этот цикл формирует знаменатель формулы
				var weight = graph[currentVertex][col];
				// условие, что есть путь из текущей в целом цикле в текущую в данном цикле
				// условие, что вершина еще не посещена
				if(weight != 0 && visited[col] != true) {
					var tau = pheromone[currentVertex][col];
					denom = denom + getAttractiveness(tau, weight);
				}
			}
			
			for(col in graph[currentVertex]) { // этот цикл формирует числитель и ищет сам результат формулы
				var weight = graph[currentVertex][col];
				// условие, что есть путь из текущей в целом цикле в текущую в данном цикле
				// условие, что вершина еще не посещена
				if(weight != 0 && visited[col] != true) {
					var tau = pheromone[currentVertex][col];
					var nom = getAttractiveness(tau, weight);
					var probability = nom/denom;
					//console.log('p: '+probability+' last: '+intervals.last);
					intervals[col] = probability+intervals.last;
					intervals.last = probability+intervals.last;
				}
			}
			
			console.log('intervals:');
			console.log(JSON.stringify(intervals));
			
			var rand = Math.random();
			var nextVertex = 0;
			for(vertex in intervals) {
				if (rand < intervals[vertex]) {
					nextVertex = parseInt(vertex,10);
					break;
				}
			}
			console.log('rand: '+rand);
			console.log('next vertex: '+nextVertex);
			visited[currentVertex] = true;
			
			// сделаем найденную вершину текущей
			currentVertex = nextVertex;
			
			// запомним путь муравь¤, добавим вершину в некий массив
			path.push(currentVertex);
			var antPath = path.slice(); // нам понадобитс¤ массив path еще	
	
		
			// проверим не ¤вл¤етс¤ ли концом нова¤ вершина
			if(currentVertex == stop) {
				// муравей нашел целевую вершину
				// расчитаем уровень феромона, увеличим его и т.п.
				
				console.log("path: ");
				console.log(JSON.stringify(path));
				
				
				// дальше считаем длину пути (нужно дл¤ уровн¤ феромона) 104-119
				var pathCopy = path.slice(); // нам понадобитс¤ массив path еще			
				
				console.log("path copy: ");
				console.log(JSON.stringify(pathCopy));
				
				var dest = pathCopy.pop();
				var source;
				var length = 0;
				while(source = pathCopy.pop()) {
					console.log("dest: " + dest + " source: " + source);
					length = length + graph[source][dest];
					
					dest = source;
				}
				
				console.log("length: " + length);
				
				console.log('cell found!!!');
				
				console.log('matrix: ');
				console.log(JSON.stringify(graph));
				
				// определ¤ем прирост феромона 1/Lk(t) формула 2
				var deltaTau = 5/length;
				var dest = path.pop();
				var source;
				while(source = path.pop()) {
					var oldPheromone = pheromone[source][dest];
					var newPheromone = oldPheromone+deltaTau; // обновление феромона формула 3
					
					console.log('pheromone levels: old = '+oldPheromone+' new = ' + newPheromone);
					
					pheromone[source][dest] = newPheromone;
					
					dest = source;
				}
				
				console.log('pheromone level: ');
				console.log(JSON.stringify(pheromone));
				pathFound = true;
				// определим лучшую длину пути на цикле
				
				if(length < bestCycleLength) {
					pathString = ""; // для сохранения пути
					bestCycleLength = length;
					var tmp;
					while(tmp = antPath.shift()) {
						if (pathString != "") {
							pathString += " -> ";
						}
						pathString += ""+tmp;
					}
				}
				
				break; // муравей дошел до цели, а значит выходим из цикла, больше ему ходить нельз¤. 
			}
                       
			// здесь кончаетс¤ цикл одного муравь¤
		}
        
        // испарение феромона
        for(row in pheromone) {
            for(col in pheromone[row]) {
                var oldPheromone = pheromone[row][col];
                var newPheromone = (1-ktau)*oldPheromone; // обновление феромона формула 3
                pheromone[row][col] = newPheromone;
            }
        }

		antCount--;
		visited.reset();
	
		
		console.log('<<<<<<<<<<< ---------- NEXT ANT ----------- >>>>>>>>>>>>> RESETING VISITED');
	}
	
    if(pathFound) {
        var current = start;
        pathString = "";
        var next = "";
        var pathLength = 0;
        do {
            next = getMaxValueFromArray(pheromone[current]);
            if (pathString != "") {
                pathString += " -> ";
            }
            pathLength += graph[current][next]
            pathString += ""+current;
            current = next;
        } while(current != stop);
        if (pathString != "") {
            pathString += " -> ";
        }
        pathString += ""+current;
    }
	// выведем состояние на текущем цикле
	// выведем лучший путь на текущем цикле, если он есть
	
	//console.clear();
	output += toHtml("Уровень феромона после этого цикла поиска: ");
	output += toHtml(buildTable(pheromone));
	if(pathFound) {
		output += toHtml('Путь: '+pathString + '(длина пути: '+pathLength+')');
		console.log('нашли путь из начальной в конечную');
		bestLength = pathLength;
		bestPath = pathString;
	}
	else
	{
		output += toHtml('Путь из начальной вершины в конечную в цикле '+step+' не найден');
	}
	output += toHtml('<b>КОНЕЦ '+step+' ЦИКЛА ПОИСКА</b>');
	
	var results = {
		outputHTML: output,
		pheromone: pheromone, 
		length: bestLength,
		path: bestPath
	}
	return results;
	//checkAvailability(currentVertex);
	// общий цикл
	
	//redraw();
	// g.edges["0"].connection.fg.attr("stroke-width", 10)
	
	function getMaxValueFromArray(array) {
		var min = -1;
		var minVertex = null;
		for(vertex in array) {
			var value = array[vertex];
			if(value > min) {
				min = value;
				minVertex = vertex;
			}
		}
		return minVertex;
	}
    
	function buildTable (matrix) {
		var table = "<table border=1>";
		
		for (row in matrix)
		{
			table += "<tr>";
			table += "<td>&nbsp;</td>";
			for (col in matrix[row])
			{
				table += "<td>"+col+"</td>";
			}
			table += "</tr>";
			break;
		}
		for (row in matrix)
		{	
			
			table += "<tr>";
			table += "<td>"+row+"</td>";
			for (col in matrix[row])
			{	
				var value = matrix[row][col];
				console.log(value);
				var result = round(value);
                result = result < 0.1 ? "0" : result;
				table += "<td>"+result+"</td>";
			}
			table += "<tr>";
		}
		table += "</table>";
		return table;
	}
	
	function round(number){
		var matches=number.toString().match(/\.0*/);
		if(!matches)return number.toString();
		return number.toFixed(matches[0].length-1+2);
	}
	
	function getAttractiveness(tau, weight) {
		attractiveness = Math.pow(tau, alpha) * 1/(Math.pow(weight, beta));
		return attractiveness;
	}
	
	function checkAvailability(row) {
		var sum = 0;
		var result;
		for(vertex in graph[row]) {
			var weight = graph[row][vertex];
			if (weight != 0 && visited[vertex] == false) {
				sum = sum + 1;
			}						
		}
		if(sum != 0) {
			result = true;
		}
		else
		{
			result = false;
		}
		return result;
	}
}

function aStar(settings) {
	var startPoint = settings.start;
	var stopPoint = settings.stop;
	var graph = jQuery.extend(true, {}, settings.graph);
	var count = settings.vertexCount;
	var heuristic = jQuery.extend(true, {}, settings.heuristic);
	
	logMe('settings: ', settings, true);
	
	function Vertex(_link, _g, _h) { // конструктор вершины
		this.link = _link;
		this.g = parseInt(_g,10);
		this.h = parseInt(_h,10);
		this.f = this.g + this.h;
		console.log('f = ');
		console.log(this.f);
	}
	
	var g = 0; // стоимость пути от начала до текущей
	var h = getHeuristic(startPoint, stopPoint); // получаем эвристику
	// рассчитываем эвристическую функцию внутри конструктора Vertex
	
	var startVertex = new Vertex(startPoint, g, h);
	logMe('startVertex: ', startVertex);
	
	var cameFrom = []; var path = [];
	var closedset = []; // массив закрытых вершин —п«
	var openset = []; // массив открытых вершин —пќ
	openset.push(startVertex); // добавл¤ем в —пќ начальную вершину
	
	var output = "<p><b>Начало алгоритма</b></p>";
	console.log('openset');
	console.log(JSON.stringify(openset));
	output += getSetData('СпО после создания и помещения в него начальной вершины (начало работы алгоритма)', openset);
	output += getSetData('СпЗ после создания (начало работы алгоритма)', closedset);
	logMe('<-------------- НАЧАЛО АЛГОРИТМА -------------->');
	
	var current;
	var result; 
	var count=1;
	while(current = openset.shift()) { // п.4, выбрали первую вершину в —пќ и удалили ее из этого списка
		logMe('<-------------- НАЧАЛО ШАГА -------------->');
		console.log('current: ', current, true);
		
		closedset.push(current); // п. 4, поместили вершину, которую вытащили из openset в closedset
		
		output += "<p><b>начало "+count+" шага</b></p>";
		output += "<p>Открытая вершина: "+current.link+"</p>";
		output += getSetData('СпО после удаления из него текущей вершины (после раскрытия вершины)', openset);
		output += getSetData('СпЗ после помещения в него текущей вершины (раскрытой вершины)', closedset);
		
		console.log('openset , после удалени¤ из него вершины и добавлени¤ ее в closedset');
		console.log(JSON.stringify(openset));
		console.log('closedset, после добавлени¤ в него текущей вершины из openset');
		console.log(JSON.stringify(closedset));
		
		if(current.link == stopPoint) { // п. 5, b текуща¤ = b целева¤, выдаем путь и выходим
			// построим путь
			logMe('строим путь');
			logMe('<-------------- КОНЕЦ АЛГОРИТМА, ПУТЬ НАЙДЕН -------------->');
			logMe('cameFrom: ', cameFrom);
			path = getPath(current.link);
			console.log(JSON.stringify(path));
			result = true;
			break;
		}
		
		var neighbor;
		logMe('<-------------- НАЧИНАЕМ ОБРАБОТКУ СОСЕДЕЙ -------------->');
		logMe('graph[current]', graph[current.link], true);	
		output += '<p>Добавление в СпО соседей вершины '+current.link+'...</p>';
		for(neighbor in graph[current.link]) { // переберем всех "соседей" (переберем св¤зи) в строке current.link матрицы graph
			logMe('<-------------- НАЧАЛО ОБРАБОТКИ, СОСЕД '+neighbor+' -------------->');
			if(graph[current.link][neighbor] != 0) {
				if(existsInArray(closedset, neighbor)) { // проверим ¤вл¤етс¤ ли текущий сосед предком текущей вершины. предок текущей вершины будет в closedset
					logMe('переходим на следующего соседа, этот есть в closedset: '+neighbor);
					console.log('closedset: ');
					console.dir(closedset);
					continue;
				}
				logMe('считаем pathLength дл¤ : '+neighbor);
				
				var pathLength = current.g + graph[current.link][neighbor];
				
				logMe('pathlength: ', pathLength);
				logMe('current.g: ', current.g);
				
				var neighborG = getG(neighbor); 
				if((!existsInArray(openset, neighbor)) || (pathLength < neighborG)) { // провер¤ем находитс¤ ли сосед в openset, если нет, то добавим его туда или обновим добавленную вершину на более лучшую
					g = pathLength;
					if (pathLength < neighborG) { // если путь более оптимальный, то обновим вершину
						// обновление вершины в списке openset
						var updateResult = updateG(neighbor, g); // в updateResult результат обновления, true = обновлен, false = ошибка
						cameFrom[neighbor] = current.link; // обновим родителя
						if(updateResult == true) {
							console.log('openset остается таким-же, изменяется g соседа, так как найден более оптимальный путь');
						} else {
							console.log('ОШИБКА ОБНОВЛЕНИЯ! ВЕРШИНА НЕ НАЙДЕНА!');
						}
					}
					else 
					{
						// добавление соседа в openset
						logMe('попали в условие добавлени¤ новой вершины в openset');
						
						h = getHeuristic(neighbor, stopPoint);
						
						var bob = new Vertex(parseInt(neighbor, 10), g, h); // создали новую вершину
						var newLength = openset.push(bob); // поместили ее в openset
						
						cameFrom[neighbor] = current.link; // укажем родителя для данной вершины-соседа, п. 7
						
						console.log('новая длина openset: '+newLength);
						console.log('openset после добавления новой вершины');
						console.log(JSON.stringify(openset));
					}
				}
			}
			else 
			{
				logMe('<-------------- не работаем с соседом '+neighbor+' ибо оне сосед, а хз кто -------------->');
			}
			logMe('<-------------- КОНЕЦ РАБОТЫ С СОСЕДОМ '+neighbor+' -------------->');
		}
		// сортировка openset по возрастанию
		openset.sort(function(a, b) { return a.f-b.f; });
		console.log('openset после сортировки');
		console.log(JSON.stringify(openset));
		
		output += '<p>Сортировка СпО...</p>';
		output += getSetData('СпО после добавления в него вершин/обновления уже добавленных вершин и сортировки СпО', openset);
		output += "<p><b>конец "+count+" шага</b></p>";
		count += 1;
		logMe('<-------------- КОНЕЦ ШАГА -------------->');
	}
	output += "<p><b>Конец алгоритма</b></p>";
	if(result == true) {
		output += "<p><b>Целевая вершина найдена</b></p>";
		var resultPath = "";
		var bob;
		while(bob = path.pop()) {
			if(resultPath != "") {
				resultPath += " -> ";
			}
			resultPath += ""+bob;
		}
		resultPath = "<b>Найденный путь</b>: " + resultPath;
		output += "<p>"+resultPath+"</p>";
	}
	else
	{
		output += "<p><b>Путь из начальной вершины в конечную не найден</b></p>";
	}
	
	function getG(vertex){
		for(i in openset) {
			if(openset[i].link == vertex) {
				return openset[i].g;
			}
		}
	}
	
	function updateG(vertex, g) {
		for(i in openset) {
			if(openset[i].link == vertex) {
				openset[i].g = g;
				openset[i].f = openset[i].g + openset[i].h;
				return true;
			}
		}
		return false;
	}
	
	console.log(output);
	
	var results = {
		outputHTML: output,
		result: result,
		path: resultPath
	}
	
	return results;
	
	function getHeuristic(current, goal) {
		/*
		logMe('getHeuristic function data');
		logMe('vertex: ', current);
		logMe('goal: ', goal);
		logMe('heuristic: ', heuristic);
		*/
		return heuristic[goal][current];
	}
	
	function getPath(current) {
		var way = [];
		do {
			way.push(current);
			current = cameFrom[current];
		} while (current != startPoint);
		way.push(startPoint);
		return way;
	}
	
	function existsInArray(array, vertex) {
		//logMe("вывод array: ", array, true);
		for(i in array) {
			if(array[i].link == vertex) {
				return true;
				
			}
			//logMe(i + " строка в array ", array[i], true);
		}
		return false;
	}
	
	function getSetData(type, array) {
		var data = "<p>"+type+": ";
		var vertexes = "";
		for(i in array) {
			if(vertexes != "") {
				vertexes += ", ";
			}
			vertexes += "<span title='f = "+array[i].f+"'>"+array[i].link+"</span>";
		}
		if(vertexes == "") {
			vertexes = "<b>список пуст</b>";
		}
		data += vertexes + "</p>";
		return data;
	}

}

function toHtml(label) {
	return "<p>"+label+"</p>";
}

function logMe(desc, data = undefined, isObject = false) {
	console.log(desc);
	if(isObject) {
		if(data != undefined) {
			console.dir(data);
		}
	}
	else
	{	
		if(data != undefined) {
			console.log(data);
		}
	}
}