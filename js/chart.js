/**
 * Created by jchaves on 9/2/15.
 */


var width = 960,
    height = 700,
    radius = Math.min(width, height) / 2,
    padding = 5;

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
    .range([0, radius]);

var color = d3.scale.category20c();

var svg = d3.select(".chartviewport").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

var partition = d3.layout.partition()
    .value(function (d) {
        return d.size;
    });

var arc = d3.svg.arc()
    .startAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
    })
    .endAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
    })
    .innerRadius(function (d) {
        return Math.max(0, y(d.y));
    })
    .outerRadius(function (d) {
        return Math.max(0, y(d.y + d.dy));
    });

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
        return "<span style='color:green'>" + d.name + "</span>";
    });

svg.call(tip);

d3.json("data/dmf2.json", function(error, root){
    if (error) throw(error);

    var nodes = partition.nodes(root);

    var path = svg.selectAll("path")
        .data(nodes)
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function (d) {
            return d.new ? "green" : color((d.children ? d : d.parent).name);
        })
        .on("click", click)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    var text = svg.selectAll("text").data(nodes);
    var textEnter = text.enter().append("text")
        .style("fill-opacity", 1)
        .style("fill", function(d) {
            return brightness(d3.rgb(colour(d))) < 125 ? "#eee" : "#000";
        })
        .attr("text-anchor", function(d) {
            return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
        })
        .attr("dy", ".2em")
        .attr("transform", function(d) {
            var multiline = (d.name || "").split(" ").length > 1,
                angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                rotate = angle + (multiline ? -.5 : 0);
            return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
        })
        .on("click", click);
    textEnter.append("tspan")
        .attr("x", 0)
        .text(function(d) { return d.depth ? d.name.split(" ")[0] : ""; });
    textEnter.append("tspan")
        .attr("x", 0)
        .attr("dy", "1em")
        .text(function(d) { return d.depth ? d.name.split(" ")[1] || "" : ""; });

    function click(d) {
        path.transition()
            .duration(750)
            .attrTween("d", arcTween(d));
    }
});


//d3.select(self.frameElement).style("height", height + "px");

// Interpolate the scales!
function arcTween(d) {
    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(y.domain(), [d.y, 1]),
        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
    return function (d, i) {
        return i ? function (t) {
            return arc(d);
        } : function (t) {
            x.domain(xd(t));
            y.domain(yd(t)).range(yr(t));
            return arc(d);
        };
    };
}

// http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
function brightness(rgb) {
    return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
}

function colour(d) {
    if (d.children) {
        // There is a maximum of two children!
        var colours = d.children.map(colour),
            a = d3.hsl(colours[0]),
            b = d3.hsl(colours[1]);
        // L*a*b* might be better here...
        return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
    }
    return d.colour || "#fff";
}