var width = 600,
    height = 500;

var latlong = [];

var latMax = d3.max(addresses.map(function(d) { return d.lat; } ));
var latMin = d3.min(addresses.map(function(d) { return d.lat; } ));

var longMax = d3.max(addresses.map(function(d) { return d.lng; } ));
var longMin = d3.min(addresses.map(function(d) { return d.lng; } )); 

var latScale = d3.scale.linear().domain([latMin,latMax]).range([0+10,width-10]);
var longScale = d3.scale.linear().domain([longMin,longMax]).range([0+10,height-10]);

var uniqueAddresses = addresses.filter(function(itm,i,a) {
    var firstInstanceOfItem = -1;
    for (var j = 0; j < a.length ; j++) {
        if (a[j].address == itm.address) {
            firstInstanceOfItem = j;
            break;
        }
    }
    return i==firstInstanceOfItem;  
});




for (var i = 0 ; i < uniqueAddresses.length; i++) {
    var item = {};
    item[0] = latScale(uniqueAddresses[i].lat);
    item[1] = longScale(uniqueAddresses[i].lng);
    console.log(i + " : " + item[1]);
    latlong.push(item);
}



console.log(latlong);
console.log(d3.geom.voronoi(latlong));

//Need to work out how to scale it correctly so that everything is not off the scale.


var svg = d3.select("#chart")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "PiYG")
    .on("mousemove", update);

svg.selectAll("path")
    .data(d3.geom.voronoi(latlong))
  .enter().append("path")
    .attr("class", function(d, i) { return i ? "q" + (i % 9) + "-9" : null; })
    .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

svg.selectAll("circle")
    .data(latlong.slice(1))
  .enter().append("circle")
    .attr("transform", function(d) { return "translate(" + d[0] + "," + d[1] + ")"; })
    .attr("r", 2);

function update() {
  latlong[0] = d3.mouse(this);
  svg.selectAll("path")
      .data(d3.geom.voronoi(latlong)
      .map(function(d) { return "M" + d.join("L") + "Z"; }))
      .filter(function(d) { return this.getAttribute("d") != d; })
      .attr("d", function(d) { return d; });
}