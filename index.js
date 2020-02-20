'use strict';
(function() {
    let data = '';
    let svgContainer = '';
    let scales = {
        margin: 50,
        width: 1000,
        height: 800
    }
    let tinyScales = {
        width: 500,
        height: 500,
        margin: 50
    }
    window.onload = () => {
        svgContainer = d3.select('body')
                        .append('svg')
                        .attr('width', 1400)
                        .attr('height', 800)
        d3.csv('data/gapminder.csv')
            .then((res) => {
                data = res;
                data = data.filter((each) => {return each.fertility != "NA" && each.life_expectancy != "NA"})
                plotScatter(data);
            })
    }
    function plotScatter(data) {
        let numeric_fertility = data.map((each) => parseFloat(each["fertility"]))
        let numeric_expancy = data.map((each) => parseFloat(each["life_expectancy"]))

        let xy_limits = {
            x_min: d3.min(numeric_fertility),
            x_max: d3.max(numeric_fertility),
            y_min: d3.min(numeric_expancy),
            y_max: d3.max(numeric_expancy),
        }
        let helpers = getAxis(xy_limits, "fertility", "life_expectancy", scales, svgContainer);
        svgContainer.append('text')
                    .attr('x', 150)
                    .attr('y', 20)
                    .style('font-size', '20pt')
                    .text("Fertility vs Life Expectancy(1980)");
        svgContainer.append('text')
                    .attr('x', 770.5)
                    .attr('y', 790)
                    .style('font-size', '20pt')
                    .text('Fertility');
        svgContainer.append('text')
                    .attr('transform', 'translate(20, 225)rotate(-90)')
                    .style('font-size', '15pt')
                    .text('Life Expectancy');
        plotCircles(helpers)
        let yearSelecter = d3.select("body").append("select")
                              .attr("name", "year")
                              .attr('x', 1000)
                              .attr('y', 100)
                              .attr("class", "year-drop");
        yearSelecter.selectAll("option")
                    .data(["1980"])
                    .enter()
                    .append("option")
                    .text(function(d) {return d})
                    .attr("value", function(d) {return d})
                    .attr("selected", function(d){ return d == 2015; })
        filterCircicles(yearSelecter.node())
        yearSelecter.on("change", function() {
            filterCircicles(this)
        })
    } 
    function filterCircicles(node) {
        let showOthers = node.checked ? "inline" : "none";
        let show = node.checked ? "none" : "inline";
        svgContainer.selectAll(".circles")
                    .data(data)
                    .filter(function (d) {return node.value != d.year})
                    .attr('display', showOthers)
        svgContainer.selectAll(".circles")
                    .data(data)
                    .filter(function (d) {return node.value == d.year})
                    .attr('display', show)
    }

    function getAxis(xy_limits, x_axis, y_axis, scales, container) {
        let x_value = (d) => {return +d[x_axis]};
        let y_value = (d) => {return +d[y_axis]};

        let x_scale = d3.scaleLinear()
                        .range([scales.margin, scales.width - scales.margin])
                        .domain([xy_limits.x_min - 0.5, xy_limits.x_max + 0.5 ])
        let y_scale = d3.scaleLinear()
                        .range([scales.margin, scales.height - scales.margin])
                        .domain([xy_limits.y_max + 5, xy_limits.y_min - 5]);
        
        let x_map = (d) => {return x_scale(x_value(d))}
        let y_map = (d) => {return y_scale(y_value(d))};

        let x_plot = d3.axisBottom().scale(x_scale);
        container.append("g")
            .attr('transform','translate(0, ' + (scales.height - scales.margin) + ')')
            .call(x_plot)
        
        let y_plot = d3.axisLeft().scale(y_scale);
        container.append('g')
            .attr('transform', 'translate(' + scales.margin + ', 0)')
            .call(y_plot)
        
        return {
            x: x_map,
            y: y_map,
            x_scale: x_scale,
            y_scale: y_scale
        }
    }
    function plotCircles(helpers) {
        let populations = data.map((each) => +each["population"]);
        let popHelper = d3.scaleSqrt()
                            .domain([d3.extent(populations)[0], d3.extent(populations)[1]])
                            .range([3, 50])
        let cleanData = data.filter((each) => {
            return each.year == 1960 && each.fertility != "NA" && each.life_expectancy != "NA"
        })
        let toolTip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);
        
        let chart = toolTip.append('svg')
                            .attr('width', tinyScales.width)
                            .attr('height', tinyScales.height)
        svgContainer.selectAll('.dot')
                    .data(data)
                    .enter()
                    .append('circle')
                    .attr('cx', helpers.x)
                    .attr('cy', helpers.y)
                    .attr('r', (d) => popHelper(d["population"]))
                    .attr("stroke", "black")
                    .attr('stroke-width', 2)
                    .attr('fill', 'white')
                    .attr("class", "circles")
                    .on('mouseover', (d) => {
                        chart.selectAll("*").remove()
                        toolTip.transition()
                            .duration(200)
                            .style("opacity", .9);
                            popPlot(d, chart)
                    toolTip.style("left", (d3.event.pageX) + "px")
                           .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", (d) => {
                        toolTip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
                
    }
    function popPlot(d, chart) {
        let countries = data.filter((each) => { return each.country == d.country })
        let parsedPop = countries.map((each) => parseInt(each["population"] / 1000000));
        let years = countries.map((each) => parseInt(each["year"]));

        let newLimits = {
            x_min: d3.min(years),
            x_max: d3.max(years),
            y_min: d3.min(parsedPop),
            y_max: d3.max(parsedPop),
        }
        let popHelpers = getAxis(newLimits, "year", "population", tinyScales, chart)
        chart.append("path")
                .datum(countries)
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x((d) => { return popHelpers.x_scale(d.year) })
                    .y((d) => { return popHelpers.y_scale(d.population / 1000000) }))
        chart.append('text')
                    .attr('x', (tinyScales.width - 2 * tinyScales.margin) / 2 - 150)
                    .attr('y', tinyScales.margin / 2 + 10)
                    .style('font-size', '15pt')
                    .text("Population Over Time For " + d.country);
        chart.append('text')
                .attr('x', (tinyScales.width - 2 * tinyScales.margin) / 2 + 50)
                .attr('y', tinyScales.height - 10)
                .style('font-size', '10pt')
                .text("Year");
            
        chart.append('text')
            .attr('transform', 'translate( 15,' + (tinyScales.height / 2 + 50) + ') rotate(-90)')
            .style('font-size', '10pt')
            .text("Population in Millions");
    }
})();