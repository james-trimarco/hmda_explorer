/**
 * HMDA Data Visualizer v1.1
 * by James Trimarco
 * Version 1.0: March 26, 2017
 * Version 1.1: October 25, 2017
 */

appendListOptions = function (selId, list, val, name) {
     var cmbIds = selId.split(/(\s+)/);
     $.each(list, function (key, value) {
         cmbIds.forEach(function (cmbId) {
             var queryOn = "#" + cmbId;
             $(queryOn).append($('<option>', {
                     value: value[val]
                 })
                 .text(value[name]));
         });
     });
 };

(function ($) {
    "use strict";

    $(document).ready(function () {

        // Queries the CFPB and builds an up-to-date list of metro areas.
        metroQuery(buildStateList);

        // Builds the basic user interface.
        var ui = new UiHelper();
        ui.init(); // Launches a function to complete the user interface.

        console.log("UI is ready!");

/**
 * Initiates the initial loop of ajax queries to the CFPB server.
 */
        cacheQueries_1();

        $('#search').click(hmdaQuery); // Listens for clicks on the search button.

    });

}(jQuery))

// This function gets into running state by taking care of appending lists in the DOM.
function UiHelper() {
    var that = this;

    this.init = function () {
        appendListOptions("statePick", stateList, "code", "name");
        appendListOptions("racePick", raceList, "code", "name");
    };

}
