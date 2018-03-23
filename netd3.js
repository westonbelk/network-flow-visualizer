function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

var width = 1000;
var height = 1000;

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height)

var redteam = svg.append("circle")
	.attr("fill", "red")
	.attr("r", 50)
	.attr("cx", 50)
	.attr("cy", 50);

var target = svg.append("circle")
	.attr("fill", "blue")
	.attr("r", 50)
	.attr("cx", 400)
	.attr("cy", 500);


var data = d3.range(3).map(function() { 
	return { radius: 5 }
});

var forceCollide = d3.forceCollide(function(d) { return d.radius; })
	.strength(0.8);

function forceX (p) {
	return d3.forceX(p.attr("cx")).strength(s);
}

function forceY (p) {
	return d3.forceX(p.attr("cy")).strength(s);
}

var s = 0.02;

function getCenter(p) {
	return (p.attr("cx"), p.attr("cy"));
}

var simulation = d3.forceSimulation(data)
	.force('x', forceX(redteam))
	.force('y', forceY(redteam))
	.force('center', d3.forceCenter(redteam.attr("cx"), redteam.attr("cy")))
	.force('collide', forceCollide)
	.on('tick', function() {
		svg.selectAll('.node')
			.attr('cx', function(d) { return d.x; })
			.attr('cy', function(d) { return d.y; })
	})

svg.selectAll('.node')
	.data(data)
	.enter()
	.append('circle')
	.classed('node', true)
	.style('opacity', 0.5)
	.attr('r', function(d) { return d.radius; });


d3.select({}).transition().delay(500).duration(1000)
	.tween("center.move", function() {
		var i = d3.interpolateArray([redteam.attr("cx"), redteam.attr("cy")],[target.attr("cx"),target.attr("cy")]);
		return function(t) {
			var c = i(t);
			console.log(i, t, c);
			simulation.force('center', d3.forceCenter(c[0], c[1]));
			simulation.alphaTarget(0.3).restart();
		}
	});