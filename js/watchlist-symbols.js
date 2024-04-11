import { SYMBOL_URL, WATCHLIST_SYMBOL_URL } from "./config.js";

const staticBackdropLabel = document.getElementById("staticBackdropLabel");
const modalBody = document.getElementById("modal-body");
const modalFooter = document.getElementById("modal-footer");

const searchInput = document.getElementById("search-input");
const suggestionsList = document.getElementById("suggestions-list");
const addButton = document.getElementById("add-btn");
const watchlistSymbolWrapperElem = document.getElementById("watchlist-symbols");

const urlParams = new URLSearchParams(window.location.search);
const watchlistId = urlParams.get('id');

let timeoutId;
let selectedSuggestion;
let isSubmitting = false;

let modalTitle;
let modalMessage;


document.addEventListener('DOMContentLoaded', function () {
    registerListeners();
    fetchAndConstructWatchlistSymbolElems();
});

function registerListeners() {
   // Fetch new suggestions when there is any input event
   searchInput.addEventListener("input", onInputChange);

   // Display matching suggestion when user focuses on the search bar
   searchInput.addEventListener("focus", fetchAndConstructSuggestions);

   // The suggestion list should no longer display when user clicks away from the search bar
   searchInput.addEventListener("blur", clearSuggestions);

   // Add list item when the add button is clicked
   addButton.addEventListener("click", onAddButtonClick);
}

async function fetchAndConstructWatchlistSymbolElems() {
    const response = await fetchWatchlistSymbols(watchlistId);

    if (!response) {
        showModalWithMessageAndHideConfirmBtn();
        return;
    }

    constructWatchlistSymbolElems(response);
}

async function fetchWatchlistSymbols(watchlistId) {
    const url = new URL(WATCHLIST_SYMBOL_URL);
    url.searchParams.set('w', watchlistId);

    const requestOptions = {
        method: 'GET',
        headers: getHttpHeaders(),
    };

    return await performAsyncAction(url, requestOptions);
}

function constructWatchlistSymbolElems(watchlistSymbols) {
    const fragment = document.createDocumentFragment();
    watchlistSymbols.forEach(wls => {
        fragment.appendChild(createWatchlistSymbolElem(wls));
    });
    watchlistSymbolWrapperElem.replaceChildren(fragment);
}

function createWatchlistSymbolElem(symbol) {
    const tr = document.createElement("tr");
    tr.setAttribute('id', symbol.id);

    const th = document.createElement("th");
    th.setAttribute('scope', 'row');

    const symbolTicker = document.createElement("p");
    const symbolName = document.createElement("p");
    symbolTicker.textContent = symbol.ticker;
    symbolName.textContent = symbol.name;

    th.appendChild(symbolTicker);
    th.appendChild(symbolName);

    const tdLast = document.createElement("td");
    const tdHigh = document.createElement("td");
    const tdLow = document.createElement("td");
    const tdChange = document.createElement("td");
    const tdTurnover = document.createElement("td");
    const tdTimestamp = document.createElement("td");
    const tdDeleteBtn = document.createElement("td");

    const deleteButton = document.createElement("i");
    deleteButton.classList.add("fa", "fa-trash", "fa-lg");
    deleteButton.addEventListener("click", () => showDeleteModal(symbol.id));

    tdDeleteBtn.appendChild(deleteButton);

    tdLast.setAttribute('data-col', 'last');
    tdHigh.setAttribute('data-col', 'high');
    tdLow.setAttribute('data-col', 'low');
    tdChange.setAttribute('data-col', 'change');
    tdTurnover.setAttribute('data-col', 'turnover');
    tdTimestamp.setAttribute('data-col', 'timestamp');

    tdLast.innerHTML = '<span>-</span>';
    tdHigh.innerHTML = '<span>-</span>';
    tdLow.innerHTML = '<span>-</span>';
    tdChange.innerHTML = '<span>-</span>';
    tdTurnover.innerHTML = '<span>-</span>';
    tdTimestamp.innerHTML = '<span>-</span>';

    tr.appendChild(th);
    tr.appendChild(tdLast);
    tr.appendChild(tdHigh);
    tr.appendChild(tdLow);
    tr.appendChild(tdChange);
    tr.appendChild(tdTurnover);
    tr.appendChild(tdTimestamp);
    tr.appendChild(tdDeleteBtn);

    return tr;
}

async function onAddButtonClick() {
    if (!selectedSuggestion) {
        return;
    }

    if (document.getElementById(selectedSuggestion.id)) {
        modalTitle = 'Error';
        modalMessage = 'Symbol already exists!'
        showModalWithMessageAndHideConfirmBtn();
        return;
    }

    const result = await addWatchlistSymbolAsync(selectedSuggestion);

    if (!result) {
        showModalWithMessageAndHideConfirmBtn();
        return;
    }

    const watchlistSymbolElem = createWatchlistSymbolElem(selectedSuggestion);
    watchlistSymbolWrapperElem.appendChild(watchlistSymbolElem);

    searchInput.value = "";
    selectedSuggestion = null;
}

async function addWatchlistSymbolAsync(selectedSuggestion) {
    const url = new URL(WATCHLIST_SYMBOL_URL);

    const data = {
        "watchListId": watchlistId,
        "symbolId": selectedSuggestion.id,
    }

    const requestOptions = {
        method: 'POST',
        headers: getHttpHeaders(),
        body: JSON.stringify(data)
    };

    return await performAsyncAction(url, requestOptions);
}

function onInputChange() {
    // The selected suggestion is no longer useful if user changes the input
    selectedSuggestion = null;

    // The suggestion list should not display if there is no input
    if (searchInput.value.length === 0) {
        clearSuggestions();
        return;
    }

    // Clear up any previous fetch jobs
    clearTimeout(timeoutId);

    // Schedule fetch jobs to be executed in 250 milliseconds
    timeoutId = setTimeout(fetchAndConstructSuggestions, 250);
}

async function fetchAndConstructSuggestions() {
    const queryString = searchInput.value;

    if (!queryString) {
        return;
    }

    const suggestionsResponse = await fetchSuggestionsAsync(queryString);

    constructSuggestionListItem(suggestionsResponse);
}

async function fetchSuggestionsAsync(queryString) {
    const url = new URL(SYMBOL_URL);
    url.searchParams.set('q', queryString);

    const requestOptions = {
        method: 'GET',
        headers: getHttpHeaders(),
    };

    return await performAsyncAction(url, requestOptions);
}

function constructSuggestionListItem(suggestionsResponse) {
    const fragment = document.createDocumentFragment();
    suggestionsResponse.forEach(suggestion => {
        fragment.appendChild(createSuggestionElement(suggestion));
    })
    suggestionsList.replaceChildren(fragment);

    // in case suggestion list has been hidden
    suggestionsList.classList.remove('d-none');
}

function createSuggestionElement(suggestion) {
    const suggestionElement = document.createElement("li");
    suggestionElement.classList.add("list-group-item", "suggestion-list-group-item");
    suggestionElement.textContent = suggestion.ticker + " - " + suggestion.name;

    // Use "mousedown" instead of "click" to avoid clashing with the "blur" event of searchInput
    suggestionElement.addEventListener("mousedown", () => {
        // Update search input textbox with selected suggestion
        searchInput.value = suggestion.ticker;
        // Update selected suggestion for further processing
        selectedSuggestion = suggestion;
        // The suggestion list should disappear once user has selected a suggestion
        clearSuggestions();
    });

    return suggestionElement;
}

function clearSuggestions() {
    // Clear any previous fetch jobs
    clearTimeout(timeoutId);
    // Clear the suggestion list
    suggestionsList.innerHTML = "";
    // Hide suggestion list to avoid blocking screen
    suggestionsList.classList.add('d-none');
}

function showDeleteModal(symbolId) {
    modalBody.innerHTML = "";

    const pElem = document.createElement("p");
    pElem.textContent = "Are you sure you want to delete?";

    modalBody.appendChild(pElem);

    const existingConfirmBtnElem = document.getElementById("modal-confirm-btn");
    const newConfirmBtnElem = existingConfirmBtnElem.cloneNode(true);
    newConfirmBtnElem.addEventListener('click', () => deleteWatchlistSymbol(symbolId));

    modalFooter.replaceChild(newConfirmBtnElem, existingConfirmBtnElem);

    // remove 'd-none' in case confirm button has been hidden when showing error message
    newConfirmBtnElem.classList.remove('d-none');

    staticBackdropLabel.textContent = "Delete Watchlist";

    showModal();
}

async function deleteWatchlistSymbol(symbolId) {
    const res = await deleteWatchlistSymbolAsync(symbolId);

    if (!res) {
        alert(modalTitle + ": " + modalMessage);
        return;
    }

    const originalListItem = document.getElementById(symbolId);
    originalListItem.remove();
    hideModal();
}

async function deleteWatchlistSymbolAsync(symbolId) {
    const url = new URL(`${WATCHLIST_SYMBOL_URL}`);

    const data = {
        "watchListId": watchlistId,
        "symbolId": symbolId,
    }

    const requestOptions = {
        method: 'DELETE',
        headers: getHttpHeaders(),
        body: JSON.stringify(data),
    };

    return performAsyncAction(url, requestOptions);
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
        modalTitle = "Error";
        modalMessage = err.message;
        return false;
    }
}

function showModalWithMessageAndHideConfirmBtn() {
    modalBody.innerHTML = "";

    const pElem = document.createElement("p");
    pElem.textContent = modalMessage;

    modalBody.appendChild(pElem);

    staticBackdropLabel.textContent = modalTitle;

    // hide confirm button when showing error message
    const confirmBtnElem = document.getElementById('modal-confirm-btn');
    confirmBtnElem.classList.add('d-none');

    showModal();
}

function showModal() {
    $("#staticBackdrop").modal('show');
}

function hideModal() {
    $("#staticBackdrop").modal('hide');
}

function getHttpHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('jwt')
    };
}
