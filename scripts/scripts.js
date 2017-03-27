/**
 * FINAL project for JS200B
 * HMDA Data Grabber v1.0
 * by James Trimarco
 * Submitted March 26, 2017
 * 
 */

(function ($) {
    "use strict";

    $(document).ready(function () {

        var ui = new UiHelper();
        ui.init(); // Launches a function to complete the user interface.
        console.log("UI is ready!");

/**
 * Initiates the initial loop of ajax queries to the CFPB server,
 * and calls hmdaQuery() when that's done.
 */
        cacheQueries_1();

        $('#search').click(hmdaQuery); // Listens for clicks on the search button.

    });

}(jQuery))

// This function gets into running state by taking care of appending lists in the DOM.
function UiHelper() {
    var that = this;

    this.init = function () {
        this.appendListOptions("statePick", stateList, "code", "name");
        this.appendListOptions("racePick", raceList, "code", "name");
    };

    this.appendListOptions = function (selId, list, val, name) {
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
}
