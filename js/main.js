const toggle = document.getElementById("toggle");
const audio = document.getElementById("audio");
const label = document.getElementById("imageLabel");
const lain = document.getElementById("lain");
const CameraFlash = document.getElementById("CameraFlash");
const abstractAudio = document.getElementById("abstractAudio");

const background = document.getElementById("background");

let lainTimer = null;
let lainFirstTimer = null;
let lainHideTimer = null;

// Stop Adudio saat mencapai batas
audio.addEventListener("timeupdate", () => {
  

  if (audio.currentTime >= 162.1) {
    easterEeg.classList.remove("show");
    easterEeg.style.opacity = "0";
    easterEeg.style.pointerEvents = "none";

    abstractAudio.volume = 0.4;
    abstractAudio.currentTime = 0;
    abstractAudio.playbackRate = 1;
    abstractAudio.play();

    audio.pause();
    audio.currentTime = 0;

    clearTimeout(toggleLockedTimer);
    toggleLockedTimer = null;

    toggleLocked = false;
    label.classList.remove("locked");

    stopLainText();
    endBackground();
    // setelah audio selesai, checkboxnya juga false
    toggle.checked = false;
  }
});

//  variabel toggleLocked ini untuk ngelock pas awal pencet checkbox ,
// ini aku buat karena masalah bug di awal ,
// saat checkbox di klik terus  1 detik kemudian di pencet lagi otomatis audio paused ,
// tapi masalahnya fade nya belum selesai , pas  paused, gak gelap tapi nampilin gambar beberapa detik ,
// jadi, fadenya maksa mau ngelesaini animasinya , jadi aku lock aja selama animasi nya mau nyelesaiin animasinya
let toggleLocked = false;
let toggleLockedTimer = null;

//play audio
toggle.addEventListener("change", () => {
  if (toggleLocked) {
    toggle.checked = true;
    return;
  }
  if (toggle.checked) {
    easterEeg.style.opacity = "";
    easterEeg.style.pointerEvents = "";

    toggleLocked = true;

    audio.currentTime = 101.2;
    audio.playbackRate = 1;
    audio.play();

    startLainText();
    startBackground();
    background.classList.remove("final");

    label.classList.add("locked");

    // lock checkbox selama fade in dari awal
    toggleLockedTimer = setTimeout(() => {
      toggleLocked = false;
      label.classList.remove("locked");
      toggleLockedTimer = null;
    }, 4000);
  } else {
    easterEeg.classList.remove("show");
    CameraFlash.volume = 0.3;
    CameraFlash.currentTime = 0.2;
    CameraFlash.playbackRate = 1;
    CameraFlash.play();

    audio.pause();
    audio.currentTime = 0;

    stopLainText();
    flashBackground();
    background.classList.remove("final");
  }
});

// hold image
label.addEventListener("mousedown", () => {
  if (!audio.paused) audio.playbackRate = 0.5;
});
label.addEventListener("touchstart", () => {
  if (!audio.paused) audio.playbackRate = 0.5;
});

// Lepas di mana pun
document.addEventListener("mouseup", () => {
  if (!audio.paused) audio.playbackRate = 1;
});
document.addEventListener("touchend", () => {
  if (!audio.paused) audio.playbackRate = 1;
});

// lain text
function stopLainText() {
  clearTimeout(lainFirstTimer);
  clearInterval(lainTimer);
  clearTimeout(lainHideTimer);

  lain.classList.remove("show");
}

function showLain() {
  if (audio.paused) return;

  lain.classList.add("show");

  lainHideTimer = setTimeout(() => {
    lain.classList.remove("show");
  }, 2000);
}

function startLainText() {
  stopLainText();
  lainFirstTimer = setTimeout(() => {
    showLain();

    // setelah itu muncul setiap 10 detik
    lainTimer = setInterval(() => {
      showLain();
    }, 13000);
  }, 2000);
}

// BACKGROUND IMG
// const background = document.getElementById("background");

const eastertoggle = document.getElementById("eastertoggle");
const easterContent = document.getElementById("easterContent");
eastertoggle.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  easterContent.classList.toggle("show");
});
//asset
const backgrounds = [
  "img/streetXX.avif",
  "img/5cb151c4649af028976f46171b0e6e4c.jpg",
  "img/XxXxXx.jpg",
  "img/XXXXXXX.png",
];

let backgroundIndex = 0;

let backgroundTimer = null;
let backgroundFadeTimer = null;
let backgroundEndTimer = null;
let flashTimer = null;

// start
function startBackground() {
  clearInterval(backgroundTimer);
  clearTimeout(backgroundFadeTimer);
  clearTimeout(backgroundEndTimer);
  clearTimeout(flashTimer);

  backgroundTimer = null;
  backgroundFadeTimer = null;
  backgroundEndTimer = null;
  flashTimer = null;




  background.classList.remove("ending", "hidden", "flash", "change");

  backgroundIndex = 0;
  background.src = backgrounds[backgroundIndex];

  // background.classList.remove('hidden');
  backgroundTimer = setInterval(() => {
    // kalo paused , jangan mulai pergantian
    if (audio.paused) {
      return;
    }

    backgroundFadeTimer = setTimeout(() => {
      // if fade audio di paused jangan tampilin gambar berikutnya
      if (audio.paused) {
        return;
      }

      backgroundIndex++;

      if (backgroundIndex >= backgrounds.length) {
        clearInterval(backgroundTimer);
        backgroundTimer = null;
        return;
      }

      background.src = backgrounds[backgroundIndex];

      if (backgroundIndex === backgrounds.length - 1) {
        background.classList.add("final");

        clearInterval(backgroundTimer);
        backgroundTimer = null;
      }

      background.classList.remove("change");

      backgroundFadeTimer = null;
    }, 3000);
  }, 8000);
}
//end
function endBackground() {
  clearInterval(backgroundTimer);
  clearTimeout(backgroundFadeTimer);
  clearTimeout(backgroundEndTimer);
  clearTimeout(flashTimer);

  backgroundTimer = null;
  backgroundFadeTimer = null;
  backgroundEndTimer = null;
  flashTimer = null;

  easterEeg.classList.add("show");

  background.classList.remove("hidden", "flash", "change");
  // layar utama mulai gelap
  background.classList.add("ending");

  // tunggu sampe animasi utama selesai
  backgroundEndTimer = setTimeout(() => {
    background.classList.remove("ending");
    background.classList.add("hidden");

    backgroundEndTimer = null;
  }, 4000);
}

function flashBackground() {
  clearInterval(backgroundTimer);
  clearTimeout(backgroundFadeTimer);
  clearTimeout(backgroundEndTimer);
  clearTimeout(flashTimer);

  backgroundTimer = null;
  backgroundFadeTimer = null;
  backgroundEndTimer = null;
  flashTimer = null;

  easterEeg.classList.remove("show");
  //bersihin semua effek
  background.classList.remove("hidden", "ending", "flash");

  // animasi di paksa ulang
  void background.offsetWidth;

  //  flash
  background.classList.add("flash");

  //setelah 800ms gelap
  flashTimer = setTimeout(() => {
    background.classList.remove("flash");
    background.classList.add("hidden");

    backgroundIndex = 0;
    background.src = backgrounds[0];

    flashTimer = null;
  }, 800);
}

const easterEeg = document.getElementById("easterEeg");
// cursor kiri kanan
document.addEventListener("mousemove", (e) => {
  if (backgroundIndex !== backgrounds.length - 1) {
    easterEeg.classList.remove("show");
    return;
  }

  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  if (x < 0.33 && y > 0.66) {
    background.style.transformOrigin = "left bottom";
    easterEeg.classList.remove("show");
  } else if (x > 0.6 && y > 0.5) {
    background.style.transformOrigin = "right bottom";
    easterEeg.classList.add("show");
  } else if (x < 0.33) {
    background.style.transformOrigin = "left center";
    easterEeg.classList.remove("show");
  } else if (x > 0.66) {
    background.style.transformOrigin = "right center";
    easterEeg.classList.remove("show");
  } else {
    background.style.transformOrigin = "center center";
    easterEeg.classList.remove("show");
  }
});
