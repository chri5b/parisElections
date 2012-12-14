

$(document).ready(function(){
    var selector = $("#electionSelector");
    var cand1Selector = $("#candidate1Selector");
    var cand2Selector = $("#candidate2Selector");

    selector.change(function() {
        var selectedElection = parseInt(this.value);
        cand1Selector.find('option').remove();
        cand2Selector.find('option').remove();
        $.each(candidates, function(index,candidate) {
            if(candidate.ElectionID == selectedElection) {
                cand1Selector.append(
                    $('<option></option>').val(candidate.CandidateID).html(candidate.FirstName + ' ' + candidate.LastName)
                );
                cand2Selector.append(
                    $('<option></option>').val(candidate.CandidateID).html(candidate.FirstName + ' ' + candidate.LastName)
                );
            }
        });   
        $('#candidate1Selector :nth-child(1)').attr('selected', 'selected');
        $('#candidate2Selector :nth-child(2)').attr('selected', 'selected');
        redraw()
    });    
    
    cand1Selector.change(function () {
        redraw();
    });
    
    cand2Selector.change(function () {
        redraw();
    });

    $.each(elections, function(index, election) {
        selector.append(
            $('<option></option>').val(election.ElectionID).html(election.Name + " : Tour " + election.Round)
        );   
    });
    selector.change();
    
    var width = 600,
    height = 500;
    
    redraw();

    function redraw() {
        var electionID = parseInt(selector.val());
        var candidateID1 = parseInt(cand1Selector.val());
        var candidateID2 = parseInt(cand2Selector.val());

        var emptyArray = [];

        var results = mapreduce(votes,mapFunction,reduceFunction);

        function mapFunction(item,emit) {
            if (item.EId == electionID && (item.CId == candidateID1 || item.CId == candidateID2)) {
                emit(item.A + "_" + item.BdV, item);
            }
        }

        function reduceFunction(key, values, emit) {
            var newItem = {};
            for (var i = 0 ; i < values.length ; i++) {
                if (values[i].CId == candidateID1) { newItem.C1Votes = values[i].Vs; }
                if (values[i].CId == candidateID2) { newItem.C2Votes = values[i].Vs; }
                newItem.BdV = key;
                newItem.V = values[i].V;
            }
            newItem.difference =  newItem.C1Votes - newItem.C2Votes;
            newItem.relativeDifference = newItem.difference/newItem.V;
            
            emit({key:key, result:newItem });
        }

        var maxDifference = d3.max(results.map(function(d) { return d.result.relativeDifference; } ));
        var minDifference = d3.min(results.map(function(d) { return d.result.relativeDifference; } ));
        var maxVoters = d3.max(results.map(function(d) { return d.result.V; } ));

        var color = d3.scale.linear().domain([minDifference,0,maxDifference]).range(["red","grey","blue"]);
        var area = d3.scale.linear().domain([0,maxVoters]).range([0,200]);

        var mapOptions = {
            center: new google.maps.LatLng(48.8667617, 2.3327802),
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
                
        var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

        for (var i = 0 ; i < bureaux.length; i++) {
            var populationOptions = {
                center: new google.maps.LatLng(bureaux[i].Lat,bureaux[i].Lng),
                strokeColor:getColor(bureaux[i]),
                strokeOpacity :0.5,
                strokeWeight :1,
                fillColor :getColor(bureaux[i]),
                fillOpacity : 0.3,
                map :map,
                radius: getSize(bureaux[i])
            };
            cityCircle = new google.maps.Circle(populationOptions);
            var listener = google.maps.event.addListener(cityCircle, "mouseover", function () { console.log(bureaux[i]); });
        }

        function getColor(bureau) {
            var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
            var resultForThisBureauAndElection = results.filter(function(element) {
                return element.key == Arrondissement_BureauNumber;
            });
            return color(resultForThisBureauAndElection[0].result.relativeDifference);  
        }

        function getSize(bureau) {
            var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
            var resultForThisBureauAndElection = results.filter(function(element) {
                return element.key == Arrondissement_BureauNumber;
            });
            return area(resultForThisBureauAndElection[0].result.V);
        }

        function getOpacity(bureau) {
            var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
            var resultForThisBureauAndElection = results.filter(function(element) {
                return element.key == Arrondissement_BureauNumber;
            });
            return Math.abs(resultForThisBureauAndElection[0].result.relativeDifference);
        }
    }
    
});


