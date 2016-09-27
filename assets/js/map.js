jQuery(document).ready(function($) {
    var home_url = map_obj.home_url;

    var apiKey = getApiKey($('#map'));
    var projectKey = getProjectKey($('#map'));

    var colorGroups = getColorGroups($('#map'));
    var colorDescriptions = getColorDescriptions($('#map'));

    var items = getItemsFromJqueryArray($('.coordinates'));

    var mymap = createMap('map');

    var specialBase = $('#map').attr('data-basemap');

    addTileLayerToMap(mymap, apiKey, projectKey, specialBase);

    var markerCluster = addPopupsToItems(items, mymap, colorGroups, home_url);

    var customItems = getCustomItems($('.custom-coordinates'));

    var markerCluster = addCustomItemsToMap(customItems, markerCluster, home_url);

    fitToBounds(items, customItems, mymap);

    addLegendToMap(colorDescriptions, mymap, home_url);

    if (isStoryModeEnabled($('#map'))) {
        addStoryModeToMap(items, mymap, markerCluster, customItems);
    }

});

function getApiKey(jqSelector) {
    return jqSelector.data('map_api_key');
}

function getProjectKey(jqSelector) {
    return jqSelector.data('map_project_key');
}

function getColorDescriptions(jqSelector) {
    var colorDescriptions = {};
    if (jqSelector.data('red_legend_desc')) {
        colorDescriptions.red = jqSelector.data('red_legend_desc');
    }
    if (jqSelector.data('blue_legend_desc')) {
        colorDescriptions.blue = jqSelector.data('blue_legend_desc');
    }
    if (jqSelector.data('green_legend_desc')) {
        colorDescriptions.green = jqSelector.data('green_legend_desc');
    }
    if (jqSelector.data('yellow_legend_desc')) {
        colorDescriptions.yellow = jqSelector.data('yellow_legend_desc');
    }
    if (jqSelector.data('orange_legend_desc')) {
        colorDescriptions.orange = jqSelector.data('orange_legend_desc');
    }

    return colorDescriptions;
}

function getColorGroups(jqSelector) {
    var colorGroups = {};
    if (jqSelector.data('red')) {
        colorGroups.red = jqSelector.data('red');
    }
    if (jqSelector.data('blue')) {
        colorGroups.blue = jqSelector.data('blue');
    }
    if (jqSelector.data('green')) {
        colorGroups.green = jqSelector.data('green');
    }
    if (jqSelector.data('yellow')) {
        colorGroups.yellow = jqSelector.data('yellow');
    }
    if (jqSelector.data('orange')) {
        colorGroups.orange = jqSelector.data('orange');
    }

    return colorGroups;
}

function addLegendToMap(colorDescriptions, mymap, home_url) {

    var isLegendRequired = false;
    var legendHtml = '<table style="margin-top: 0px; margin-bottom: 0px">';
    jQuery.each(colorDescriptions, function(key, value) {
        if (value != 'undefined') {
            isLegendRequired = true;
            legendHtml += '<tr><td><img src="'+home_url+'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-'+ key + '-icon.png" style="height:20px"> </td><td>' + value + '</td></tr>';
        }
    });

    if (!isLegendRequired) {
        return;
    }

    var box = L.control.messagebox().addTo(mymap);

    legendHtml += '</table>';

    box.show(legendHtml);
}

function getCordinatesFromString(input) {
    if (!input) {
        return null;
    }
    return [
        input.split(',')[0].trim(),
        input.split(',')[1].trim()
    ];
}

function getItemsFromJqueryArray(jqArray) {
    var items = [];
    jqArray.each(function(index) {
        if (dataExists(jqArray[index])) {
            items.push({
                pid: jQuery(jqArray[index]).data('pid'),
                title: jQuery(jqArray[index]).data('title'),
                coordinates: getCordinatesFromString(jQuery(jqArray[index]).data('coordinates')),
                url: jQuery(jqArray[index]).data('url')
            });
        }
        if (metaDataExists(jqArray[index])) {
            items[index].metadata = jQuery(jqArray[index]).data('metadata');
        }
        if (mediaContentExists(jqArray[index])) {
            items[index].media_content = jQuery(jqArray[index]).data('media-content');
        }
    });

    return items;
}

function dataExists(input) {
    return pidExists(input) && titleExists(input) && coordinatesExists(input) && urlExists(input);
}

function pidExists(input) {
    return (jQuery(input).data('pid')) ? true : false;
}
function titleExists(input) {
    return (jQuery(input).data('title')) ? true : false;
}
function coordinatesExists(input) {
    return (jQuery(input).data('coordinates')) ? true : false;
}
function metaDataExists(input) {
    return (jQuery(input).data('metadata')) ? true : false;
}
function mediaContentExists(input) {
    return (jQuery(input).data('media-content')) ? true : false;
}
function urlExists(input) {
    return (jQuery(input).data('url')) ? true : false;
}

function createMap(mapID) {
    if (!mapID) {
        return null;
    }
    return L.map(mapID);
}

function fitToBounds(items, customItems, map) {
    var bounds = [];
    jQuery.each(items, function(index, item) {
        bounds.push(item.coordinates);
    });
    jQuery.each(customItems, function(index, item) {
        bounds.push(item.coordinates);
    });
    if (map) {
        map.fitBounds(bounds);
    }

    var isSameCoordinates = true;
    for(var i = 1; i < bounds.length; i++)
    {
        if(bounds[i] !== bounds[0]) {
            isSameCoordinates = false;
        }
    }

    if (isSameCoordinates && map) {
        map.setZoom(13);
    }
    return bounds;
}

function addPopupsToItems(items, map, colorGroups, home_url) {
    var markers = L.markerClusterGroup();
    var markerArray = [];

    jQuery.each(items, function(index, item) {

        var icon = L.icon({
            iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon.png',
            iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon-2x.png',
            iconSize: [29, 41],
            iconAnchor: [14, 41],
            popupAnchor: [0, -41],
            shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
            shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
            shadowSize: [41, 41],
            shadowAnchor: [13, 41]
        });

        if (colorGroups.red && colorGroups.red.includes(item.pid)) {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-red-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-red-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (colorGroups.blue && colorGroups.blue.includes(item.pid)) {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (colorGroups.green && colorGroups.green.includes(item.pid)) {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-green-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-green-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (colorGroups.yellow && colorGroups.yellow.includes(item.pid)) {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-yellow-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-yellow-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (colorGroups.orange && colorGroups.orange.includes(item.pid)) {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-orange-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-orange-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        var marker = L.marker(
            new L.LatLng(item.coordinates[0], item.coordinates[1]),
            {
                title: item.title,
                icon: icon
            });
        var url = item.url;
        if (url.indexOf("hdl.handle") > -1){
          url = home_url + 'item/' + item.pid;
        }
        var popupContent = "<a href='" + url + "' target='_blank'>" + item.title + "</a><br/>";

        if (item.metadata) {
            popupContent += item.metadata
        }
        if (item.media_content){
            popupContent = item.media_content + popupContent
        }

        marker.bindPopup(popupContent);
        markers.addLayer(marker);
        markerArray.push(marker)
    });
    map.addLayer(markers);

    return {
        cluster: markers,
        markerArray: markerArray
    };
}

function isStoryModeEnabled(jqSelector) {
    return (jqSelector.data('story') === 'yes');
}

function addStoryModeToMap(drsitems, map, markerCluster, customItems) {
    var items = drsitems.concat(customItems);

    var itemIndex = 0;

    L.easyButton('fa-play', function(btn, map){
        jQuery.each(items, function(key) {
            if (key === itemIndex) {
                map.setView(items[key].coordinates);
                markerCluster.cluster.zoomToShowLayer(markerCluster.markerArray[key], function() {
                    markerCluster.markerArray[key].openPopup();
                });

                itemIndex++;
                if (itemIndex === items.length) {
                    itemIndex = 0;
                }

                return false;
            }
        });
    }, 'Play').addTo(map);

    L.easyButton('fa-arrows-alt', function(btn, map){
        itemIndex = 0;
        fitToBounds(drsitems, customItems, map);
    }, 'Reset').addTo(map);
}

function addTileLayerToMap(map, apiKey, projectKey, specialBase) {

    var baseLayers = {};
    var overlays = {};

    var openStreetMap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 18
    });
    baseLayers['OpenStreetMap'] = openStreetMap;

    var mapnikLayer = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 18
    });
    baseLayers['Mapnik'] = mapnikLayer;

    if (apiKey !=='' && projectKey !== '') {
        var mapBox = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: projectKey,
            accessToken: apiKey
        });

        baseLayers['Mapbox'] = mapBox;
        mapBox.addTo(map);
    } else {
        openStreetMap.addTo(map);
    }

    if (specialBase != ""){
      var imageUrl = 'http://localhost/~beekerz/mapcrop.png';

      var imageBounds = new L.latLngBounds([
              [42.360890, -71.077749],
              [42.346389, -71.042900]]);

      var options = {opacity: .8};

      var customOverlay = L.imageOverlay(imageUrl,imageBounds,options);
      overlays['Historical'] = customOverlay;
      customOverlay.addTo(map);
    }

    L.control.layers(baseLayers,overlays).addTo(map);
}

function getCustomItems(jqArray) {
    var items = [];
    jqArray.each(function(index) {
        items.push({
            url: jQuery(jqArray[index]).data('url'),
            title: jQuery(jqArray[index]).data('title'),
            coordinates: getCordinatesFromString(jQuery(jqArray[index]).data('coordinates')),
            description: jQuery(jqArray[index]).data('description'),
            colorgroup: jQuery(jqArray[index]).data('colorgroup')
        });
    });

    return items;
}

function addCustomItemsToMap(items, markerCluster, home_url) {

    jQuery.each(items, function(index, item) {

        var icon = L.icon({
            iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon.png',
            iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon-2x.png',
            iconSize: [29, 41],
            iconAnchor: [14, 41],
            popupAnchor: [0, -41],
            shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
            shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
            shadowSize: [41, 41],
            shadowAnchor: [13, 41]
        });

        if (item.colorgroup === 'red') {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-red-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-red-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (item.colorgroup === 'blue') {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-blue-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (item.colorgroup === 'green') {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-green-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-green-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (item.colorgroup === 'yellow') {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-yellow-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-yellow-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        if (item.colorgroup === 'orange') {
            icon = L.icon({
                iconUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-orange-icon.png',
                iconRetinalUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-orange-icon-2x.png',
                iconSize: [29, 41],
                iconAnchor: [14, 41],
                popupAnchor: [0, -41],
                shadowUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowRetinaUrl: home_url + 'wp-content/plugins/drs-tk/assets/js/leaflet/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [13, 41]
            });
        }

        var marker = L.marker(
            new L.LatLng(item.coordinates[0], item.coordinates[1]),
            {
                title: item.title,
                icon: icon
            });
        var url = item.url;
        if (url.indexOf('http') == -1) {
            url = "http://" + item.url;
        }
        var popupContent = "<a href='" + url + "' target='_blank'>" + item.title + "</a><br/>";

        popupContent += item.description;

        marker.bindPopup(popupContent);
        markerCluster.cluster.addLayer(marker);
        markerCluster.markerArray.push(marker);
    });

    return markerCluster;
}
