import {LOGIN_URL} from "./config.js";

let isLoginSuccess;
let modalTitle;
let modalMessage;
let isSubmitting = false;

const loginForm = document.getElementById("login-form");
const staticBackdropLabel = document.getElementById("staticBackdropLabel");
const closeModalButton = document.getElementById("close-modal-btn");
const modalBody = document.getElementById("modal-body");

document.addEventListener('DOMContentLoaded', function () {
    closeModalButton.addEventListener("click", onCloseModal);
    loginForm.addEventListener("submit", onLogin);
})

async function onLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    const requestData = {
        "email": email.value,
        "password": password.value,
        "returnSecureToken": true,
    }

    isLoginSuccess = await submitFormRemotely(requestData);

    showModal();

    if (isLoginSuccess) {
        loginForm.reset();
    }
}

function onCloseModal() {
    if (isLoginSuccess) {
        setTimeout(() => {
            window.location.href = "watchlist-overview.html";
        }, 250)
    }
    $("#staticBackdrop").modal('hide');
}

async function submitFormRemotely(data) {
    // Exit if isSubmitting flag is true to prevent duplicate submissions
    if (isSubmitting) {
        return;
    }
    isSubmitting = true;

    const request_headers = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    try {
        const response = await fetch(LOGIN_URL, request_headers);
        const json_response = await response.json();

        if (response.status >= 400 && response.status < 600) {
            console.log(json_response);
            throw new Error(json_response.error.message);
        }

        localStorage.setItem("jwt", json_response.idToken);
        localStorage.setItem("displayName", json_response.displayName);
        localStorage.setItem("uid", json_response.localId);
    } catch (err) {
        isSubmitting = false;
        modalTitle = "Error";
        modalMessage = err.message;
        return false;
    }

    modalTitle = "Success";
    modalMessage = "You've successfully logged in! Redirecting...";
    isSubmitting = false;
    return true;
}

function showModal() {
    modalBody.innerHTML = "";

    const pElem = document.createElement("p");
    pElem.textContent = modalMessage;

    modalBody.appendChild(pElem);

    staticBackdropLabel.textContent = modalTitle;

    $("#staticBackdrop").modal('show');
}
