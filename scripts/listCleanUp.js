var url = 'https://api.consumerfinance.gov:443/data/hmda/slice/hmda_lar.json?$select=msamd,msamd_name&$group=msamd,msamd_name&$orderBy=msamd,msamd_name&$limit=1000&$format=json'

var metroData = $.ajax({
        accept: 'application/json',
        method: "GET",
        datatype: 'json',
        url: url,
        timeout: 10000
    })
    .done(function (json) {
        console.log("success!");

        var clean = cleanUp(json.results);
        var unitedStatesTemplate = buildStateList(clean);
        var myJson = parseCleanedList(clean, unitedStatesTemplate);
        console.log(JSON.stringify(myJson));
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        console.log("error=" + errorThrown);
    });

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

function cleanUp(json) {
    var i;

    for (i = 0; i < json.length; i++) {
        json[i].states = [];
        if (json[i].msamd_name) {
            var pieces = json[i].msamd_name.split(' - ');
            json[i].msamd_name = pieces[0];
            var stateNames = pieces[1].split(',');

            for (j = 0; j < stateNames.length; j++) {
                var state = stateNames[j].trim();
                if (state.length === 2) {
                    json[i].states.push(state);
                }
            }
        }
    }
    return json;
}

function buildStateList(json) {
    var i,
        j,
        k,
        stateTracker = [], // This is just a counter
        unitedStates = {
            states: []
        }; // Here's the object that will give us a nested array of states with metro areas inside.

    for (i = 0; i < json.length; i++) {
        for (j = 0; j < json[i].states.length; j++) {
            if (!isInArray(json[i].states[j], stateTracker)) {
                stateTracker.push(json[i].states[j]);
            }
        }
    }
    stateTracker.sort();

    for (k = 0; k < stateTracker.length; k++) {
        var obj = {
            state_abbr: stateTracker[k],
            cities: []
        };
        unitedStates.states.push(obj);
    }
    return unitedStates;
}

function parseCleanedList(list, template) {
    var i,
        j,
        k;
    for (i = 0; i < list.length; i++)
        for (j = 0; j < list[i].states.length; j++) {
            var st = list[i].states[j];

            for (k = 0; k < template.states.length; k++) {
            console.log("check");

                if (st === template.states[k].state_abbr) {

                    var obj = {
                        metro_name: list[i].msamd_name,
                        metro_number: list[i].msamd
                    };
                    template.states[k].cities.push(obj);
                }
            }
        }
    return template;
}
