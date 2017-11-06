
// Initial data array for the morris chart
var data = [
 {
    y: new Date().valueOf(),
    a: 0
 },
 {
    y: new Date().valueOf(),
    a: 0
 },
 {
    y: new Date().valueOf(),
    a: 0
 },
 {
    y: new Date().valueOf(),
    a: 0
 },
 {
    y: new Date().valueOf(),
    a: 0
 }
];


var lineGraph = Morris.Line({
 // ID of the element in which to draw the chart.
 element: 'morris-line-chart',
 // Chart data records -- each entry in this array corresponds to a point on
 // the chart.
 data: data,
 // The name of the data record attribute that contains x-values.
 xkey: 'y',
 // A list of names of data record attributes that contain y-values.
 ykeys: ['a'],
 // Labels for the ykeys -- will be displayed when you hover over the
 // chart.
 redraw:true,
 resize:true,
 labels: ['Label']

});



$(document).ready(function() {
      var i = 0,
        j = 0;

        function setData(data) {

          if (data.length != 0)
            data.shift();
        }

        // Socket for the line chart
        var socket = io.connect('http://192.168.43.198:3000');
        socket.on(device_id+"/values", function(dataMsg) {
          i = i+1;
          var temp = new Object();
          temp['y'] = new Date().valueOf();
          temp['a']=dataMsg['value'];
          setData(data);
          data.push(temp);
          lineGraph.setData(data);

        })







        var gauge = new RadialGauge({
          renderTo: 'canvas-id',
          width: 300,
          height: 300,
          units: "kW-h",
          minValue: 0,
          startAngle: 90,
          ticksAngle: 180,
          valueBox: false,
          maxValue: 220,
          majorTicks: [
            "0",
            "20",
            "40",
            "60",
            "80",
            "100",
            "120",
            "140",
            "160",
            "180",
            "200",
            "220"
          ],
          minorTicks: 2,
          strokeTicks: true,
          highlights: [{
            "from": 160,
            "to": 220,
            "color": "rgba(200, 50, 50, .75)"
          }],
          colorPlate: "#ccc",
          borderShadowWidth: 0,
          borders: false,
          needleType: "arrow",
          needleWidth: 2,
          needleCircleSize: 7,
          needleCircleOuter: true,
          needleCircleInner: false,
          animationDuration: 0,
          animationRule: "linear"
        }).draw();


        // Socket for the gauge chart
        var socket1 = io.connect('http://192.168.43.198:3000');
        socket1.on(device_id+"/values", function(dataMsg) {
          if (dataMsg['device_id'] == device_id) {
            gauge.value = dataMsg['value'];
          }
        });


        var gauge2 = new RadialGauge({
          renderTo: 'energy',
          width: 300,
          height: 300,
          units: "",
          minValue: 0,
          startAngle: 90,
          ticksAngle: 180,
          valueBox: false,
          maxValue: 0.01,
          majorTicks: [
            "0",
            "0.001",
            "0.002",
            "0.003",
            "0.004",
            "0.005",
            "0.006",
            "0.007",
            "0.008",
            "0.009",
            "0.01"
          ],
          minorTicks: 2,
          strokeTicks: true,
          highlights: [{"from": 0,"to": 0.003,"color":"rgba(0, 255, 0, .75)"},
          {"from": 0.003,"to": 0.007,"color":"rgba(255,255, 0, .75)"},
          {"from": 0.007,"to": 0.01,"color":"rgba(255, 0, 0, .75)"}],
          colorPlate: "#ccc",
          borderShadowWidth: 0,
          borders: false,
          needleType: "arrow",
          needleWidth: 2,
          needleCircleSize: 7,
          needleCircleOuter: true,
          needleCircleInner: false,
          animationDuration: 0,
          animationRule: "linear"
        }).draw();


        // Socket for the gauge chart
        var socket2 = io.connect('http://192.168.43.198:3000');

        socket2.on(device_id+"/energy", function(dataMsg) {
            console.log("Here",dataMsg['energy'],dataMsg['device_id']);
          if (dataMsg['device_id'] == device_id) {
            gauge2.value = dataMsg['energy'];
          }
        });



      });
