function buildScatterPlot(filtered, percentApproved) {

    /**
     * This is the way that Mike Bostock, the creator of D3.js, sets up
     * margins and paddings in the examples he's published. The particular
     * values I've chosen help to resolve problems with labels falling partly
     * out of the SVG frame.
     *
     *In future versions, I'd like to find a better solution.
     */

    var margin = {
            top: 0,
            right: 200,
            bottom: 250,
            left: 75
        },

        w = 800 - margin.left - margin.right,
        h = 600 - margin.top - margin.bottom,
        legendRectSize = 18, // This defines the size of the squares in the legend.
        legendSpacing = 4, // This defines the space between the squares in the legend.
        padding = 40, // This is the space between visualized data and the chart axes.
        firstYear = 2007, // This is the first year that the CFPB has data available.
        lastYear = 2017, // Last year that CFPB has data available.
        loanDenialColor = "red",
        loanApprovalColor = "black",
        percentApprovedColor = "steelblue";

    var legendKey = [{
        color: loanApprovalColor,
        name: "Number of loans approved"
    }, {
        color: loanDenialColor,
        name: "Number of loans denied"
    }, {
        color: percentApprovedColor,
        name: "Percentage of loans approved"
    }]

    /**
     * The lines below define three scale functions: one for the x scale, and one each
     * for both y scales. The way this works in D3.js is there's a domain that
     * defines the extent of the data, and a range that defines the extent of the
     * visual space. The scale function translates data into visual information.
     */
    var xScale = d3.scaleLinear()
        .domain([firstYear, lastYear])
        .range([padding, w - padding]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(filtered, function (d) {
            return d.count;
        })])
        .range([h - padding, padding]);

    var yScale2 = d3.scaleLinear()
        .domain([0, 1])
        .range([h - padding, padding]);

    // This defines a function that will draw the blue line that represents
    // the percentage of loans approved.
    var valueline = d3.line()
        .x(function (d) {
            return xScale(d.year);
        })
        .y(function (d) {
            return yScale2(d.percent);
        });

    var svg;

    /**
     * Note the branch in the logic here. If the #chart1 doesn't exist,
     * then we build it from scratch. If it already exists, then we pick
     * up at the else at line 405.
     */
    if (!$('#chart1') || (!($('#chart1').length))) {

        svg = d3.select("#container-1")
            .append("svg") // Adds and formats the svg element.
            .attr("id", "chart1")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .attr("viewBox", "0 0 700 500")
            .attr("perserveAspectRatio", "xMidYMid")
            .attr("padding", "25px")
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.append("path") // Add the valueline path to the DOM.
            .attr("id", "valueLine")
            .attr("fill", "none")
            .attr("stroke", percentApprovedColor)
            .attr("strokewidth", "2px")
            .attr("d", valueline(percentApproved));

        svg.selectAll("circle")
            .data(filtered) // This will bind the data in the filtered object to the circles we're about to create.
            .enter()
            .append("circle") // Here's where the circles are added.
            .attr("cy", function (d) {
                return yScale(d.count); // Their position on the Y axix corresponds to filtered.count.
            })
            .attr("cx", function (d) {
                return xScale(d.as_of_year); // Their position on the X axis corresponds to filtered.as_of_year.
            })
            .attr("fill", function (d) {
                if (d.action_taken === 3)
                    return loanDenialColor;
                if (d.action_taken === 1)
                    return loanApprovalColor;
            })
            .attr("r", 5);

        // Add the x axis (this approach is pulled from Bostock's examples)
        svg.append("g")
            .attr("transform", "translate(0," + h + ")")
            .attr("id", "x-axis")
            .call(d3.axisBottom(xScale)
                .ticks(9)
                .tickFormat(d3.format(".0f")));

        // Add text label for the x axis
        svg.append("text")
            .attr("transform",
                "translate(" + (w / 2) + " ," +
                (h + margin.top + 50) + ")")
            .style("text-anchor", "middle")
            .attr("id", "x-label")
            .text("Year of Loan Application");

        // Add the y axis
        svg.append("g")
            .attr("id", "y-axis")
            .call(d3.axisLeft(yScale)
                .ticks(4)
                .tickFormat(d3.format(".2s")));

        // Add text label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("id", "y1-label")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (h / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of Loans Per Year");

        // Add the second y axis
        svg.append("g")
            .attr("id", "y-axis-2")
            .attr("transform", "translate(" + w + " ,0)")
            .call(d3.axisRight(yScale2)
                .ticks(5)
                .tickFormat(d3.format(".0%")));

        // Add a text label for the second y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("id", "y2-label")
            .attr("y", (w + 60 ))
            .attr("x", 0 - (h / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Percent of Loans Approved");

        // Create the legend
        var legend = svg.selectAll('.legend')
            .attr("y", (w + 60))
            .attr("x", 0 - (h / 2))
            .data(legendKey) // Here we're feeding in data from the legendKey object defined earlier.
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
                var height = legendRectSize + legendSpacing + 10; // This stuff is very hardcodey.
                var offset = height * legendKey.length / 2; // It was challenging to get it to work at all.
                var horz = w - 120; // Good place to improve on next round.
                var vert = i * height - offset + 475;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', (function (d) {
                return d.color; // Here we're taking the color from the legendKey object.
            }))
            .style('stroke', (function (d) {
                return d.color;
            }))

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d) {
                return d.name; // Here we're taking strings from the legendKey object.
            });

    } else { // Here's the branch in the logic. If the chart already exists, we update it here.

        svg = d3.select("#chart1");
        console.log("... updating chart");

        svg.select("#valueLine") // Select the valueline path.
            .transition()
            .duration(500) // Transition will be half a second.
            .attr("d", valueline(percentApproved)); // Here's where we bind new data to the line.

        // Update circles
        svg.selectAll("circle")
            .data(filtered) // Update with new data
            .transition() // Transition from old to new
            .duration(1000) // Length of animation is one second.
            .on("start", function () { // Start animation
                d3.select(this) // 'this' means the current element
                    .attr("r", 3); // Change size
            })
            .delay(function (d, i) {
                return i / filtered.length * 500; // Dynamic delay (i.e. each item delays one at a time)
            })
            .attr("cx", function (d) {
                return xScale(d.as_of_year); // Circle's X
            })
            .attr("cy", function (d) {
                return yScale(d.count); // Circle's Y
            })
            .on("end", function () { // End animation
                d3.select(this) // 'this' means the current element
                    .transition()
                    .duration(500)
                    .attr("r", 5); // Change radius
            });

        // Update the values in the first Y axis
        svg.select("#y-axis")
            .transition()
            .duration(300)
            .call(d3.axisLeft(yScale)
                .ticks(6)
                .tickFormat(d3.format(".2s")));


    }

} //End of buildScatterPlot function
