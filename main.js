const clickMin = 3;
const clickRadio = 1;

const timeMin = 2;
const timeRadio = 2;

const ENTER_KEY = 13;

clickTimes = [];
deviations = [];
timediffs = [];
_running = false;

var runNumber = 0;
var counterNumber = 0;
let updater;

var baseData = {
	type: "spline",
	dataPoints: []
};

function beginTest() {
	_running = true;
	clickLimit = Math.round(parseInt(document.getElementById('clickNum').value));
	timeLimit = Math.round(parseInt(document.getElementById('clickTime').value));

	document.querySelector('div[contenteditable]').textContent = '';

	if (timeLimit <= timeMin) {
		alert(`Please enter a value larger than ${timeMin}`);
		_running = false;
		return false;
	}
	if (clickLimit <= clickMin) {
		alert(`Please enter a value larger than ${clickMin}`);
		_running = false;
		return false;
	}

	clickTimes.length = 0;
	deviations.length = 0;
	timediffs.length = 0;

	beginTime = -1;
	key1 = $('#key1').val().toLowerCase();
	key2 = $('#key2').val().toLowerCase();
	mouse = $("input[name='cmouse']").prop("checked");
	$("div#status").html("Test ready, press key 1 or key 2 to begin.");
	$("div#Result").html("\
        Tap Speed: 0 taps / 0 seconds<br>\
        Stream Speed: 0 bpm<br>\
        Unstable Rate: 0.\
    ");
	localStorage.setItem('clickLimit', clickLimit);
	localStorage.setItem('timeLimit', timeLimit);
	localStorage.setItem('key1', key1);
	localStorage.setItem('key2', key2);
	localStorage.setItem('mouse', mouse);
	std = 0;

	$("button#submit").hide();
	$("button#stopbtn").show();

	if (runNumber > 0) {
		$("#chartContainer").CanvasJSChart().options.data.push({
			type: "spline",
			dataPoints: []
		});
		$("#chartContainer").CanvasJSChart().options.data[runNumber - 1].visible = false;
	}

	$("#chartContainer").CanvasJSChart().render();
	counterNumber = 0;
	return true;
}

function radiof(num) {
	if (num == clickRadio) {
		$("#numClicks").show();
		$("#timeClicks").hide();
	}
	if (num == timeRadio) {
		$("#timeClicks").show();
		$("#numClicks").hide();
	}
}

function endTest() {
	_running = false;
	update(false);
	beginTime = -1;
	$("button#submit").html("Retry");
	$("div#status").html("Test Finished. Hit the Retry button or press Enter to try again.");

	if ($("input[name='roption']:checked").val() == "time")
		window.clearInterval(endTimer);

	window.clearInterval(updater);
	$("button#submit").show();
	$("button#stopbtn").hide();
	runNumber = runNumber + 1;
	return;
}

function update(click) {
	if (click) {
		if (timediffs.length > 0) {
			sum = timediffs.reduce((a, b) => a + b);
			avg = sum / timediffs.length;

			$.each(timediffs, (i, v) => deviations[i] = (v - avg) * (v - avg));

			variance = deviations.reduce((a, b) => a + b);
			std = Math.sqrt(variance / deviations.length);
			unstableRate = std * 10;
		}
		clickTimes.push(Date.now());
		if (clickTimes.length > 1)
			timediffs.push(clickTimes[clickTimes.length - 1] - clickTimes[clickTimes.length - 2]);

		if (clickTimes.length > 2) {
			var chart = $("#chartContainer").CanvasJSChart();
			chart.options.data[runNumber].dataPoints.push({
				x: (Date.now() - beginTime) / 1000.0,
				y: (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100),
				label: ((Math.round(unstableRate * 100000) / 100000).toFixed(3)).toString()
			});
			chart.render();
		}
	} else {
		counterNumber = (counterNumber + 1) % 30;
		streamtime = (Date.now() - beginTime) / 1000;

		if (timediffs.length < 2) {
			$("div#Result").html("\
		Tap Speed: " + (clickTimes.length.toString() + " taps / " + streamtime.toFixed(3)) + " seconds.<br>\
		Stream Speed: " + (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2) + " bpm.<br>\
		Unstable Rate: n/a.\
	");
		} else {
			$("div#Result").html("\
		    Tap Speed: " + (clickTimes.length.toString() + " taps / " + streamtime.toFixed(3)) + " seconds.<br>\
		    Stream Speed: " + (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2) + " bpm.<br>\
		    Unstable Rate: " + (Math.round(unstableRate * 100000) / 100000).toFixed(3) + "\
	    ");
			if (counterNumber == 0) {
				var chart = $("#chartContainer").CanvasJSChart();
				chart.options.data[runNumber].dataPoints.push({
					x: (Date.now() - beginTime) / 1000.0,
					y: (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100),
					label: ((Math.round(unstableRate * 100000) / 100000).toFixed(3)).toString()
				});
				chart.render();
			}
		}
	}
}

function wrapKey(key, color) {
	let span = document.createElement("span");
	span.style.color = color;
	span.textContent = key;

	return span;
}



$(document).keyup(function (event) {
	//let textarea = document.querySelector(".resize-ta");
	//textarea.style.height = calcHeight(textarea.value) + "px";

	let target = document.querySelector('div[contenteditable]');
	if (event.keyCode == ENTER_KEY && !_running) {
		beginTest();
	}

	if (_running) {
		if (event.key.toLowerCase() == key1 || event.key.toLowerCase() == key2) {
			//if ((String.fromCharCode(event.which) == key1.toUpperCase()) || (String.fromCharCode(event.which) == key2.toUpperCase())) {
			if (event.key.toLowerCase() == key1) {
				target.appendChild(wrapKey(key1, "red"));
			}
			if (event.key.toLowerCase() == key2) {
				target.appendChild(wrapKey(key2, "white"));
			}
			switch (beginTime) {
				case -1:
					beginTime = Date.now();
					$("div#status").html("Test currently running.");
					updater = setInterval(function () { update(false); }, 16.6);


					if ($("input[name='roption']:checked").val() == "time") {
						endTimer = setTimeout(function () {
							endTest();
						}, timeLimit * 1000);
					}
				default:
					update(true);
					break;
			}
			if ((clickTimes.length == clickLimit) && ($("input[name='roption']:checked").val() == "clicks")) {
				endTest();
				return;
			}
		}
	}
});

$(document).mousedown(function (event) {
	if ($("input[name='cmouse']").prop("checked")) {
		document.oncontextmenu = function (e) { stopEvent(e); return false; };

		if (event.keyCode == ENTER_KEY && _running) {
			target.value = '';
			beginTest();
		}
		if (_running) {
			if ((event.which) == 1 || (event.which) == 3) {
				switch (beginTime) {
					case -1:
						beginTime = Date.now();
						$("div#status").html("Test currently running.");
						updater = setInterval(function () { update(false); }, 16.6);

						if ($("input[name='roption']:checked").val() == "time") {
							endTimer = setTimeout(function () {
								endTest();
							}, timeLimit * 1000);
						}
					default:
						update(true);
						break;
				}
				if ((clickTimes.length == clickLimit) && ($("input[name='roption']:checked").val() == "clicks")) {
					endTest();
					return;
				}
			}
		}
	}
	else {
		document.oncontextmenu = undefined;
	}
});

function stopEvent(event) {
	if (event.preventDefault != undefined)
		event.preventDefault();
	if (event.stopPropagation != undefined)
		event.stopPropagation();
}

$(document).ready(function () {
	if (!localStorage.getItem('clickLimit'))
		$("input#clickNum").val("20");
	else
		$("input#clickNum").val(localStorage.getItem('clickLimit'));
	if (!localStorage.getItem('key1'))
		$("input#key1").val("z");
	else
		$("input#key1").val(localStorage.getItem('key1'));
	if (!localStorage.getItem('key2'))
		$("input#key2").val("x");
	else
		$("input#key2").val(localStorage.getItem('key2'));
	if (!localStorage.getItem('timeLimit'))
		$("input#clickTime").val("10");
	else
		$("input#clickTime").val(localStorage.getItem('timeLimit'));
	if (!localStorage.getItem('mouse'))
		$("input[name='cmouse']").prop("checked", false);
	else
		$("input[name='cmouse']").prop("checked", localStorage.getItem('mouse') == "true");

	$("#chartContainer").CanvasJSChart({

		zoomEnabled: true,
		exportEnabled: true,
		title: {
			text: "BPM Chart"
		},
		axisY: {
			title: "BPM",
			includeZero: false
		},
		axisX: {
			title: "Time",
		},
		data: [
			{
				type: "spline",
				dataPoints: []
			}
		]
	});
});

function calcHeight(value) {
	let numberOfLineBreaks = (value.match(/\n/g) || []).length;
	// min-height + lines x line-height + padding + border
	let newHeight = 20 + numberOfLineBreaks * 20 + 12 + 2;
	return newHeight;
}