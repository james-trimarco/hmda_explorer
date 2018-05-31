// This function doesn't return anything. Its only function is to ping the CFPB and cache API requests.
function cacheQueries_1() {
    //console.log("running cacheQueries_1")

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
                    timeout: 20000
                })
                .done(function (json) {
                    console.log("caching state-level data ... success!");
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

} // End of cacheQueries_1 function

function cacheQueries_metro(key, selectedCities) {
    //console.log("running cacheQueries_metro()")
    selectedCities.shift(); //Removes initial item for "all cities"

    // These variables allow us to dynamically build query URLs.
    let i, j, // Loop variables.
        completedRequests = 0, // This is a counter that keeps track of how many requests have been completed.
                len = (selectedCities.length * raceList.length);

                // Two-dimensional loop, to give every possible permutation of state and race.
                for (i = 0; i < selectedCities.length; i++) {
                    for (j = 0; j < raceList.length; j++) {

                        var hmdaSelector;

                        if (raceList[j].code === 0) {
                            hmdaSelector = '$select=msamd,as_of_year,action_taken,COUNT()&$where=msamd="' + selectedCities[i].msamd + '"&$group=msamd,as_of_year,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
                        } else {
                            hmdaSelector = '$select=msamd,as_of_year,action_taken,applicant_race_1,COUNT()&$where=applicant_race_1=' + raceList[j].code + '+AND+msamd="' + selectedCities[i].msamd + '"&$group=msamd,as_of_year,applicant_race_1,action_taken&$orderBy=as_of_year,action_taken&$offset=0&$format=json';
                        }

                        var hmdaUrl = hmdaStem + hmdaSelector;
                        //console.log(hmdaUrl);

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
                                timeout: 20000
                            })
                            .done(function (json) {
                                console.log("caching metro-level data ... success!");
                                })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                console.log("error=" + errorThrown);
                            })
                            .always(function (json) {
                                completedRequests++; // Here's where we add to the counter.
                                if (completedRequests === len) { // Tests whether all the ajax calls are done.
                                    return; // If we're done, then return
                            }
                        })

                    }

                } // end of for loop




}
