let listEnabled = []

let avgType = 'avg_1'
let minRange = null
let maxRange = null

let generateDataPoints = function (list, date) {
    let l = []

    for (i in list) {
        l.push({
            y: list[i],
            label: date[i].toLocaleDateString(),
        })
    }
    return l
}

let addDataToChart = function (index, title, list, date) {
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
let addDataToChartByRegione = function (index, id, regione, avgType) {
    addDataToChart(index, datasets[id].regioni[regione].title, datasets[id].regioni[regione][avgType], date[avgType])
}
let addDataToChartItalia = function (index, id, avgType) {
    addDataToChart(index, datasets[id].title, datasets[id][avgType], date[avgType])
}
let renderFromList = function () {
    chart.options.axisY = []
    chart.options.data = []

    for (let i in listEnabled) {
        let id = listEnabled[i]
        regioniSelezionate.forEach(regione => {
            if (regione == '')
                addDataToChartItalia(i, id, avgType)
            else
                addDataToChartByRegione(i, id, regione, avgType)
        })
    }

    let viewportMinimum = 0
    if (minRange)
        viewportMinimum = date[avgType].filter(d => d < minRange).length - 1

    let viewportMaximum = date[avgType].length - 1
    if (maxRange)
        viewportMaximum = date[avgType].filter(d => d <= maxRange).length - 1

    chart.options.axisX = { viewportMinimum, viewportMaximum }

    chart.render()
    setLocation()
}


let onChangeCheckbox = function (id) {
    listEnabled = [
        ...[].slice.call(document.getElementById('checkboxDatasets0').children).filter(x => x.checked).map(x => x.id),
        ...[].slice.call(document.getElementById('checkboxDatasets1').children).filter(x => x.checked).map(x => x.id)
    ]
    renderFromList()
}

let onChangeCheckboxAvg = function () {
    avgType = [].slice.call(document.getElementsByName('avg'), 0).filter(x => x.checked)[0].id
    sendEvent('checkbox_avg_click_' + avgType, 'checkbox_avg_click', avgType + ' clicked')
    renderFromList()
}

let giorniData = 0
let setDateData = function () {

    let dataAggiornamento = date.avg_1[date.avg_1.length - 1 - giorniData]

    $('#dataAggiornamento').html(dataAggiornamento.toLocaleDateString())

    //renderData('nuovi_positivi', 'Nuovi infetti: +', false)
    //renderData('dimessi_guariti', 'Nuovi guariti: +', true)
    renderData('totale_positivi', 'Totale positivi ad oggi: +', false)
    //renderData('deceduti', 'Nuovi decessi: +', false)
    //renderData('tamponi', 'Nuovi tamponi effettuati: +', true)
    renderData('rateo_tamponi_nuovi_positivi', 'Rateo infetti per 1000 tamponi: +', false)
    renderData('totale_vaccini', 'Totale vaccini: +', true)
}

let renderData = function (id, descr, isHighGood) {

    let numOggi = getNumberFromDataset(id, giorniData)
    let numIeri = getNumberFromDataset(id, giorniData + 1)
    let numDiff = numOggi - numIeri

    if (isNaN(numDiff))
        numDiff = 0
    if (isNaN(numOggi))
        numOggi = 0
    if (isNaN(numIeri))
        numIeri = 0

    let isPos = numDiff > 0
    let isNeg = numDiff < 0
    let isZero = numDiff == 0

    let color = isZero ? 'grey' : isPos != isHighGood ? 'red' : isNeg != isHighGood ? 'green' : 'grey'
    let sign = isPos ? '+' : isNeg ? '-' : '+'
    $('#' + id + '_oggi').html(descr + numOggi.toLocaleString() + ' <span style="font-size: 16px;color:' + color + ';">(' + sign + Math.abs(numDiff).toLocaleString() + ' rispetto a ieri)</span>')
}

let previousDate = function () {
    giorniData++
    if (giorniData > date.avg_1.length - 1) {
        giorniData--
        return
    }
    setDateData()
}
let nextDate = function () {
    giorniData--
    if (giorniData < 0) {
        giorniData++
        return
    }
    setDateData()
}
let firstDate = function () {
    giorniData = date.avg_1.length - 1
    setDateData()
}
let lastDate = function () {
    giorniData = 0
    setDateData()
}

let multiSelectConfig = {
    keepOrder: true,
    afterSelect: function (value) {
        value.forEach(v =>{
            sendEvent('region_select_' + value[0], 'region_select', v + ' selected')
            regioniSelezionate.push(v)
        })
        renderFromList()
    },
    afterDeselect: function (value) {
        sendEvent('region_deselect_' + value[0], 'region_deselect', value[0] + ' deselected')
        regioniSelezionate = regioniSelezionate.filter(e => e != value[0])
        renderFromList()
    },
}

let changeDateRange = function (range) {
    sendEvent('date_range_click_' + range, 'date_range_click', range + ' clicked')

    maxRange = date[avgType][date[avgType].length - 1]
    if (range == 'all')
        minRange = 0
    else
        minRange = moment().subtract(range, 'months')

    renderFromList()
}

let chart
window.onload = function () {
    chart = new CanvasJS.Chart("chartContainer", {
        zoomEnabled: true,
        rangeChanging: function (e) {

            if (e.trigger == 'reset') {
                let element = Array.from(document.getElementsByName("dates")).filter(e => e.checked)[0]
                element.onchange()
                return
            }

            let minIndex = parseInt(e.axisX[0].viewportMinimum)
            let maxIndex = parseInt(e.axisX[0].viewportMaximum)

            minRange = date[avgType][minIndex]
            maxRange = date[avgType][maxIndex]
        },
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
    $('#shareLink').tooltip({title: "Clicca per copiare"})

    getData().then(() => {
        setDateData()
        renderFiltri()
        $('#loading').toggle()
        $('#loaded').toggle()
        $('#lastUpdateVaccini').text("Ultimo aggiornamento conteggio vaccini: " + lastUpdateVaccini.toLocaleString())
        handleQueryParams()
    })
}

let setLocation = function(){

    let queryString = '?'

    
    let selected = [
        ...[].slice.call(document.getElementById('checkboxDatasets0').children).filter(x => x.checked).map(x => x.id),
        ...[].slice.call(document.getElementById('checkboxDatasets1').children).filter(x => x.checked).map(x => x.id)
    ]

    regioniSelezionate.forEach(r => queryString += "regione=" + r + "&");
    
    selected.forEach(x => queryString += "id=" + x + "&");
    
    [].slice.call(document.getElementsByName('avg'), 0)
        .filter(x => x.checked)
        .map(x => x.id)
        .filter(x => x != 'avg_1')
        .forEach(x => queryString += "id=" + x + "&");

    [].slice.call(document.getElementsByName('dates'), 0)
            .filter(x => x.checked)
            .map(x => x.id)
            .filter(x => x != 'allDate')
            .forEach(x => queryString += "id=" + x + "&");

    $('#shareLink').val(location.host + location.pathname + queryString)
}

let clickShareLink = function(el){
    el.select()
    el.setSelectionRange(0, 99999)
    document.execCommand("copy")
}

let handleQueryParams = function () {
    const urlParams = new URLSearchParams(window.location.search)
    let regioni = []
    urlParams.forEach((value, key) => {
        if (key == 'id') {
            document.getElementById(value).checked = true
        } else if (key == 'regione') {
            regioni.push(value)
        }
    })

    let selected = [
        ...[].slice.call(document.getElementById('checkboxDatasets0').children).filter(x => x.checked),
        ...[].slice.call(document.getElementById('checkboxDatasets1').children).filter(x => x.checked)
    ]

    selected.map(x => x.id).forEach(x => listEnabled.push(x))

    if (selected == 0) {
        document.getElementById('nuovi_positivi').checked = true
        listEnabled.push('nuovi_positivi')
    }
    if(regioni.length > 0){
        $('#regioni').multiSelect('deselect', '')
        $('#regioni').multiSelect('select', regioni)
    } else {
        renderFromList()
    }
}

let regioniSelezionate = [''];

let getNumberFromDataset = function (dataset, giorniData) {
    return Number(datasets[dataset].avg_1[datasets[dataset].avg_1.length - 1 - giorniData])
}

let renderFiltri = function () {
    if (categorizr.isMobile)
        renderFiltriDesktop()
    //renderFiltriMobile()
    else
        renderFiltriDesktop()
}

let renderFiltriDesktop = function () {
    Object.keys(datasets).forEach(renderCheckboxDesktop)
}

let renderCheckboxDesktop = function (dsName, index) {
    let ds = datasets[dsName]
    let link = ds.link ? ' [<a href="' + ds.link + '" target="_blank">info</a>]' : ''
    let htmlFiltro = `
    <input type="checkbox" id="` + ds.id + `" onchange="onChangeCheckbox('` + ds.id + `')">
    <label for="` + ds.id + `">` + ds.title + link + `</label>
    <br>
    `
    $('#checkboxDatasets' + (index % 2)).append(htmlFiltro)
}

let renderFiltriMobile = function () {

}