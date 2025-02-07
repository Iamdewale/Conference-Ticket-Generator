"use strict";

const containerApp = document.querySelector(".js-app-container");
const containerAppHeader = document.querySelector(".js-app-header");
const body = document.querySelector("body");
const form = document.querySelector("form");
const fileInput = document.querySelector(".js-input-file");
const submitButton = document.querySelector(".js-form-btn");
const uploadArea = document.querySelector("#js-draggable-upload-area");
const previewContainer = document.querySelector(".js-preview-container");
const ticketContainer = document.querySelector(".js-ticket-container");
const ticketDate = document.querySelector(".js-ticket-date");
const loaderComponent = document.querySelector(".js-loader");

// hints
const hints = new Map([
  [
    "avatar",
    "File invalid or too large. Please upload a photo under 500KB.",
    ,
  ],
  ["fullname", "Please enter your full name."],
  ["email_address", "Please enter a valid email address."],
  ["github_name", "Please enter your github username."],
]);

const createHintElement = (hint) => {
  return ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
  <path stroke="#D1D0D5" stroke-linecap="round" stroke-linejoin="round"
  d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8Z" />
  <path fill="#D1D0D5" d="M8.004 10.462V7.596ZM8 5.57v-.042Z" />
  <path stroke="#D1D0D5" stroke-linecap="round" stroke-linejoin="round"
  d="M8.004 10.462V7.596M8 5.569v-.042" />
  </svg>
  ${hint}`;
};

const userData = {};

function toggleHint(show, input, inputName) {
  const hintContainer = document.querySelector(`#${inputName}`);

  hintContainer.classList.toggle("form__hint--error", show);
  input.setAttribute("aria-describedby", show ? inputName : "");
  input.classList.toggle("form__input--error", show);

  if (inputName === "avatar") {
    hintContainer.innerHTML = createHintElement(
      "Upload your photo (JPG or PNG, max size: 500KB)."
    );
    return;
  }

  hintContainer.innerHTML = show ? createHintElement(hints.get(inputName)) : "";
}

function validateForm() {
  const formInputs = document.querySelectorAll(".js-form-input");

  let isValidationPassed = true;

  Array.from(formInputs).forEach((input) => {
    const { name: inputName, value: inputValue } = input;
    const trimmedValue = inputValue.trim();

    if (trimmedValue.length > 3) {
      toggleHint(false, input, inputName);

      if (inputName === "email_address") {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailPattern.test(trimmedValue);

        toggleHint(!isValidEmail, input, inputName);
        if (!isValidEmail) {
          isValidationPassed = false;
        }
      }

      userData[inputName] = trimmedValue;
      if (userData["github_name"] && !userData["github_name"].startsWith("@")) {
        userData["github_name"] = `@${userData["github_name"]}`;
      }
    } else {
      toggleHint(true, input, inputName);
      isValidationPassed = false;
    }
  });

  //Check if they have not uploaded a file
  if (!userData.imageUrl) {
    isValidationPassed = false;
    toggleHint(true, fileInput, fileInput.name);
  }

  return isValidationPassed;
}

// Ticket Rendering Handler
const generateTicket = () => {
  if (!userData) return;

  const [_, month, day, year] = new Date().toString().split(" ");
  const ticketNumber = Math.floor(Math.random(2) * (919589 - 119589) + 119589);

  const headerContent = `
    <h1 class="app__headline app__headline--ticket js-app-headline">
      Congrats, <span class="app__name js-app-name">${userData.fullname}!</span> Your ticket is ready.
    <p class="app__description app__description--ticket js-app-description">
      We've emailed your ticket to <span class="app__email js-app-email">${userData["email_address"]}</span> and will
      send updates in the run up to the event.
    </p>
  `;

  const ticketCard = `
    <div class="ticket__footer">
      <img src="${userData.imageUrl}" alt="" class="ticket__avatar">
      <div class="ticket__user">
        <h3 class="ticket__name">${userData.fullname}</h3>
        <div class="ticket__github">
          <img src="./assets/images/icon-github.svg" alt="" class="ticket__icon">
          <span>${userData["github_name"]}</span>
        </div>
      </div>
    </div>
    <p class="ticket__number">#${ticketNumber}</p>
  `;

  submitButton.textContent = "Loading...";
  submitButton.classList.add("form__btn--disable");

  loaderComponent.classList.add("app__loader--show"); // show loader

  body.style.overflow = "hidden"; // disable scrolling while preparing ticket

  //Update page UI
  setTimeout(() => {
    containerAppHeader.innerHTML = headerContent;
    ticketContainer.insertAdjacentHTML("beforeend", ticketCard);
    ticketDate.textContent = `${month} ${day}, ${year}`;

    body.style.height = "100vh";
    form.style.display = "none";

    loaderComponent.classList.remove("app__loader--show"); // remove loader

    document.querySelector(".js-ticket-main").style.display = "block"; // display ticket
  }, 1000);
};

const validateFile = (file) => {
  if (!file) return false;

  const fileTypes = ["image/jpeg", "image/png"];
  const { size, type } = file;

  const isValidFile = fileTypes.includes(type) && (size / 1e3).toFixed(1) < 500;

  toggleHint(!isValidFile, fileInput, "avatar");
  // throw error when file size is above 500kb or invalid
  return isValidFile;
};

function dragEnterLeaveToggler(e) {
  const dropZone = e.target.closest(".js-upload-area");

  if (dropZone) {
    if (e.type === "dragenter") {
      dropZone.classList.add("form__upload-area--dragover");
    } else if (e.type === "dragleave") {
      if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove("form__upload-area--dragover");
      }
    }
  }
}

function handleDragDropUpload(e) {
  e.preventDefault();
  const avatar = document.querySelector(".js-preview-image");
  const file = e.dataTransfer.files[0];
  const isInValidFile = !validateFile(file);

  uploadArea.classList.remove("form__upload-area--dragover");

  if (isInValidFile) return;

  if (userData.imageUrl && avatar) {
    avatar.remove();
  }

  const imageUrl = URL.createObjectURL(file);

  userData["imageUrl"] = imageUrl;
  previewUploadedImage(imageUrl);
}

function uploadSelectedFile(e) {
  const avatar = document.querySelector(".js-preview-image");
  const file = e.target.files[0];
  const isInValidFile = !validateFile(file);

  if (isInValidFile) return;

  //remove the old preview if it's 'change image event'
  if (userData.imageUrl && avatar) {
    avatar.remove();
  }

  const imageUrl = URL.createObjectURL(file); //create preview image url

  userData["imageUrl"] = imageUrl;
  previewUploadedImage(imageUrl);
}

function previewUploadedImage(imageUrl) {
  if (!imageUrl) return;

  const image = document.createElement("img");
  image.classList.add("preview__image", "js-preview-image");
  image.src = imageUrl;

  previewContainer.insertAdjacentElement("afterbegin", image);
  previewContainer.classList.add("preview--show");
  uploadArea.classList.add("form__upload-area--hidden");
}

function removeUploadedImage() {
  const avatar = document.querySelector(".js-preview-image");

  if (!userData.imageUrl && !avatar) return;
  URL.revokeObjectURL(userData.imageUrl);
  delete userData.imageUrl;

  previewContainer.classList.remove("preview--show");
  uploadArea.classList.remove("form__upload-area--hidden");
  avatar.remove();

  fileInput.value = "";
}

const onSubmitHandler = (e) => {
  e.preventDefault();
  validateForm() && generateTicket();
};

// App Events
fileInput.addEventListener("change", (e) => uploadSelectedFile(e));
uploadArea.addEventListener("dragenter", (e) => dragEnterLeaveToggler(e));
uploadArea.addEventListener("dragleave", (e) => dragEnterLeaveToggler(e));
uploadArea.addEventListener("dragover", (e) => e.preventDefault());
uploadArea.addEventListener("drop", (e) => handleDragDropUpload(e));
document.addEventListener("submit", (e) => onSubmitHandler(e));
document
  .querySelector(".js-remove-preview-btn")
  .addEventListener("click", removeUploadedImage);