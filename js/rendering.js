const colorScheme = [
    "#25CCF7", "#FD7272", "#54a0ff", "#00d2d3",
    "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
    "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
    "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
    "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d",
    "#55efc4", "#81ecec", "#74b9ff", "#a29bfe", "#dfe6e9",
    "#00b894", "#00cec9", "#0984e3", "#6c5ce7", "#ffeaa7",
    "#fab1a0", "#ff7675", "#fd79a8", "#fdcb6e", "#e17055",
    "#d63031", "#feca57", "#5f27cd", "#54a0ff", "#01a3a4"
]

let listEnabled = []

generateDataPoints = function(list, date) {
    let l = []
    for (i in list) {
        l.push({
            y: list[i],
            label: date[i],
        })
    }
    return l
}

renderFromList = function(avgType) {
    chart.options.axisY = []
    chart.options.data = []
    for (i in listEnabled) {
        id = listEnabled[i]
        chart.options.axisY.push({
            title: datasets[id].title,
            titleFontSize: 20,
            labelFontSize: 15,
        })
        chart.options.data.push({
            type: "line",
            name: datasets[id].title,
            showInLegend: true,
            axisYIndex: i,
            dataPoints: generateDataPoints(datasets[id][avgType], date[avgType]),
        })
    }
    chart.render();
}

addDataset = function(id, avgType) {
    listEnabled.push(id)
    renderFromList(avgType)
}
removeDataset = function(id, avgType) {
    listEnabled = listEnabled.filter(x => x != id)
    renderFromList(avgType)
}

onChangeCheckbox = function(id) {
    avgType = [].slice.call(document.getElementsByName('avg'), 0).filter(x => x.checked)[0].id
    if (document.getElementById(id).checked) {
        addDataset(id, avgType)
    } else {
        removeDataset(id, avgType)
    }
}

onChangeCheckboxAvg = function() {
    let avgType = [].slice.call(document.getElementsByName('avg'), 0).filter(x => x.checked)[0].id
    renderFromList(avgType)
}

let giorniData = 0
setDateData = function() {

    let dataAggiornamento = date.avg_1[date.avg_1.length - 1 - giorniData]
    let infettiOggi = Number(datasets['nuovi_positivi'].avg_1[datasets['nuovi_positivi'].avg_1.length - 1 - giorniData]).toLocaleString()
    let guaritiOggi = Number(datasets['dimessi_guariti'].avg_1[datasets['dimessi_guariti'].avg_1.length - 1 - giorniData]).toLocaleString()
    let mortiOggi = Number(datasets['deceduti'].avg_1[datasets['deceduti'].avg_1.length - 1 - giorniData]).toLocaleString()
    let tamponi = Number(datasets['tamponi'].avg_1[datasets['tamponi'].avg_1.length - 1 - giorniData]).toLocaleString()

    $('#dataAggiornamento').text(dataAggiornamento)
    $('#infettiOggi').text('Nuovi infetti: +' + infettiOggi)
    $('#guaritiOggi').text('Nuovi guariti: +' + guaritiOggi)
    $('#mortiOggi').text('Nuovi decessi: +' + mortiOggi)
    $('#tamponiOggi').text('Nuovi tamponi effettuati: +' + tamponi)
}

previousDate = function() {
    giorniData++
    if (giorniData > date.avg_1.length - 1) {
        giorniData--
        return
    }
    setDateData()
}
nextDate = function() {
    giorniData--
    if (giorniData < 0) {
        giorniData++
        return
    }
    setDateData()
}
firstDate = function() {
    giorniData = date.avg_1.length - 1
    setDateData()
}
lastDate = function() {
    giorniData = 0
    setDateData()
}

let chart
window.onload = function() {
    chart = new CanvasJS.Chart("chartContainer", {
        toolTip: {
            shared: true
        },
        axisX: {
            labelFontSize: 20,
        },
        legend: {
            cursor: "pointer",
            verticalAlign: "top",
            horizontalAlign: "center",
            dockInsidePlotArea: true,
        },
        axisY: [],
        data: [],
    });

    getData().then(() => {

        let htmlData = $('#dataAggiornamento').html().replace('###DATA###', date.avg_1[date.avg_1.length - 1])

        setDateData()
        addDataset('nuovi_positivi', 'avg_1')
    })
}