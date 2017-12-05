/**
 * This variable, hmdaStem, is defined globally because it's needed
 * widely by multiple functions. It's also crucial that different
 * functions use exactly the same version of the stem.
 */
const hmdaStem = 'https://api.consumerfinance.gov:443/data/hmda/slice/hmda_lar.json?';

/**
 * This function, cacheQueries_1, prepares the user experience by generating an ajax query
 * for every combination of variables the user could possibly make. Without
 * this step, some queries will time out, so the publisher of the data suggested
 * I take this approach. It took 7.7 seconds in a recent test, but once it's
 * done the app works well.
 */

function cacheQueries_1() {
    console.log("running cacheQueries")

    // These variables allow us to dynamically build query URLs.
    let i, j, // Loop variables.
        completedRequests = 0, // This is a counter that keeps track of how many requests have been completed.

        /**
         * This variable, len, stores the product of the length of the two lists of choices,
         * and  lets us confirm when all the queries have been completed.
         */
        len = (stateList.length * raceList.length);



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
                    console.log("caching ... success!");
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

} // End of cacheQueries function

/**
 * This function takes user input and mobilizes it to build a correct
 * url for an API query.
 */

function buildHmdaUrl() {
    let stateSelection = $('#statePick').val(),
        raceSelection = $('#racePick').val(),
        metroSelection = $('#metroPick').val(),
        hmdaSelector;

    if (raceSelection === '0' && metroSelection === '0') { //If no race is selected and no metro is selected
        hmdaSelector = '$select=state_abbr,as_of_year,action_taken,COUNT()&$where=state_abbr="' + stateSelection + '"&$group=state_abbr,as_of_year,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
    } else if (raceSelection !== '0' && metroSelection === '0') { //If race is selected but metro is not selected
        hmdaSelector = '$select=state_abbr,as_of_year,action_taken,applicant_race_1,COUNT()&$where=applicant_race_1=' + raceSelection + '+AND+state_abbr="' + stateSelection + '"&$group=state_abbr,as_of_year,applicant_race_1,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
    } else if (raceSelection === '0' && metroSelection !== '0') { //If race is not selected but metro is selected
        hmdaSelector = '$select=msamd,as_of_year,action_taken,COUNT()&$where=msamd="' + metroSelection + '"&$group=msamd,as_of_year,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json'
    } else if (raceSelection !== '0' && metroSelection !== '0') { //If both race and metro are selected
        hmdaSelector = '$select=msamd,as_of_year,action_taken,applicant_race_1,COUNT()&$where=applicant_race_1=' + raceSelection + '+AND+msamd="' + metroSelection + '"&$group=msamd,as_of_year,applicant_race_1,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json'
    }

    let hmdaUrl = hmdaStem + hmdaSelector;
    return hmdaUrl;
}

/**
 * This function makes an ajax call to the CFPB server, and runs
 * the D3.js code needed to visualize it in a chart.
 */

function hmdaQuery() {
    let stateSelection = $('#statePick').val(),
        raceSelection = $('#racePick').val(),
        metroSelection = $('#metroPick').val();

    let hmdaUrl = buildHmdaUrl();

    /**
     * These variables allow us to dynamically build URLs for ajax calls.
     * It's a bit like the looping behavior in cacheQueries_1 ... but
     * in this case we're using user input, rather than looping through
     * all the possible options.
     */

    // I think it's useful to have a record of the search query in the console.


    var hmdaData = $.ajax({
            accept: 'application/json',
            method: "GET",
            datatype: 'json',
            url: hmdaUrl,
            timeout: 30000
        })
        .done(function (json) {
            console.log("User-generated search: success!");
            console.log("Here's the raw data pulled down from the CFPB:");
            console.log(json);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log(hmdaUrl);
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

    //Draws the initial chart, when all queries have been cached.
    hmdaQuery();
}
