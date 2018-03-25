/* Functions */



function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

		let new_link = {
			"group": "edges",
			"data": {
				"id": packet._source.layers.ip["ip.src"]+packet._source.layers.ip["ip.dst"],
				"source": packet._source.layers.ip["ip.src"],
				"target": packet._source.layers.ip["ip.dst"],
			}
		};
		
		let found = false;
		for(let link of graph_data.links) {
			if( (new_link.data.source == link.data.source && new_link.data.target == link.data.target) ||
				(new_link.data.source == link.data.target && new_link.data.target == link.data.source)) {
				found = true;
				break;
			}
		}

		if(!found) {
			graph_data.links.push(new_link);

			let new_node1 = {"group": "nodes", data: {"id": new_link.data.source}};
			let new_node2 = {"group": "nodes", data: {"id": new_link.data.target}};

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





function initializeGraph(graphData) {
	cy = window.cy = cytoscape({

		container: document.getElementById('cy'), // container to render in

		elements: graphData.nodes.concat(graphData.links),

		layout: {
			name: 'circle'
		},

		style: [
			{
				selector: 'node',
				style: {
					'height': 20,
					'width': 20,
					'background-color': '#e8e406'
				}
			},

			{
				selector: 'edge',
				style: {
					'curve-style': 'haystack',
					'haystack-radius': 0,
					'width': 5,
					'opacity': 0.5,
					'line-color': '#f2f08c'
				}
			}
		],

	});
}



function updatePacketInfo(packet) {
	document.getElementById("ip_src").innerHTML = packet._source.layers.ip["ip.src"];
	document.getElementById("ip_dst").innerHTML = packet._source.layers.ip["ip.dst"];
	document.getElementById("frame_protocols").innerHTML = packet._source.layers.frame["frame.protocols"];
}



async function animatePacket(src_ip, dst_ip, latency) {
	return new Promise((resolve, reject) => {

		let cleanup = function() {
			cy.remove(packet_node);
			resolve();
		}

		let src_node = cy.getElementById(src_ip);
		let dst_node = cy.getElementById(dst_ip);

		let packet_node = cy.add({
			"group": "nodes",
			"data": {"id": "packet" + (new Date).getTime()},
			"position": {x: src_node._private.position.x, y: src_node._private.position.y},
		});
		
		packet_node.animate({
			"position": {x: dst_node._private.position.x, y: dst_node._private.position.y},
			"duration": latency,
			"complete": cleanup
		});
	});
}



async function replayPCAP(packets) {
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
	}
}



/* Initialize canvas and make things go*/

var width = 1000;
var height = 1000;

d3.json("http://localhost:8080/binary/sample3.json").then( (jsonData) => {
	initializeGraph(toGraphData(jsonData));
	replayPCAP(jsonData);
});


