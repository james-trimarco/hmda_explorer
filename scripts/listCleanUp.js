//This url provides a list of all metropolitan statistical areas in the United States.
var url = 'https://api.consumerfinance.gov:443/data/hmda/slice/hmda_lar.json?$select=msamd,msamd_name&$group=msamd,msamd_name&$orderBy=msamd,msamd_name&$limit=1000&$format=json'

//This function tests whether a value exists within an array
function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

//Clicking the second button on index.html runs function metroQuery()
function metroQuery(callback) {
    console.log("running metroQuery() function") //Just confirming this function runs

    var metroData = $.ajax({
            accept: 'application/json',
            method: "GET",
            datatype: 'json',
            url: url,
            timeout: 5000
        })
        .done(function(json) {
            window.metroList = callback(json.results); // Slightly sketchy to use a global object in this way...
            buildMetroList("AL");
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log("error=" + errorThrown);
            return $.Deferred().resolve(false);
        });
}


/**
 * This function extracts the state names from the CFPB's json object. Then it
 * stores these state names in a "state" property under each metro object. It also
 * builds out the global state_list array, which simplifies the next few steps.
 */

function buildStateList(json) {
    console.log("running buildStateList() function")
    var i;

    for (i = 0; i < json.length; i++) { //json.length is currently 520
        json[i].states = []; //Creates json.states
        if (json[i].msamd_name) { //If the current entry has a named metro, then

            var pieces = json[i].msamd_name.split(' - '); //create an array with two strings
            json[i].msamd_name = pieces[0]; //the names of the metro are the first part
            var stateNames = pieces[1].split(','); //the names of the state are the second.

            for (j = 0; j < stateNames.length; j++) {

                var state = stateNames[j].trim();
                if (state.length === 2) {
                    json[i].states.push(state); // adds the state to the metro object
                }
            }
        } //End of second for loop
    }
    return json;
}

function buildMetroList(val) {
    console.log(val);
    let selectedCities = [];

    for (i = 0; i < metroList.length; i++) {
        if (isInArray(val, metroList[i].states)) {
            selectedCities.push(metroList[i]);
        }
    }
    console.log(selectedCities);

    appendListOptions("metroPick", selectedCities, "msamd", "msamd_name");
    $('#metroPick').css('display', "block");
}
