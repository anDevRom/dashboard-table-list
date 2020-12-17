const URL_GLOBAL = 'https://disease.sh/v3/covid-19/all'
const URL_COUNTRIES = 'https://disease.sh/v3/covid-19/countries'
const RELATIVE_NUMBER = 100000

const store = {
    async _sendRequest(url) {
        const response = await fetch(url)
        return response.json()
    },

    _initModeForData(data, type) {
        switch (type) {
            case 'ALL-TIME':
                return {
                    area: data.country ? data.country : 'Global',
                    cases: data.cases,
                    deaths: data.deaths,
                    recovered: data.recovered
                }

            case 'TODAY':
                return {
                    area: data.country ? data.country : 'Global',
                    cases: data.todayCases,
                    deaths: data.todayDeaths,
                    recovered: data.todayRecovered
                }

            case 'RELATIVE-ALL-TIME':
                return {
                    area: data.country ? data.country : 'Global',
                    cases: Number((data.casesPerOneMillion / 10).toFixed(3)),
                    deaths: Number((data.deathsPerOneMillion / 10).toFixed(3)),
                    recovered: Number((data.recoveredPerOneMillion / 10).toFixed(3)),
                }

            case 'RELATIVE-TODAY':
                return {
                    area: data.country ? data.country : 'Global',
                    cases: Number((data.todayCases * RELATIVE_NUMBER / data.population).toFixed(3)),
                    deaths: Number((data.todayDeaths * RELATIVE_NUMBER / data.population).toFixed(3)),
                    recovered: Number((data.todayRecovered * RELATIVE_NUMBER / data.population).toFixed(3)),
                }
        }
    },

    _getDataForGlobal(url, type) {
        return this._sendRequest(url).then(data => this._initModeForData(data, type))
    },

    _getDataForCountry(id) {
        return this._sendRequest(URL_COUNTRIES).then(data => data.find(country => country.countryInfo.iso3 === id))
    },

    //  ИНТЕРФЕЙС ОБЪЕКТА STORE
    //
    //  Все методы (кроме .getCountryFlagUrl и .getCountryCoordinates) возвращают объект с полями:
    //  * cases
    //  * deaths
    //  * recovered
    //
    //  id для страны является строка со значением iso3 этой страны

    getGlobalData() {   // возвращает промис с мировой статистикой за все время
        return this._getDataForGlobal(URL_GLOBAL, 'ALL-TIME')
    },

    getGlobalTodayData() {  // возвращает промис с мировой статистикой за сегодня
        return this._getDataForGlobal(URL_GLOBAL, 'TODAY')
    },

    getGlobalRelativeData() {   // возвращает промис с мировой статистикой за все время на 100 000
        return this._getDataForGlobal(URL_GLOBAL, 'RELATIVE-ALL-TIME')
    },

    getGlobalTodayRelativeData() {  // возвращает промис с мировой статистикой за сегодня на 100 000
        return this._getDataForGlobal(URL_GLOBAL, 'RELATIVE-TODAY')
    },

    getAllCountriesData() {
        return this._sendRequest(URL_COUNTRIES).then(data => data.map(country => (
            {
                id: country.countryInfo.iso3,
                area: country.country,
                cases: country.cases,
                deaths: country.deaths,
                recovered: country.recovered,
                flag: country.countryInfo.flag
            }
        )))
    },

    async getCountryData(id) {  // возвращает промис со статистикой конкретной страны за все время
        return this._initModeForData(await this._getDataForCountry(id), 'ALL-TIME')
    },

    async getCountryTodayData(id) {  // возвращает промис со статистикой конкретной страны за сегодня
        return this._initModeForData(await this._getDataForCountry(id), 'TODAY')
    },

    async getCountryRelativeData(id) {  // возвращает промис со статистикой конкретной страны за все время на 100 000
        return this._initModeForData(await this._getDataForCountry(id), 'RELATIVE-ALL-TIME')
    },

    async getCountryTodayRelativeData(id) {  // возвращает промис со статистикой конкретной страны за сегодня на 100 000
        return this._initModeForData(await this._getDataForCountry(id), 'RELATIVE-TODAY')
    },

    getCountryFlagUrl(id) {  // возвращает промис с url-адресом флага конкретной страны
        return this._getDataForCountry(id).then(data => data.countryInfo.flag)
    },

    getCountryCoordinates(id) {  // возвращает промис с координатами конкретной страны
        return this._getDataForCountry(id).then(data => ({
            lat: data.countryInfo.lat,
            long: data.countryInfo.long
        }))
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const state = {
    isGlobal: true,
    currentCountry: null,
    currentListMode: 'cases',
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const tableContainer = document.querySelector('#table-container')
tableContainer.append(renderTable(), renderModesContainer())

store.getGlobalData().then((data) => {
    renderStatistics(data)
})

function renderModesContainer() {
    const modesWrapper = document.createElement('div')
    modesWrapper.classList.add('modes-wrapper')

    modesWrapper.innerHTML =
        '<div>' +
        '   <p>Please select time period:</p>' +
        '   <div>' +
        '       <input type="radio" id="timeChoice1" name="time" value="allTime" checked>' +
        '       <label for="timeChoice1">All time</label>' +
        '' +
        '       <input type="radio" id="timeChoice2" name="time" value="today">' +
        '       <label for="timeChoice2">Today</label>' +
        '   </div>' +
        '</div>' +
        '' +
        '<div>' +
        '   <p>Please select range of values:</p>' +
        '   <div>' +
        '       <input type="radio" id="rangeChoice1" name="range" value="absolute" checked>' +
        '       <label for="rangeChoice1">Absolute</label>' +
        '' +
        '       <input type="radio" id="rangeChoice2" name="range" value="relative">' +
        '       <label for="rangeChoice2">Relative</label>' +
        '   </div>' +
        '</div>' +
        '' +
        '<button>Apply</button>'

    modesWrapper.querySelector('button').addEventListener('click', () => {
        switch (state.isGlobal) {
            case true:
                if (timeChoice1.checked && rangeChoice1.checked) {
                    store.getGlobalData().then((data) => renderStatistics(data))
                }
                if (timeChoice1.checked && rangeChoice2.checked) {
                    store.getGlobalRelativeData().then((data) => renderStatistics(data))
                }
                if (timeChoice2.checked && rangeChoice1.checked) {
                    store.getGlobalTodayData().then((data) => renderStatistics(data))
                }
                if (timeChoice2.checked && rangeChoice2.checked) {
                    store.getGlobalTodayRelativeData().then((data) => renderStatistics(data))
                }
                break
            case false:
                if (timeChoice1.checked && rangeChoice1.checked) {
                    store.getCountryData(state.currentCountry).then((data) => renderStatistics(data))
                }
                if (timeChoice1.checked && rangeChoice2.checked) {
                    store.getCountryRelativeData(state.currentCountry).then((data) => renderStatistics(data))
                }
                if (timeChoice2.checked && rangeChoice1.checked) {
                    store.getCountryTodayData(state.currentCountry).then((data) => renderStatistics(data))
                }
                if (timeChoice2.checked && rangeChoice2.checked) {
                    store.getCountryTodayRelativeData(state.currentCountry).then((data) => renderStatistics(data))
                }
        }

    })

    return modesWrapper
}

function renderTable() {
    const tableWrapper = document.createElement('div')
    tableWrapper.classList.add('table-values-wrapper')

    tableWrapper.innerHTML =
        '<div class="table-content">' +
        `   <div class="table-content__name table-cell"><span id="tableArea">-</span></div>` +
        `   <div class="table-content__cases table-cell">Cases:<span id="tableCases">-</span></div>` +
        `   <div class="table-content__deaths table-cell">Deaths:<span id="tableDeaths">-</span></div>` +
        `   <div class="table-content__recovered table-cell">Recovered:<span id="tableRecovered">-</span></div>` +
        '</div>'

    return tableWrapper
}

function renderStatistics(statistics) {
    tableArea.textContent = statistics.area
    tableCases.textContent = statistics.cases
    tableDeaths.textContent = statistics.deaths
    tableRecovered.textContent = statistics.recovered
}

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
const list = document.querySelector('#list')

store.getAllCountriesData().then(data => {
    list.append(renderList(data))
})

function renderList(list) {
    const listWrapper = document.createElement('div')
    listWrapper.classList.add('list-wrapper')

    const mode = state.currentListMode

    list.sort((a, b) => b[mode] - a[mode])
    list.forEach(country => {
        const countryBlock = document.createElement('div')
        countryBlock.innerHTML =
            `<div class="list-wrapper__country-block">
                <div style="display: flex">
                    <img style="margin-right: 5px;" src=${country.flag}>
                    <div style="margin-right: 10px;">${country.area}</div>
                </div>
                <div>${country[mode]}</div>
            </div>`

        countryBlock.addEventListener('click', () => {
            state.isGlobal = false
            state.currentCountry = country.id
            timeChoice1.checked = true
            rangeChoice1.checked = true
            renderStatistics(country)
        })

        listWrapper.append(countryBlock)
    })

    return listWrapper
}

/////////////////////////////////////////////////////////////////////////////////////////

document.querySelector('select').addEventListener('change', (event) => {
    state.currentListMode = event.currentTarget.value
    list.removeChild(list.lastChild)
    store.getAllCountriesData().then(data => {
        list.append(renderList(data))
    })
})
