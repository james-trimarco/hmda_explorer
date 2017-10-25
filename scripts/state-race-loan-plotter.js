/**
 * The functions below do the data analysis and visualization for the app.
 */

/**
 * This variable, hmdaStem, is defined globally because it's needed
 * widely by multiple functions. It's also crucial that different
 * functions use exactly the same version of the stem.
 */
var hmdaStem = 'https://api.consumerfinance.gov:443/data/hmda/slice/hmda_lar.json?';

/**
 * This function, cacheQueries_1, prepares the user experience by generating an ajax query
 * for every combination of variables the user could possibly make. Without
 * this step, some queries will time out, so the publisher of the data suggested
 * I take this approach. It took 7.7 seconds in a recent test, but once it's
 * done the app works well.
 */
function cacheQueries_1() {

    // These variables allow us to dynamically build query URLs.
    var i, j, // Loop variables.
        completedRequests = 0, // This is a counter that keeps track of how many requests have been completed.

        /**
         * This variable, len, stores the product of the length of the two lists of choices,
         * and  lets us confirm when all the queries have been completed.
         */
        len = (stateList.length * raceList.length);

    /**
     * This function makes the loader go away and shows the initial
     * chart instead. It also swaps out the wait text with the ready text.
     * It gets called once completedRequests === len.
     */
    function showPage() {
        $('#loader').css('display', "none");
        $('#container-1').css('display', "block");
        $('.wait').css('display', "none");
        $('.ready').css('display', "block");
    }

    // Two-dimensional loop, to give every possible permutation of state and race.
    for (i = 0; i < stateList.length; i++) {
        for (j = 0; j < raceList.length; j++) {

            var hmdaSelector;

            /**
             * The logic below looks at the race selector. If it says "All races," then the
             * query URL won't pull down any information about race at all. That is, the
             * $select part of the query won't include the field applicant_race_1. I designed
             * it this way because information on race information isn't relevant if the user
             * wants to see all races aggregated together.

             * It would be possible to approach this problem differently, by adding
             * all the races together to produce the same information. That would involve 50
             * fewer ajax calls upfront, which is great. But it would involve making 7 ajax calls
             * and adding the results together every time the user makes a search on "All races."
             * Let me know if you think that would be a better build.
             */
            if (raceList[j].code === 0) {
                hmdaSelector = '$select=state_abbr,as_of_year,action_taken,COUNT()&$where=state_abbr="' + stateList[i].code + '"&$group=state_abbr,as_of_year,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
            } else {
                hmdaSelector = '$select=state_abbr,as_of_year,action_taken,applicant_race_1,COUNT()&$where=applicant_race_1=' + raceList[j].code + '+AND+state_abbr="' + stateList[i].code + '"&$group=state_abbr,as_of_year,applicant_race_1,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
            }

            var hmdaUrl = hmdaStem + hmdaSelector;

            /**
             * Occassionally, I'll see one or two ajax requests come back "canceled."
             * In order to stop this from breaking the whole project, I've put the
             * counting logic that measures whether the loop is finished in .always(),
             * instead of in .done().
             */
            var hmdaData = $.ajax({
                    accept: 'application/json',
                    method: "GET",
                    datatype: 'json',
                    url: hmdaUrl, // Passes the dynamically built URL to the ajax call.
                    timeout: 30000
                })
                .done(function (json) {
                    console.log("success!"); // Not sure if it's standard to log things to the console in a loop.
                    })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log("error=" + errorThrown);
                })
                .always(function (json) {
                    completedRequests++; // Here's where we add to the counter.
                    if (completedRequests === len) { // Tests whether all the ajax calls are done.
                        showPage(); // If we're done, then we launch showPage().
                }
            })

        }

    } // end of for loop

    hmdaQuery(); // This call builds the initial chart that appears when the loop is done.

} // End of cacheQueries function

/**
 * This function makes an ajax call to the CFPB server, and runs
 * the D3.js code needed to visualize it in a chart.
 */
function hmdaQuery(statePick) {

    /**
     * These variables allow us to dynamically build URLs for ajax calls.
     * It's a bit like the looping behavior in cacheQueries_1 ... but
     * in this case we're using user input, rather than looping through
     * all the possible options.
     */
    var stateSelection = $('#statePick').val(),
        raceSelection = $('#racePick').val(),
        hmdaSelector;

    if (raceSelection === '0') {
        hmdaSelector = '$select=state_abbr,as_of_year,action_taken,COUNT()&$where=state_abbr="' + stateSelection + '"&$group=state_abbr,as_of_year,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
    } else {
        hmdaSelector = '$select=state_abbr,as_of_year,action_taken,applicant_race_1,COUNT()&$where=applicant_race_1=' + raceSelection + '+AND+state_abbr="' + stateSelection + '"&$group=state_abbr,as_of_year,applicant_race_1,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
    }

    var hmdaUrl = hmdaStem + hmdaSelector;

    // I think it's useful to have a record of the search query in the console.
    console.log("Preparing to visualize data from " + hmdaUrl);

    var hmdaData = $.ajax({
            accept: 'application/json',
            method: "GET",
            datatype: 'json',
            url: hmdaUrl,
            timeout: 8000
        })
        .done(function (json) {
            console.log("User-generated search: success!");
            console.log("Here's the raw data pulled down from the CFPB:");
            console.log(json);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("error=" + errorThrown);
        })
        .always(function (data) {
            var trends = data.results; // This narrows the data to just the JSON we're interested in.

            var filtered = []; // This array will hold the filter results.

            /**
             * This logic allows us to filter out parts of the data we don't need.
             * The phrase "n.action_taken === 1" means "Give me the loan applications
             * that were approved." 3s are denials. We're filtering out all the other codes,
             * which refer to outcomes other than simple approvals and denials.
             */
            filtered = jQuery.grep(trends, function (n, i) {
                if (raceSelection === '0') { // If race selection is "All races,"
                    if ((n.action_taken === 1) || (n.action_taken === 3)) { // then we just need to fetch approvals and denials.
                        return true;
                    }
                } else {
                    if (((n.action_taken === 1) || (n.action_taken === 3)) && (n.applicant_race_1 === parseInt(raceSelection))) { // Otherwise we need to filter to match the selected race too.
                        return true;
                    } else {
                        return false;
                    }
                }
            });

            console.log("The filtered dataset looks like this: ");
            console.log(filtered);

            /**
             * The array percentApproved stores a percentage of all applications that were approved
             * for each year of data. Building this array allows us to create the blue line
             * that appears in the chart.
             */
            var percentApproved = [];

            /**
             * We increase the index by two in this loop. That lets us skip the denials
             * and look only at approvals. It's a bit hardcodey, could be upgraded in next
             * version.
             */
            for (j = 0; j < filtered.length; j += 2) {
                var percent = (filtered[j].count / (filtered[j].count + filtered[j + 1].count)); // This line divides the number of approved applications by the approvals plus denials, to give a rate.
                var obj = {
                    year: filtered[j].as_of_year,
                    percent: percent
                };
                percentApproved.push(obj);
            }

            console.log("the percentApproved dataset looks like this:");
            console.log(percentApproved);

            /**
             * Last line fires the buildScatterPlot function, and passed all needed data to it.
             */
            buildScatterPlot(filtered, percentApproved);

        });


} // End of hmdaQuery function.


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
        lastYear = 2015, // Last year that CFPB has data available.
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
            .attr("transform", "translate(" + ( w + 50 ) + " ,0)")
            .call(d3.axisRight(yScale2)
                .ticks(5)
                .tickFormat(d3.format(".0%")));

        // Add a text label for the second y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("id", "y2-label")
            .attr("y", (w + 120 ))
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
