import {QUOTE_URL} from "./config.js";

let intervalId = null;
let isSubmitting = false;

function updateTableRows(quotes) {
    if (!quotes) {
        return;
    }

    quotes.forEach(quote => {
        console.log(`data: ${JSON.stringify(quote)}`);
        const tdLast = document.querySelector(`tr[id="${quote.symbolId}"] > td[data-col="last"] > span`);
        const tdHigh = document.querySelector(`tr[id="${quote.symbolId}"] > td[data-col="high"] > span`);
        const tdLow = document.querySelector(`tr[id="${quote.symbolId}"] > td[data-col="low"] > span`);
        const tdChange = document.querySelector(`tr[id="${quote.symbolId}"] > td[data-col="change"] > span`);
        const tdTurnover = document.querySelector(`tr[id="${quote.symbolId}"] > td[data-col="turnover"] > span`);
        const tdTimestamp = document.querySelector(`tr[id="${quote.symbolId}"] > td[data-col="timestamp"] > span`);

        triggerChange(tdLast, tdLast.textContent, quote.last);
        triggerChange(tdHigh, tdHigh.textContent, quote.high);
        triggerChange(tdLow, tdLow.textContent, quote.low);
        triggerChange(tdChange, tdChange.textContent, quote.change);
        triggerChange(tdTurnover, tdTurnover.textContent, quote.turnover);
        triggerChange(tdTimestamp, tdTimestamp.textContent, quote.timestamp);
    });
}

function triggerChange(elem, oldValue, newValue) {
    if (oldValue === newValue) {
        return;
    }
    elem.classList.add('highlight');
    elem.textContent = newValue;
    setTimeout(() => {
        elem.classList.remove('highlight');
    }, 2000);
}

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    console.log("Disconnect");
    clearInterval(intervalId);
});

$(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const watchlistId = urlParams.get('id');

    fetchQuoteAsync(watchlistId);

    intervalId = setInterval(async () => {
        fetchQuoteAsync(watchlistId);
    }, 5000);
});

async function fetchQuoteAsync(watchlistId) {
    const url = `${QUOTE_URL}?w=${watchlistId}`;
    const requestOptions = {
        method: 'GET',
        headers: getHttpHeaders(),
    };
    console.log("Fetching new quotes...");
    const quotesResponse = await performAsyncAction(url, requestOptions);
    console.log(quotesResponse.data);
    updateTableRows(quotesResponse.data);
}

async function performAsyncAction(url, requestOptions) {
    if (isSubmitting) {
        return;
    }
    isSubmitting = true;

    try {
        const response = await fetch(url, requestOptions);

        if (response.status === 401) {
            throw new Error('Token expired! Please login again!');
        }

        const json_response = await response.json();

        console.log(json_response);

        if (response.status >= 400 && response.status < 600) {
            throw new Error(json_response.error.message);
        }

        isSubmitting = false;

        // success response body may or may not be empty
        return json_response || response.status === 200;
    } catch (err) {
        isSubmitting = false;
        return false;
    }
}

function getHttpHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('jwt')
    };
}
