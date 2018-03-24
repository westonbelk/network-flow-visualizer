/* Functions */



function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}




function getIdByIp(ip) {
	return "IP_" + String(ip).replace(/\./g, '_');
}



function getNodeByIp(ip) {
	return svg.select("#" + getIdByIp(ip));
}




function toGraphData(raw_data) {
	var graph_data = {"nodes": [], "links":[]};

	for (let packet of raw_data) {
		if(packet._source.layers.ip == undefined) {continue;}

		let new_link = {"source": packet._source.layers.ip["ip.src"],
			"target": packet._source.layers.ip["ip.dst"],
			"weight": 8};
		
		let found = false;
		for(let link of graph_data.links) {
			if( (new_link.source == link.source && new_link.target == link.target) ||
				(new_link.source == link.target && new_link.target == link.source)) {
				found = true;
				break;
			}
		}

		if(!found) {
			graph_data.links.push(new_link);

			let new_node1 = {"id": new_link.source, "group": 1};
			let new_node2 = {"id": new_link.target, "group": 1};

			found = false;
			for(let node of graph_data.nodes) {
				if(JSON.stringify(new_node1) == JSON.stringify(node)) {
					found = true;
					break;
				}
			}
			if(!found) {
				graph_data.nodes.push(new_node1);
			}

			found = false;
			for(let node of graph_data.nodes) {
				if(JSON.stringify(new_node2) == JSON.stringify(node)) {
					found = true;
					break;
				}
			}
			if(!found) {
				graph_data.nodes.push(new_node2);
			}
		}
	}
	return graph_data;
};





async function initializeGraph(graphData) {
	return new Promise((resolve, reject) => {

		var color = d3.scaleOrdinal(d3.schemeCategory10);

		var repelForce = d3.forceManyBody();
		repelForce.strength = function() {return 100};

		// .strength(-100).distanceMax(200).distanceMin(100);

		var simulation = d3.forceSimulation()
			.force("charge", repelForce)
			.force("link", d3.forceLink()
				.id(function(d) { return d.id; }) // link id
				.distance(500)
				.strength(0.5))
			.force("center", d3.forceCenter(width/2, height/2));

		var link = svg.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(graphData.links)
			.enter().append("line")
				.attr("stroke", "#bbb")
				.attr("stroke-width", function(d) {return Math.sqrt(d.weight);})

		var node = svg.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(graphData.nodes)
			.enter().append("circle")
				.attr("r", 15)
				.attr("id", function(d) { return getIdByIp(d.id);})
				.attr("fill", function(d) {return color(d.group);})
				.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended));

		node.append("title")
			.text(function(d) {return d.id;})

		// Add nodes and links

		simulation
			.nodes(graphData.nodes)
			.on("tick", ticked)
			.on("end", resolve);

		simulation.force("link")
			.links(graphData.links);

		function ticked() {
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}


		function dragstarted(d) {
		  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		  d.fx = d.x;
		  d.fy = d.y;
		}

		function dragged(d) {
		  d.fx = d3.event.x;
		  d.fy = d3.event.y;
		}

		function dragended(d) {
		  if (!d3.event.active) simulation.alphaTarget(0);
		  d.fx = null;
		  d.fy = null;
		}
	});
}



function updatePacketInfo(packet) {
	document.getElementById("ip_src").innerHTML = packet._source.layers.ip["ip.src"];
	document.getElementById("ip_dst").innerHTML = packet._source.layers.ip["ip.dst"];
	document.getElementById("frame_protocols").innerHTML = packet._source.layers.frame["frame.protocols"];
}



async function animatePacket(src_ip, dst_ip, latency) {
	return new Promise((resolve, reject) => {
		var src_node = getNodeByIp(src_ip);
		var dst_node = getNodeByIp(dst_ip);

		var circle = svg.append("circle")
			.attr("id", "sentPacket")
			.attr("fill", "red")
			.attr("r", 5)
			.attr("cx", src_node.attr("cx"))
			.attr("cy", src_node.attr("cy"));

		circle
			.transition()
			.duration(latency)
			.attr("cx", dst_node.attr("cx"))
			.attr("cy", dst_node.attr("cy"))
			.remove()
			.on('end', resolve);
	});
}



function replayPCAP(packets) {
	for(let i = 0, p = Promise.resolve(); i < packets.length; i++) {
		if(packets[i]._source.layers.ip == undefined) {continue;}
		p = p.then( () => {

			let myPromises = []

			updatePacketInfo(packets[i]);

			myPromises.push(animatePacket(
				packets[i]._source.layers.ip["ip.src"],
				packets[i]._source.layers.ip["ip.dst"],
				packets[i]._source.layers.frame["frame.time_delta"]*1000
			));

			return Promise.all(myPromises);
		})
		// .catch( (error) => {
		// 	console.log("Packet " + i + " failed to send.");
		// 	throw error;
		// });
	}
}



/* Initialize canvas and make things go*/

var width = 1000;
var height = 1000;

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height)

d3.json("http://localhost:8080/binary/wannacry.json").then( (jsonData) => {
	initializeGraph(toGraphData(jsonData)).then( () => {
		return replayPCAP(jsonData);
	});
});








