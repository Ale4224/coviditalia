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

let addDataToChart = function(index, title, list, date) {
    chart.options.axisY.push({
        title: title,
        titleFontSize: 20,
        labelFontSize: 15,
    })
    chart.options.data.push({
        type: "line",
        name: title,
        showInLegend: true,
        axisYIndex: index,
        dataPoints: generateDataPoints(list, date),
    })
}
let addDataToChartByRegione = function(index, id, regione, avgType) {
    addDataToChart(index, datasets[id].regioni[regione].title, datasets[id].regioni[regione][avgType], date[avgType])
}
let addDataToChartItalia = function(index, id, avgType) {
    addDataToChart(index, datasets[id].title, datasets[id][avgType], date[avgType])
}
let renderFromList = function() {
    chart.options.axisY = []
    chart.options.data = []

    for (let i in listEnabled) {
        let id = listEnabled[i]
        addDataToChartItalia(i, id, avgType)
        regioniSelezionate.filter(r => r != '').forEach(regione => {
            addDataToChartByRegione(i, id, regione, avgType)
        })
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
    let rateoTamponiInfettiOggi = getNumberFromDataset('rateo_tamponi_nuovi_positivi', giorniData)

    $('#dataAggiornamento').text(dataAggiornamento.toLocaleDateString())
    $('#infettiOggi').text('Nuovi infetti: +' + infettiOggi)
    $('#guaritiOggi').text('Nuovi guariti: +' + guaritiOggi)
    $('#mortiOggi').text('Nuovi decessi: +' + mortiOggi)
    $('#tamponiOggi').text('Nuovi tamponi effettuati: +' + tamponi)
    $('#rateoTamponiInfettiOggi').text('Rateo infetti per 1000 tamponi: ' + rateoTamponiInfettiOggi)
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
        renderFiltri()
        $('#nuovi_positivi').click()
    })
}

let regioniSelezionate = [''];

let getNumberFromDataset = function(dataset, giorniData) {
    return Number(datasets[dataset].avg_1[datasets[dataset].avg_1.length - 1 - giorniData]).toLocaleString()
}

let renderFiltri = function() {
    if (categorizr.isMobile)
        renderFiltriDesktop()
        //renderFiltriMobile()
    else
        renderFiltriDesktop()
}

let renderFiltriDesktop = function() {
    Object.keys(datasets).forEach(renderCheckboxDesktop)
}

let renderCheckboxDesktop = function(dsName, index) {
    let ds = datasets[dsName]
    let htmlFiltro = `
    <input type="checkbox" id="` + ds.id + `" onchange="onChangeCheckbox('` + ds.id + `')">
    <label for="` + ds.id + `">` + ds.title + `</label>
    <br>
    `
    $('#checkboxDatasets' + (index % 2)).append(htmlFiltro)
}

let renderFiltriMobile = function() {

}