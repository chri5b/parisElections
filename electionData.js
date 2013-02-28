var bureaux = require("./bureaux");
var candidates = require("./candidates");
var elections = require("./elections");
var votes = require("./votes");
var mapreduce = require("./mapreduce");
var url = require("url");

function getElectionData(request,response) {
    console.log("in getElectionData");

    var thisUrl = url.parse(request.url,true);
    var thisQuery = thisUrl.query;
    var electionID = thisQuery.electionId;
    var candidateA = thisQuery.candidateA;
    var candidateB = thisQuery.candidateB;

    console.log(votes.votes[0]);
    var resultArray = mapreduce.mapreduce(votes.votes,mapFunction,reduceFunction);
    console.log(resultArray[0]);

    //put results into an object to make looking up an individual item quicker
    resultObj = {};
    resultArray.forEach(function(item,array) {
        resultObj[item.key] = item.result;
    });

    response.writeHead(200,{"Content-Type":"text/plain"});
    response.write(JSON.stringify(resultArray,null,true));
    response.end();

    return response;

    //console.log(resultObj);

    function mapFunction(item,emit) {
        //Filters out all the unneeded elections and candidates and emits the necessary info with a key for the polling station
        if (item.EId == electionID && (item.CId == candidateA || item.CId == candidateB)) {
            emit(item.A + "_" + item.BdV, item);
        }
    }

    function reduceFunction(key, values, emit) {
        //Collates the two results (one for each candidate) for each polling station into a single record for the polling station.
        var newItem = {};
        for (var i = 0 ; i < values.length ; i++) {
            if (values[i].CId == candidateA) { newItem.C1Votes = values[i].Vs; }
            if (values[i].CId == candidateB) { newItem.C2Votes = values[i].Vs; }
            newItem.BdV = key;
            newItem.V = values[i].V;
        }
        newItem.difference =  newItem.C1Votes - newItem.C2Votes;
        newItem.relativeDifference = newItem.difference/newItem.V;

        emit({key:key, result:newItem });
    }

}

exports.getElectionData = getElectionData;