

$(document).ready(function(){
    var infowindow;
    (function () {

      google.maps.Map.prototype.markers = new Array();
        
      google.maps.Map.prototype.addMarker = function(marker) {
        this.markers[this.markers.length] = marker;
      };
        
      google.maps.Map.prototype.getMarkers = function() {
        return this.markers
      };
        
      google.maps.Map.prototype.clearMarkers = function() {
        if(infowindow) {
          infowindow.close();
        }
        
        for(var i=0; i<this.markers.length; i++){
          this.markers[i].setMap(null);
        }
      };
    })();

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
    
    var width = 800,
    height = 600;
    
    redraw();

    function redraw() {
        var electionID = parseInt(selector.val());
        var candidateID1 = parseInt(cand1Selector.val());
        var candidateID2 = parseInt(cand2Selector.val());

        //Call the new webservice


        var maxDifference = d3.max(resultArray.map(function(d) { return d.result.relativeDifference; } ));
        var minDifference = d3.min(resultArray.map(function(d) { return d.result.relativeDifference; } ));
        var maxVoters = d3.max(resultArray.map(function(d) { return d.result.C1Votes + d.result.C2Votes; } ));

        var color = d3.scale.linear().domain([minDifference,0,maxDifference]).range(["blue","grey","red"]);
        var area = d3.scale.linear().domain([0,maxVoters]).range([0,50000]);

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
                strokeOpacity :1,
                strokeWeight :1,
                fillColor :getColor(bureaux[i]),
                fillOpacity : 0.5,
                map :map,
                radius: getSize(bureaux[i])
            };
            cityCircle = new google.maps.Circle(populationOptions);
            var mouseOutListener = google.maps.event.addListener(cityCircle, "mouseout", function (event) {
                map.clearMarkers();
            });
            
            var mouseOverListener = google.maps.event.addListener(cityCircle, "mouseover", function (event) { 
                console.log(event);
                
                var Lat = event.latLng.Ya;
                var Lng = event.latLng.Za;
                
                matchingItem = bureaux.filter(function(item,array) {
                    return (Math.abs((parseFloat(item.Lat) - Lat)) < 0.0005) && Math.abs((parseFloat(item.Lng) - Lng) < 0.0005);
                });
                console.log("number of matches: " + matchingItem.length);
                matchingItem.sort(function(a,b) {
                    var aDeviation = Math.abs((parseFloat(a.Lat) - Lat)) + Math.abs((parseFloat(a.Lng) - Lng));
                    var bDeviation = Math.abs((parseFloat(b.Lat) - Lat)) + Math.abs((parseFloat(b.Lng) - Lng));
                
                    return aDeviation - bDeviation;
                });
                if (matchingItem.length > 0) {
                    var voteData = resultObj[matchingItem[0].ARR_NUM_BUR];
                    var voteDataDescription = "<div>" + $("#candidate1Selector option:selected").text() + " " + voteData.C1Votes + " votes</div><div>" + $("#candidate2Selector option:selected").text() + " " + voteData.C2Votes + " votes</div>";
                    var voteDataLocation = "<div>" + matchingItem[0].NOM_BUREAU + "</div><div>" + matchingItem[0].ADRESSE_COMPLETE + "</div>";
                    
                    map.addMarker(createMarker(matchingItem[0].NOM_BUREAU,event.latLng,voteDataLocation + voteDataDescription));
                }
            });
            
            function createMarker(name, latlng, content) {
                var marker = new google.maps.Marker({position: latlng, map: map, title:name});
                if (infowindow) infowindow.close();
                infowindow = new google.maps.InfoWindow({content: content});
                infowindow.open(map, marker);
                return marker;
            }            
        }


        
        function getColor(bureau) {
            var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
            return color(resultObj[Arrondissement_BureauNumber].relativeDifference);  
        }

        function getSize(bureau) {
            var Arrondissement_BureauNumber = bureau.ARR_NUM_BUR;
            return Math.sqrt(area(resultObj[Arrondissement_BureauNumber].C1Votes + resultObj[Arrondissement_BureauNumber].C2Votes));
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


