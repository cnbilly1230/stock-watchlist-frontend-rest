import { WATCHLIST_URL } from "./config.js";

const watchlistOverviewElem = document.getElementById("watchlist-overview");
const watchlistNameInput = document.getElementById("title");
const watchlistInputForm = document.getElementById("watchlist-input-form");

const staticBackdropLabel = document.getElementById("staticBackdropLabel");
const modalBody = document.getElementById("modal-body");
const modalFooter = document.getElementById("modal-footer");

const watchlistSymbolPath = "watchlist-symbols.html";

let modalTitle;
let modalMessage;
let isSubmitting = false;


document.addEventListener('DOMContentLoaded', function () {
    watchlistInputForm.addEventListener('submit', createAndConstructWatchlist);
    fetchAndConstructWatchlistElems();
});

async function fetchAndConstructWatchlistElems() {
    const watchlistResponse = await fetchWatchlistsAsync();

    if (!watchlistResponse) {
        showModalWithMessageAndHideConfirmBtn();
        return;
    }

    constructWatchlistElems(watchlistResponse);
}

async function fetchWatchlistsAsync() {
    const url = new URL(WATCHLIST_URL);

    const requestOptions = {
        method: 'GET',
        headers: getHttpHeaders(),
    };

    return await performAsyncAction(url, requestOptions);
};

function constructWatchlistElems(watchlists) {
    const fragment = document.createDocumentFragment();
    watchlists.forEach(wl => {
        fragment.appendChild(constructWatchlistElem(wl));
    });
    watchlistOverviewElem.replaceChildren(fragment);
}

async function createAndConstructWatchlist(event) {
    event.preventDefault();

    const watchlistItem = await createWatchlistAsync();

    if (!watchlistItem) {
        showModalWithMessageAndHideConfirmBtn();
        return;
    }

    const li = constructWatchlistElem(watchlistItem);
    watchlistOverviewElem.appendChild(li);
    watchlistInputForm.reset();
}

async function createWatchlistAsync() {
    const data = {
        name: watchlistNameInput.value
    };

    const url = new URL(WATCHLIST_URL);

    const requestOptions = {
        method: 'POST',
        headers: getHttpHeaders(),
        body: JSON.stringify(data)
    };

    return performAsyncAction(url, requestOptions);
}

function constructWatchlistElem(item) {
    const itemId = item.id;
    const itemName = item.name;

    const listItem = document.createElement("div");
    listItem.setAttribute('id', itemId)
    listItem.classList.add("list-group-item", "list-group-item-action");

    const listItemContent = document.createElement("div");
    listItemContent.classList.add("d-flex", "w-100", "justify-content-between");

    const heading = document.createElement("a");
    heading.classList.add("h5", "mb-1");
    heading.textContent = itemName;
    heading.addEventListener('click', () => onClickHeading(itemId))

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("d-flex", "justify-content-between", 'gap-2');

    const updateButton = document.createElement("i");
    updateButton.classList.add("fa", "fa-pencil", "fa-lg");
    updateButton.addEventListener('click', () => showUpdateModal(itemId, itemName));

    const deleteButton = document.createElement("i");
    deleteButton.classList.add("fa", "fa-trash", "fa-lg");
    deleteButton.addEventListener('click', () => showDeleteModal(itemId));

    buttonContainer.appendChild(updateButton);
    buttonContainer.appendChild(deleteButton);

    listItemContent.appendChild(heading);
    listItemContent.appendChild(buttonContainer);

    listItem.appendChild(listItemContent);

    return listItem;
}

function onClickHeading(watchlistId) {
    window.location.href = `${watchlistSymbolPath}?id=` + watchlistId;
}

function showDeleteModal(watchlistId) {
    modalBody.innerHTML = "";

    const pElem = document.createElement("p");
    pElem.textContent = "Are you sure you want to delete?";

    modalBody.appendChild(pElem);

    const existingConfirmBtnElem = document.getElementById("modal-confirm-btn");
    const newConfirmBtnElem = existingConfirmBtnElem.cloneNode(true);
    newConfirmBtnElem.addEventListener('click', () => deleteWatchlist(watchlistId));

    modalFooter.replaceChild(newConfirmBtnElem, existingConfirmBtnElem);

    // remove 'd-none' in case confirm button has been hidden when showing error message
    newConfirmBtnElem.classList.remove('d-none');

    staticBackdropLabel.textContent = "Delete Watchlist";

    showModal();
}

async function deleteWatchlist(watchlistId) {
    const res = await deleteWatchlistAsync(watchlistId);

    console.log(res);

    if (!res) {
        alert(modalTitle + ": " + modalMessage);
        return;
    }

    const originalListItem = document.getElementById(watchlistId);
    originalListItem.remove();
    hideModal();
}

async function deleteWatchlistAsync(watchlistId) {
    const url = new URL(`${WATCHLIST_URL}/${watchlistId}`);

    const requestOptions = {
        method: 'DELETE',
        headers: getHttpHeaders(),
    };

    return await performAsyncAction(url, requestOptions);
}

function showUpdateModal(watchlistId, originalWatchlistName) {
    modalBody.innerHTML = "";

    const inputElem = constructModalInputElem(originalWatchlistName);
    modalBody.appendChild(inputElem);

    const existingConfirmBtnElem = document.getElementById("modal-confirm-btn");
    const newConfirmBtnElem = existingConfirmBtnElem.cloneNode(true);
    newConfirmBtnElem.addEventListener('click', () => updateWatchlist(watchlistId));

    modalFooter.replaceChild(newConfirmBtnElem, existingConfirmBtnElem);

    // remove 'd-none' in case confirm button has been hidden when showing error message
    newConfirmBtnElem.classList.remove('d-none');

    staticBackdropLabel.textContent = "Update Watchlist";

    showModal();
}

function constructModalInputElem(elemValue) {
    const inputElem = document.createElement("input");
    inputElem.classList.add("form-control", "form-control-lg");
    inputElem.setAttribute("type", "text");
    inputElem.setAttribute("id", "modal-update-input");
    inputElem.value = elemValue;
    return inputElem;
}

async function updateWatchlist(watchlistId) {
    const result = await updateWatchlistAsync(watchlistId);

    if (!result) {
        alert(modalTitle + ": " + modalMessage);
        return;
    }

    const originalListItem = document.getElementById(watchlistId);
    const parentNode = originalListItem.parentNode;
    parentNode.replaceChild(constructWatchlistElem(result), originalListItem);
    hideModal();
}

async function updateWatchlistAsync(watchlistId) {
    const modalInputElem = document.getElementById("modal-update-input");
    const newWatchlistName = modalInputElem.value;

    if (!newWatchlistName) {
        modalTitle = "Error";
        modalMessage = "Input must not be empty!";
        return false;
    }

    if (newWatchlistName.length > 60) {
        modalTitle = "Error";
        modalMessage = "Input must not exceed 60 characters!";
        return false;
    }

    const data = {
        name: newWatchlistName
    };

    const url = new URL(`${WATCHLIST_URL}/${watchlistId}`);

    const requestOptions = {
        method: 'PUT',
        headers: getHttpHeaders(),
        body: JSON.stringify(data)
    };

    return await performAsyncAction(url, requestOptions);
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
