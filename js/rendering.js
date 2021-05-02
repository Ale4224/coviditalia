let listEnabled = []

let avgValue = 1
let minRange = null
let maxRange = null

let mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"

let generateDataPoints = function (list, date) {
    let l = []

    for (let i = 0; i < list.length; i++) {
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
let addDataToChartByRegione = function (index, id, regione) {
    addDataToChart(index, datasets[id].regioni[regione].title, datasets[id].regioni[regione].getAvg(avgValue, giorniData), date.getAvg(avgValue, giorniData))
}
let addDataToChartItalia = function (index, id) {
    addDataToChart(index, datasets[id].title, datasets[id].getAvg(avgValue, giorniData), date.getAvg(avgValue, giorniData))
}
let renderFromList = function () {
    chart.options.axisY = []
    chart.options.data = []

    let i = 0
    for (let id of listEnabled) {
        regioniSelezionate.forEach(regione => {
            if (regione == '')
                addDataToChartItalia(i, id)
            else
                addDataToChartByRegione(i, id, regione)
            if (!$('#sameScale').prop('checked'))
                i++
        })
    }

    let lsitaDate = date.getAvg(avgValue, giorniData)
    let viewportMinimum = 0
    if (minRange)
        viewportMinimum = lsitaDate.filter(d => d < minRange).length - 1

    let viewportMaximum = lsitaDate.length - 1
    if (maxRange)
        viewportMaximum = lsitaDate.filter(d => d <= maxRange).length - 1

    chart.options.axisX = { viewportMinimum, viewportMaximum }

    chart.render()
    setLocation()
}

let onChangeCheckboxAvg = function () {
    let avgType = [].slice.call(document.getElementsByName('avg'), 0).filter(x => x.checked)[0].id
    sendEvent('checkbox_avg_click_' + avgType, 'checkbox_avg_click', avgType + ' clicked')
    avgValue = Number(avgType.replace("avg_", ''))
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
    renderData('totale_vaccini_seconda_dose', 'Totale vaccini seconda dose: +', true)
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
    $('#rangeSlider').val(giorniData * -1)
    setDateData()
    changeDateRange()
}
let nextDate = function () {
    giorniData--
    if (giorniData < 0) {
        giorniData++
        return
    }
    $('#rangeSlider').val(giorniData * -1)
    setDateData()
    changeDateRange()
}
let firstDate = function () {
    giorniData = date.avg_1.length - 1
    $('#rangeSlider').val(giorniData * -1)
    setDateData()
    changeDateRange()
}
let lastDate = function () {
    giorniData = 0
    $('#rangeSlider').val(giorniData * -1)
    setDateData()
    changeDateRange()
}

let onInputRange = function (value) {
    giorniData = Math.abs(value)
    setDateData()
    changeDateRange()
}

let changeDateRange = function () {
    let range = [].slice.call(document.getElementsByName('dates'), 0).filter(x => x.checked)[0].value
    sendEvent('date_range_click_' + range, 'date_range_click', range + ' clicked')

    maxRange = date.getAvg(avgValue, giorniData).slice(-1)[0]
    if (range == 'all')
        minRange = 0
    else {
        minRange = moment(maxRange).subtract(range, 'months')
        if (minRange < date.avg_1[0])
            minRange = 0
    }

    renderFromList()
}

let chart
window.onload = function () {
    if (!navigator.share)
        $("#sharePng").toggle()

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

            minRange = date.avg_1[minIndex]
            maxRange = date.avg_1[maxIndex]
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

    $('#regioni').append(new Option('Tutte', ''))
    regioni.forEach(element => $('#regioni').append(new Option(element, element)))
    $('#regioni[multiple]').multiselect({
        columns: 2,
        maxPlaceholderOpts: 8,
        onOptionClick: (() => {
            regioniSelezionate = $('#regioni[multiple]').multiselect('getValues')
            renderFromList()
        })
    })
    $('#shareLink').tooltip({ title: "Clicca per copiare" })

    getData().then(() => {
        setDateData()
        Object.keys(datasets).forEach(k => $('#checkboxDatasets').append(new Option(datasets[k].title, k)))
        $('#checkboxDatasets[multiple]').multiselect({
            columns: 2,
            maxPlaceholderOpts: 8,
            onOptionClick: (() => {
                listEnabled = $('#checkboxDatasets[multiple]').multiselect('getValues')
                renderFromList()
            })
        })
        $('#loading').toggle()
        $('#loaded').toggle()
        handleQueryParams()
        let slide = $('#rangeSlider')
        slide.attr('max', 0)
        slide.attr('min', date.avg_1.length * -1 + 1)
        slide.val(0)
        slide.on('mouseover', function () {
            slide.bind(mousewheelevt, moveSlider)
        })
    })
}
let moveSlider = function (e) {
    e.preventDefault()
    let slide = $('#rangeSlider')
    let value = slide.val()
    console.log(value)
    if (e.originalEvent.wheelDelta < 0)
        slide.val(value - 1)
    else
        slide.val(Number(value) + 1);

    slide.trigger('input')
}

let interval
let playDate = function (e) {
    e.preventDefault()
    if (interval) {
        clearInterval(interval)
        interval = undefined
    }
    let slide = $('#rangeSlider')
    interval = setInterval(() => {
        let value = Number(slide.val())
        if (value + 1 < 0)
            slide.val(value + 1)
        else
            slide.val(slide.attr('min'))
        slide.trigger('input')
    }, 100)
}
let fastDate = function (e) {
    e.preventDefault()
    if (interval) {
        clearInterval(interval)
        interval = undefined
    }
    let slide = $('#rangeSlider')
    interval = setInterval(() => {
        let value = Number(slide.val())
        if (value + 1 < 0)
            slide.val(value + 1)
        else
            slide.val(slide.attr('min'))
        slide.trigger('input')
    }, 10)
}
let pauseDate = function (e) {
    e.preventDefault()
    clearInterval(interval)
    interval = undefined
}

let setLocation = function () {

    let queryString = '?'

    let selected = $('#checkboxDatasets[multiple]').multiselect('getValues')

    regioniSelezionate.forEach(r => queryString += "regione=" + r + "&");

    selected.forEach(x => queryString += "id=" + x + "&");

    [].slice.call(document.getElementsByName('avg'), 0)
        .filter(x => x.checked)
        .map(x => x.id)
        .filter(x => x != 'avg_1')
        .forEach(x => queryString += "avg=" + x + "&");

    [].slice.call(document.getElementsByName('dates'), 0)
        .filter(x => x.checked)
        .map(x => x.id)
        .filter(x => x != 'allDate')
        .forEach(x => queryString += "dates=" + x + "&");

    if (document.querySelector('#sameScale').checked)
        queryString += "scale=sameScale"

    $('#shareLink').val(encodeURI(location.origin + location.pathname + queryString))
}

let clickShareLink = function (el) {
    el.select()
    el.setSelectionRange(0, 99999)
    document.execCommand("copy")
}

let handleQueryParams = function () {
    const urlParams = new URLSearchParams(window.location.search)
    let regioni = []
    urlParams.forEach((value, key) => {
        if (key == 'id') {
            $('#checkboxDatasets[multiple]').multiselect('select', value)
        } else if (key == 'regione') {
            regioni.push(value)
        } else if (key == 'avg' || key == 'dates' || key == 'scale') {
            document.getElementById(value).checked = true
        }
    })

    let selected = $('#checkboxDatasets[multiple]').multiselect('getValues')

    selected.forEach(x => listEnabled.push(x))

    if (selected == 0) {
        $('#checkboxDatasets[multiple]').multiselect('select', 'nuovi_positivi')
        listEnabled.push('nuovi_positivi')
    }
    if (regioni.length > 0) {
        $('#regioni[multiple]').multiselect('deselect', '')
        $('#regioni[multiple]').multiselect('select', regioni)
        regioniSelezionate = regioni
    } else {
        $('#regioni[multiple]').multiselect('select', '')
    }
    changeDateRange()
    onChangeCheckboxAvg()
}

let regioniSelezionate = [''];

let getNumberFromDataset = function (dataset, giorniData) {
    return Number(datasets[dataset].avg_1[datasets[dataset].avg_1.length - 1 - giorniData])
}

let sharePng = function () {
    if (navigator.share) {
        let originalWidth = chart.width
        let originalHeight = chart.height

        chart.set("width", max(screen.width, screen.height))
        chart.set("height", min(screen.width, screen.height))

        let dataurl = document.querySelector("canvas").toDataURL('png')

        fetch(dataurl)
        .then((res) => res.blob())
        .then((blob) => new File([blob], "covid_italia_chart.png", {type: blob.type}))
        .then(file => {
            let filesArray = [file]
            navigator.share({
                files: filesArray,
                title: "covid_italia_chart.png",
                text: "Covid Italia Chart " + $('#shareLink').val(),
            })
            .finally(() => {
                chart.set("width", originalWidth)
                chart.set("height", originalHeight)
            })
            .catch((error) => console.log('Sharing failed', error))
        })
    } else {
        alert(`Your system doesn't support sharing files.`)
    }
}

let max = (a, b) => a > b ? a : b
let min = (a, b) => a < b ? a : b