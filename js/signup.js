import {SIGNUP_URL} from "./config.js";

let isSignupSuccess;
let modalTitle;
let modalMessage;
let isSubmitting = false;

const signupForm = document.getElementById("signup-form");
const staticBackdropLabel = document.getElementById("staticBackdropLabel");
const closeModalButton = document.getElementById("close-modal-btn");
const modalBody = document.getElementById("modal-body");

document.addEventListener('DOMContentLoaded', function () {
    closeModalButton.addEventListener("click", onCloseModal);
    signupForm.addEventListener("submit", onSignup);
})

async function onSignup(event) {
    event.preventDefault();

    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm-password");

    if (password.value !== confirmPassword.value) {
        confirmPassword.classList.add("is-invalid");
        return;
    }
    if (confirmPassword.classList.contains("is-invalid")) {
        confirmPassword.classList.remove("is-invalid");
    }

    const requestData = {
        "displayName": name.value,
        "email": email.value,
        "password": password.value,
    }

    isSignupSuccess = await submitFormRemotely(requestData);

    showModal();

    if (isSignupSuccess) {
        signupForm.reset();
    }
}

function onCloseModal() {
    if (isSignupSuccess) {
        setTimeout(() => {
            window.location.href = "index.html";
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
        const response = await fetch(SIGNUP_URL, request_headers);
        const json_response = await response.json();

        if (response.status >= 400 && response.status < 600) {
            console.log(json_response);
            throw new Error(json_response.error.message);
        }
    } catch (err) {
        isSubmitting = false;
        modalTitle = "Error";
        modalMessage = err.message;
        return false;
    }

    modalTitle = "Success";
    modalMessage = "You've successfully signed up! Returning to Home...";
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
