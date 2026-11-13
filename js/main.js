import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

const toggle = document.getElementById("toggle");
const audio = document.getElementById("audio");
const label = document.getElementById("imageLabel");
const lain = document.getElementById("lain");
const CameraFlash = document.getElementById("CameraFlash");
const abstractAudio = document.getElementById("abstractAudio");

const background = document.getElementById("background");
const imageContainer = document.querySelector(".image-container");

const easterEeg = document.getElementById("easterEeg");
const eastertoggle = document.getElementById("eastertoggle");
const easterContent = document.getElementById("easterContent");

const easterEggUV = {
  x: 0.9,
  y: 0.935,
};

let lainTimer = null;
let lainFirstTimer = null;
let lainHideTimer = null;

//  variabel toggleLocked ini untuk ngelock pas awal pencet checkbox ,
// ini aku buat karena masalah bug di awal ,
// saat checkbox di klik terus  1 detik kemudian di pencet lagi otomatis audio paused ,
// tapi masalahnya fade nya belum selesai , pas  paused, gak gelap tapi nampilin gambar beberapa detik ,
// jadi, fadenya maksa mau ngelesaini animasinya , jadi aku lock aja selama animasi nya mau nyelesaiin animasinya
let toggleLocked = false;
let toggleLockedTimer = null;

let backgroundIndex = 0;

let backgroundTimer = null;
let backgroundFadeTimer = null;
let backgroundEndTimer = null;
let flashTimer = null;

let textureRequestId = 0;

let endingSequence = false;
let abstractAudioStarted = false;

let endingUnlockTimer = null;

const backgrounds = [
  "img/streetXX.png",
  "img/NCT01234567.jpg",
  "img/XxXxXx.jpg",
  "img/XXXXXXX.png",
];

// three.js setup
const renderer = new THREE.WebGLRenderer({
  canvas: background,
  antialias: true,
  alpha: false,
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();

const backgroundGroup = new THREE.Group();
scene.add(backgroundGroup);

const textureLoader = new THREE.TextureLoader();
const projectedPosition = new THREE.Vector3();

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.z = 10;

camera.lookAt(0, 0, 0);

const backgroundMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  toneMapped: false,
});

const backgroundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  backgroundMaterial,
);

backgroundGroup.add(backgroundMesh);

const easterEggAnchor = new THREE.Object3D();
backgroundGroup.add(easterEggAnchor);

let targetOriginX = 0;
let targetOriginY = 0;

let currentOriginX = 0;
let currentOriginY = 0;

// nyesuain ukuran plane dengan viewport
// gambar tetap menggunakan prinsip objet-fit-cover.
function fitBackgroundToViewport() {
  const image = backgroundMaterial.map?.image;

  if (!image?.width || !image?.height) {
    return;
  }

  const width = Math.max(background.clientWidth, 1);
  const height = Math.max(background.clientHeight, 1);

  const imageAspect = image.width / image.height;
  const viewportAspect = width / height;

  let planeWidth;
  let planeHeight;

  if (imageAspect > viewportAspect) {
    planeHeight = height;
    planeWidth = height * imageAspect;
  } else {
    planeWidth = width;
    planeHeight = width / imageAspect;
  }

  backgroundMesh.scale.set(planeWidth, planeHeight, 1);

  // posisi anchor mengikuti kordinat gambar
  easterEggAnchor.position.set(
    (easterEggUV.x - 0.5) * planeWidth,
    (0.5 - easterEggUV.y) * planeHeight,
    0.01,
  );
}

//  membuat gambar background
// call back di jalankan setelah benar benar siap
function setBackground(src, onLoad = null) {
  const requestId = ++textureRequestId;

  textureLoader.load(
    src,
    (texture) => {
      if (requestId !== textureRequestId) {
        texture.dispose();
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const previousTexture = backgroundMaterial.map;

      backgroundMaterial.map = texture;
      backgroundMaterial.needsUpdate = true;

      fitBackgroundToViewport();

      if (previousTexture) {
        previousTexture.dispose();
      }
      if (onLoad) {
        onLoad();
      }
    },
    undefined,
    (error) => {
      console.error(`Failed to load background: ${src}`, error);
    },
  );
}

// menemppatkan posisi tanda tanya berdasarkan proyeksi anchor three.js
function updateEasterEggPosition() {
  scene.updateMatrixWorld(true);

  easterEggAnchor.getWorldPosition(projectedPosition).project(camera);

  const canvasRect = background.getBoundingClientRect();
  const containerRect = imageContainer.getBoundingClientRect();
  if (!canvasRect.width || !canvasRect.height) {
    return;
  }

  const screenX =
    canvasRect.left + (projectedPosition.x + 1) * 0.5 * canvasRect.width;

  const screenY =
    canvasRect.top + (1 - projectedPosition.y) * 0.5 * canvasRect.height;

  easterEeg.style.left = `${screenX - containerRect.left}px`;
  easterEeg.style.top = `${screenY - containerRect.top}px`;
}

function resizeScene() {
  const width = Math.max(background.clientWidth, 1);
  const height = Math.max(background.clientHeight, 1);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  renderer.setSize(width, height, false);

  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;

  camera.updateProjectionMatrix();

  fitBackgroundToViewport();
  updateEasterEggPosition();
}

if ("ResizeObserver" in window) {
  const backgroundResizeObserver = new ResizeObserver(() => {
    resizeScene();
  });

  backgroundResizeObserver.observe(background);
}

// pergerakan zoom
function setTargetOrigin(horizontal, vertical) {
  const horizontalPositions = {
    left: -0.5,
    center: 0,
    right: 0.5,
  };

  const verticalPositions = {
    top: 0.5,
    center: 0,
    bottom: -0.5,
  };

  targetOriginX = horizontalPositions[horizontal] ?? 0;
  targetOriginY = verticalPositions[vertical] ?? 0;
}

function updateBackgroundTransform(deltaTime) {
  const width = background.clientWidth;
  const height = background.clientHeight;

  // zoom langsung ketika foto ending siap
  // biar tidak ada animasi zoom-in  saat foto berganti
  const zoom = background.classList.contains("final") ? 1.8 : 1;

  // interpolasi membuat perpindahan titik zoom lebih halus
  const smoothing = 1 - Math.exp(-8 * deltaTime);

  currentOriginX += (targetOriginX - currentOriginX) * smoothing;

  currentOriginY += (targetOriginY - currentOriginY) * smoothing;

  const anchorX = currentOriginX * width;
  const anchorY = currentOriginY * height;

  backgroundGroup.scale.set(zoom, zoom, 1);

  backgroundGroup.position.set(anchorX * (1 - zoom), anchorY * (1 - zoom), 0);
}

let previousFrameTime = 0;

function animateBackground(timestamp) {
  // kalo lagi ending gak usah render three.js
  if (endingSequence) {
    return;
  }

  const deltaTime =
    previousFrameTime === 0
      ? 0
      : Math.min((timestamp - previousFrameTime) / 1000, 0.05);

  previousFrameTime = timestamp;

  updateBackgroundTransform(deltaTime);

  renderer.render(scene, camera);
  if (
    background.classList.contains("final") &&
    easterEeg.classList.contains("show")
  ) {
    updateEasterEggPosition();
  }
  requestAnimationFrame(animateBackground);
}

resizeScene();
requestAnimationFrame(animateBackground);

// lain text
function stopLainText() {
  clearTimeout(lainFirstTimer);
  clearInterval(lainTimer);
  clearTimeout(lainHideTimer);

  lainFirstTimer = null;
  lainTimer = null;
  lainHideTimer = null;

  lain.classList.remove("show");
}

function showLain() {
  if (audio.paused || endingSequence) {
    return;
  }

  // mulai uang animasi kalo sebelumnya masih berjalan
  void lain.offsetWidth;

  lain.classList.add("show");

  lainHideTimer = setTimeout(() => {
    lain.classList.remove("show");
    lainHideTimer = null;
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

// sengaja di kunci gambar utama/lain, saat ending biar saat animasi dan audio ending gak bisa di ganggu,
//  sampe selesai baru bisa di klik lagi
function lockCenterImage() {
  imageContainer.classList.add("ending-audio");

  toggle.disabled = true;

  label.classList.remove("locked");
}
// pas audionya selesai bakal di unlock
function unlockCenterImage() {
  toggle.disabled = false;

  imageContainer.classList.remove("ending-audio");

  toggleLocked = false;

  clearTimeout(toggleLockedTimer);
  toggleLockedTimer = null;
}

// Stop Adudio saat mencapai batas
audio.addEventListener("timeupdate", () => {
  if (audio.currentTime < 162.1 || endingSequence) {
    return;
  }

  endingSequence = true;
  abstractAudioStarted = false;

  lockCenterImage();

  audio.pause();

  audio.currentTime = 0;

  toggle.checked = false;

  stopLainText();

  abstractAudio.volume = 0.4;
  abstractAudio.currentTime = 0;
  abstractAudio.playbackRate = 1;

  endBackground();

  clearTimeout(endingUnlockTimer);

  endingUnlockTimer = setTimeout(() => {
    endingUnlockTimer = null;
    unlockCenterImage();
  }, 2000);

  abstractAudioStarted = true;

  const playback = abstractAudio.play();

  // jika browser menolak perputaran audio
  // jangan biarkan kontrol utama terkunci selamanya
  if (playback) {
    playback.catch((error) => {
      console.error("Failed to play ending audio:", error);

      abstractAudioStarted = false;
      finishEndingSequence();
    });
  }
});

// tunggu audio sampe selesai, bukan sekedar menunggu sampe selesai
abstractAudio.addEventListener("ended", () => {
  if (!endingSequence) {
    return;
  }

  abstractAudioStarted = false;
  finishEndingSequence();
});

function finishEndingSequence() {
  if (!endingSequence) {
    return;
  }

  clearTimeout(endingUnlockTimer);
  endingUnlockTimer = null;

  // menghentikan semua timer background
  clearBackgroundTimers();

  // reset audio
  audio.pause();
  audio.currentTime = 0;

  abstractAudio.pause();
  abstractAudio.currentTime = 0;

  toggle.checked = false;
  stopLainText();

  // reset eastereeg
  easterEeg.classList.remove("show");
  easterContent.classList.remove("show");

  easterEeg.style.opacity = "";
  easterEeg.style.pointerEvents = "";

  backgroundIndex = 0;

  background.classList.remove("ending", "flash", "change", "final");
  // layar tetap gelap saat endingg
  background.classList.add("hidden");

  // reset posisi zoom
  targetOriginX = 0;
  targetOriginY = 0;

  currentOriginX = 0;
  currentOriginY = 0;

  backgroundGroup.scale.set(1, 1, 1);
  backgroundGroup.position.set(0, 0, 0);

  abstractAudioStarted = false;

  endingSequence = false;

  previousFrameTime = 0;
  requestAnimationFrame(animateBackground);

  unlockCenterImage();
}

const image2 = label.querySelector(".image2");

//play audio
toggle.addEventListener("change", () => {
  if (toggle.disabled) {
    toggle.checked = false;
    return;
  }

  if (toggleLocked) {
    toggle.checked = true;
    return;
  }

  if (toggle.checked) {
    if (endingSequence) {
      clearTimeout(endingUnlockTimer);
      endingUnlockTimer = null;

      clearBackgroundTimers();

      endingSequence = false;

      abstractAudio.pause();
      abstractAudio.currentTime = 0;
      abstractAudioStarted = false;

      background.classList.remove("ending", "flash", "change", "final");
      background.classList.add("hidden");

      previousFrameTime = 0;
      requestAnimationFrame(animateBackground);
    }

    easterEeg.style.opacity = "";
    easterEeg.style.pointerEvents = "";

    toggleLocked = true;
    image2
      .decode()
      .catch((error) => {
        console.warn("Image 2 decode failed", error);
      })
      .then(() => {
        if (!toggle.checked || endingSequence) {
          return;
        }
        audio.currentTime = 101.2;
        audio.playbackRate = 1;

        const playback = audio.play();
        if (playback) {
          playback.catch((error) => {
            console.error("Failed to play main audio", error);

            audio.pause();
            audio.currentTime = 0;
            toggle.checked = false;

            toggleLocked = false;

            clearTimeout(toggleLockedTimer);
            toggleLockedTimer = null;

            label.classList.remove("locked");

            stopLainText();
            clearBackgroundTimers();
          });
        }
      });

    startLainText();
    startBackground();

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
    CameraFlash.play().catch((error) => {
      console.error("Failed to play camera flash:", error);
    });

    audio.pause();
    audio.currentTime = 0;

    stopLainText();
    flashBackground();
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

// easter contetnt
eastertoggle.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  easterContent.classList.toggle("show");
});

// background slideshow
function clearBackgroundTimers() {
  clearInterval(backgroundTimer);
  clearTimeout(backgroundFadeTimer);
  clearTimeout(backgroundEndTimer);
  clearTimeout(flashTimer);

  backgroundTimer = null;
  backgroundFadeTimer = null;
  backgroundEndTimer = null;
  flashTimer = null;
}

// start
function startBackground() {
  clearBackgroundTimers();

  background.classList.remove("ending", "flash", "change", "final");
  background.classList.add("hidden");

  backgroundIndex = 0;

  targetOriginX = 0;
  targetOriginY = 0;

  currentOriginX = 0;
  currentOriginY = 0;

  setBackground(backgrounds[0], () => {
    if (toggle.checked && !audio.paused && !endingSequence) {
      background.classList.remove("hidden");
    }
  });

  backgroundTimer = setInterval(() => {
    // kalo paused , jangan mulai pergantian
    if (audio.paused || endingSequence) {
      return;
    }

    backgroundFadeTimer = setTimeout(() => {
      // if fade audio di paused jangan tampilin gambar berikutnya
      if (audio.paused || endingSequence) {
        return;
      }

      const nextIndex = backgroundIndex + 1;

      if (nextIndex >= backgrounds.length) {
        clearInterval(backgroundTimer);
        backgroundTimer = null;
        return;
      }

      backgroundIndex = nextIndex;

      if (backgroundIndex === backgrounds.length - 1) {
        // foto ending di muat terlebih dahulu
        // class final baru di terapkan setelah texture siap
        // jadi, foto baru langsung tampil dalam keaddan zoom
        setBackground(backgrounds[backgroundIndex], () => {
          if (
            backgroundIndex === backgrounds.length - 1 &&
            !audio.paused &&
            !endingSequence
          ) {
            background.classList.add("final");
          }
        });
        clearInterval(backgroundTimer);
        backgroundTimer = null;
      } else {
        setBackground(backgrounds[backgroundIndex]);
      }

      background.classList.remove("change");

      backgroundFadeTimer = null;
    }, 1000);
  }, 8000);
}

//end
function endBackground() {
  clearBackgroundTimers();
  textureRequestId++;

  easterEeg.classList.remove("show");

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
  clearBackgroundTimers();
  textureRequestId++;

  easterEeg.classList.remove("show");

  //bersihin semua effek
  background.classList.remove("hidden", "ending", "flash", "final");

  // animasi di paksa ulang
  void background.offsetWidth;

  //  flash
  background.classList.add("flash");

  //setelah 800ms gelap
  flashTimer = setTimeout(() => {
    background.classList.remove("flash");
    background.classList.add("hidden");

    backgroundIndex = 0;

    targetOriginX = 0;
    targetOriginY = 0;

    currentOriginX = 0;
    currentOriginY = 0;

    setBackground(backgrounds[0]);

    flashTimer = null;
  }, 800);
}

document.addEventListener("touchcancel", () => {
  if (!audio.paused) audio.playbackRate = 1;
});

// mouse /pointer interaction
document.addEventListener("mousemove", (e) => {
  if (endingSequence) {
    return;
  }

  if (
    !background.classList.contains("final") ||
    background.classList.contains("hidden") ||
    background.classList.contains("ending") ||
    background.classList.contains("flash")
  ) {
    easterEeg.classList.remove("show");

    return;
  }
  const rect = background.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  if (x < 0.33 && y > 0.66) {
    setTargetOrigin("left", "bottom");
    easterEeg.classList.remove("show");
  } else if (x > 0.6 && y > 0.5) {
    setTargetOrigin("right", "bottom");
    easterEeg.classList.add("show");
  } else if (x < 0.33) {
    setTargetOrigin("left", "center");
    easterEeg.classList.remove("show");
  } else if (x > 0.66) {
    setTargetOrigin("right", "center");
    easterEeg.classList.remove("show");
  } else {
    setTargetOrigin("center", "center");
    easterEeg.classList.remove("show");
  }
});
// load background awal
setBackground(backgrounds[0]);
