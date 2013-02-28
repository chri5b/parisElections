

$(document).ready(function(){

    var selector = $("#electionSelector");
    var cand1Selector = $("#candidate1Selector");
    var cand2Selector = $("#candidate2Selector");
    var map = L.map('map_canvas').setView([48.86,2.3470], 12);
    L.tileLayer('http://{s}.tile.cloudmade.com/d08561533a204a4c8a4c8dceb5d94bc4/997/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(map);

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
    
    var width = 800,
    height = 600;
    
    redraw();

    function redraw() {
        var electionID = parseInt(selector.val());
        var candidateID1 = parseInt(cand1Selector.val());
        var candidateID2 = parseInt(cand2Selector.val());

        //Call the new webservice
        $.ajax({
           url:"/getElectionData",
           data:{
               electionId:electionID,
               candidateA:candidateID1,
               candidateB:candidateID2
           }
        }).success(function(data,textStatus,jqXHR) {
            var resultArray = [];
            resultArray = JSON.parse(data);
            console.log(typeof(resultArray));

                //put results into an object to make looking up an individual item quicker
                resultObj = {};
                resultArray.forEach(function(item,array) {
                    resultObj[item.key] = item.result;
                });

                var maxDifference = d3.max(resultArray.map(function(d) { return d.result.relativeDifference; } ));
                var minDifference = d3.min(resultArray.map(function(d) { return d.result.relativeDifference; } ));
                var maxVoters = d3.max(resultArray.map(function(d) { return d.result.C1Votes + d.result.C2Votes; } ));

                var color = d3.scale.linear().domain([minDifference,0,maxDifference]).range(["#00f","#333","#f00"]);
                var area = d3.scale.linear().domain([0,maxVoters]).range([0,50000]);





                for (var i = 0 ; i < bureaux.length; i++) {

                    var circle = L.circle([bureaux[i].Lat,bureaux[i].Lng], getSize(bureaux[i],resultObj,area), {
                        color: getColor(bureaux[i],resultObj,color),
                        opacity: 0.2,
                        fillColor: getColor(bureaux[i],resultObj,color),
                        fillOpacity: getOpacity(bureaux[i],resultArray),
                        weight: 1
                    }).addTo(map);
                    //plot the bureau

                    function getColor(bureau,resultArray,color) {
                        var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
                        var result = color(resultArray[Arrondissement_BureauNumber].relativeDifference);
                        return result;
                    }

                    function getSize(bureau,resultArray,area) {
                        var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
                        return Math.sqrt(area(resultArray[Arrondissement_BureauNumber].C1Votes + resultArray[Arrondissement_BureauNumber].C2Votes));
                    }

                    function getOpacity(bureau,resultArray) {
                        var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
                        var resultForThisBureauAndElection = resultArray.filter(function(element) {
                            return element.key == Arrondissement_BureauNumber;
                        });
                        return Math.abs(resultForThisBureauAndElection[0].result.relativeDifference);
                    }


                }
            });


        

    }
    
});


