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

let rangeMonth = 1000
let avgType = 'avg_1'

let generateDataPoints = function(list, date) {
    let l = []

    let dateRange = moment().subtract(rangeMonth, 'months')
    for (i in list) {
        if (moment(date[i]) < dateRange)
            continue

        l.push({
            y: list[i],
            label: date[i].toLocaleDateString(),
        })
    }
    return l
}

let renderFromList = function() {
    chart.options.axisY = []
    chart.options.data = []

    for (let i in listEnabled) {
        for (let regione of regioniSelezionate) {
            id = listEnabled[i] + regione
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
    }
    chart.render();
}

let addDataset = function(id) {
    listEnabled.push(id)
    renderFromList()
}
let removeDataset = function(id) {
    listEnabled = listEnabled.filter(x => x != id)
    renderFromList()
}

let onChangeCheckbox = function(id) {
    if (document.getElementById(id).checked) {
        addDataset(id)
    } else {
        removeDataset(id)
    }
}

let onChangeCheckboxAvg = function() {
    avgType = [].slice.call(document.getElementsByName('avg'), 0).filter(x => x.checked)[0].id
    renderFromList()
}

let giorniData = 0
let setDateData = function() {

    let dataAggiornamento = date.avg_1[date.avg_1.length - 1 - giorniData]
    let infettiOggi = getNumberFromDataset('nuovi_positivi', giorniData)
    let guaritiOggi = getNumberFromDataset('dimessi_guariti', giorniData)
    let mortiOggi = getNumberFromDataset('deceduti', giorniData)
    let tamponi = getNumberFromDataset('tamponi', giorniData)

    $('#dataAggiornamento').text(dataAggiornamento.toLocaleDateString())
    $('#infettiOggi').text('Nuovi infetti: +' + infettiOggi)
    $('#guaritiOggi').text('Nuovi guariti: +' + guaritiOggi)
    $('#mortiOggi').text('Nuovi decessi: +' + mortiOggi)
    $('#tamponiOggi').text('Nuovi tamponi effettuati: +' + tamponi)
}

let previousDate = function() {
    giorniData++
    if (giorniData > date.avg_1.length - 1) {
        giorniData--
        return
    }
    setDateData()
}
let nextDate = function() {
    giorniData--
    if (giorniData < 0) {
        giorniData++
        return
    }
    setDateData()
}
let firstDate = function() {
    giorniData = date.avg_1.length - 1
    setDateData()
}
let lastDate = function() {
    giorniData = 0
    setDateData()
}

let multiSelectConfig = {
    keepOrder: true,
    afterSelect: function(value) {
        regioniSelezionate.push(value[0])
        renderFromList()
    },
    afterDeselect: function(value) {
        regioniSelezionate = regioniSelezionate.filter(e => e != value[0])
        renderFromList()
    },
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

    regioni.forEach(element => {
        $('#regioni').append(new Option(element, element));
    })
    $('#regioni').multiSelect(multiSelectConfig)

    getData().then(() => {
        setDateData()
        addDataset('nuovi_positivi')
    })
}

let regioniSelezionate = [''];

function getNumberFromDataset(dataset, giorniData) {
    return Number(datasets[dataset].avg_1[datasets[dataset].avg_1.length - 1 - giorniData]).toLocaleString()
}