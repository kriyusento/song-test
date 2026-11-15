/* ============================================================
   AURORA MUSIC — PLAYER LOGIC (FIXED)
   ============================================================ */

/* ------------------------------------------------------------
   KONFIGURASI PLAYLIST
   ------------------------------------------------------------ */
const SONGS = [
  {
    title: "Golden Hour",
    artist: "JVKE",
    src: "assets/music/golden hour.mp3",
    cover: "assets/covers/cover1.jpg",
  },
  {
    title: "Ordinary",
    artist: "Alex Warren",
    src: "assets/music/ordinary.mp3",
    cover: "assets/covers/ordinary.jpg",
  },
  {
    title: "Hong Kong",
    artist: "The Weeknd",
    src: "assets/music/hong-kong.mp3",
    cover: "assets/covers/hong-kong.jpg",
  },
  {
    title: "Skyfall",
    artist: "Adele",
    src: "assets/music/skyfall.mp3",
    cover: "assets/covers/skyfall.jpg",
  },
  {
    title: "海嶼妳",
    artist: "馬也_Crabbit / Cole先生",
    src: "assets/music/海嶼妳.mp3",
    cover: "assets/covers/海嶼妳.jpg",
  },
  {
    title: "我走後",
    artist: "en",
    src: "assets/music/我走後.mp3",
    cover: "assets/covers/我走後.jpg",
  },
  {
    title: "Die For You",
    artist: "Adele",
    src: "assets/music/Die For You.mp3",
    cover: "assets/covers/Die For You.jpg",
  },
];

/* Cover default */
const DEFAULT_COVER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1db954"/><stop offset="100%" stop-color="#8a2be2"/>
      </linearGradient></defs>
      <rect width="400" height="400" fill="#121212"/>
      <circle cx="200" cy="200" r="130" fill="none" stroke="url(#g)" stroke-width="3" opacity="0.5"/>
      <circle cx="200" cy="200" r="90" fill="none" stroke="url(#g)" stroke-width="3" opacity="0.4"/>
      <circle cx="200" cy="200" r="22" fill="url(#g)"/>
      <path d="M200 70v260M70 200h260" stroke="url(#g)" stroke-width="2" opacity="0.15"/>
    </svg>`
  );

const BASE_TITLE = "Aurora Music";

/* ------------------------------------------------------------
   STATE
   ------------------------------------------------------------ */
const state = {
  currentIndex: -1,
  isPlaying: false,
  shuffle: false,
  repeat: "off", // off | all | one
  muted: false,
  volume: 0.8,
  liked: new Set(),
  shuffleQueue: [],
  shufflePointer: 0,
  view: "home",
  errorStreak: 0,
  seeking: false,
};

let errorTimer = null;
let bgToken = 0;

/* ------------------------------------------------------------
   DOM
   ------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);

const audio = $("audio");
const bgImage = $("bgImage");
const bgVideo = $("bgVideo");
const hero = $("hero");
const heroTitle = $("heroTitle");
const heroArtist = $("heroArtist");
const heroCover = $("heroCover");
const heroPlay = $("heroPlay");
const heroShuffle = $("heroShuffle");
const trackList = $("trackList");
const sidebarPlaylist = $("sidebarPlaylist");
const trackCount = $("trackCount");
const totalDurationEl = $("totalDuration");
const playerCover = $("playerCover");
const playerTitle = $("playerTitle");
const playerArtist = $("playerArtist");
const shuffleBtn = $("shuffleBtn");
const prevBtn = $("prevBtn");
const playBtn = $("playBtn");
const nextBtn = $("nextBtn");
const repeatBtn = $("repeatBtn");
const currentTimeEl = $("currentTime");
const progressBar = $("progressBar");
const durationEl = $("duration");
const muteBtn = $("muteBtn");
const volumeBar = $("volumeBar");
const menuBtn = $("menuBtn");
const sidebar = $("sidebar");
const overlay = $("overlay");
const likeBtn = $("likeBtn");
const playIcon = $("playIcon");
const repeatIcon = $("repeatIcon");
const volumeIcon = $("volumeIcon");
const pageTitle = $("pageTitle");
const sectionTitle = $("sectionTitle");

/* SVG paths */
const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  repeatAll: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  repeatOne: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",
  volUp: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  volMute: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  heartFull: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  heartOutline: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
};

/* ------------------------------------------------------------
   UTIL
   ------------------------------------------------------------ */
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";

  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateRangeFill(input, ratio) {
  const pct = Math.max(0, Math.min(1, ratio || 0)) * 100;

  input.style.background = `linear-gradient(to right,
    var(--accent) 0%, var(--accent) ${pct}%,
    rgba(255,255,255,0.2) ${pct}%, rgba(255,255,255,0.2) 100%)`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]
  );
}

/* Pasang cover dengan fallback (tanpa loop error tak berujung) */
function setCover(img, src) {
  img.onerror = () => {
    img.onerror = null;
    img.src = DEFAULT_COVER;
  };
  img.src = src || DEFAULT_COVER;
}

/* ------------------------------------------------------------
   PREFS
   ------------------------------------------------------------ */
function loadPrefs() {
  try {
    const v = parseFloat(localStorage.getItem("aurora.volume"));

    if (!isNaN(v)) {
      state.volume = Math.max(0, Math.min(1, v));
    }

    state.shuffle = localStorage.getItem("aurora.shuffle") === "true";

    const rep = localStorage.getItem("aurora.repeat");
    state.repeat = ["off", "all", "one"].includes(rep) ? rep : "off";

    const liked = JSON.parse(localStorage.getItem("aurora.liked") || "[]");

    if (Array.isArray(liked)) {
      state.liked = new Set(
        liked.filter((n) => Number.isInteger(n) && n >= 0 && n < SONGS.length)
      );
    }
  } catch (e) {
    console.warn("Prefs load error:", e);
  }

  audio.volume = state.volume;
  volumeBar.value = state.volume;
  updateRangeFill(volumeBar, state.volume);
}

function savePrefs() {
  try {
    localStorage.setItem("aurora.volume", state.volume);
    localStorage.setItem("aurora.shuffle", state.shuffle);
    localStorage.setItem("aurora.repeat", state.repeat);
    localStorage.setItem("aurora.liked", JSON.stringify([...state.liked]));
  } catch (e) {
    console.warn("Could not save preferences:", e);
  }
}

/* ------------------------------------------------------------
   RENDER PLAYLIST
   ------------------------------------------------------------ */
function renderAll() {
  sidebarPlaylist.innerHTML = "";

  SONGS.forEach((song, i) => {
    const li = document.createElement("li");

    li.className = "sidebar-item";
    li.dataset.index = i;

    li.innerHTML = `
      <div class="si-title">${escapeHtml(song.title)}</div>
      <div class="si-artist">${escapeHtml(song.artist)}</div>
    `;

    li.addEventListener("click", () => {
      playTrack(i);
      closeSidebar();
    });

    sidebarPlaylist.appendChild(li);
  });

  trackList.innerHTML = "";

  SONGS.forEach((song, i) => {
    const li = document.createElement("li");

    li.className = "track-item";
    li.dataset.index = i;

    li.innerHTML = `
      <span class="track-num">${i + 1}</span>

      <img class="track-cover" alt="" loading="lazy">

      <div class="track-meta">
        <div class="track-title">${escapeHtml(song.title)}</div>
        <div class="track-artist">${escapeHtml(song.artist)}</div>
      </div>

      <span class="track-duration" data-dur="${i}">—:—</span>

      <button class="track-like" data-like="${i}" aria-label="Suka">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="${ICONS.heartFull}" fill="currentColor"/>
        </svg>
      </button>
    `;

    setCover(li.querySelector(".track-cover"), song.cover);

    li.addEventListener("click", (e) => {
      if (e.target.closest(".track-like")) return;
      playTrack(i);
    });

    const likeBtnEl = li.querySelector(".track-like");

    likeBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(i);
    });

    likeBtnEl.classList.toggle("liked", state.liked.has(i));

    trackList.appendChild(li);
  });

  const empty = document.createElement("li");

  empty.className = "track-empty hidden";
  empty.id = "trackEmpty";
  empty.textContent = "Belum ada lagu yang disukai.";
  trackList.appendChild(empty);

  trackCount.textContent = `${SONGS.length} lagu`;

  preloadDurations();
  updatePlaybackUI();
  applyView();
}

function preloadDurations() {
  const durations = new Array(SONGS.length).fill(0);

  SONGS.forEach((song, i) => {
    const t = new Audio();

    t.preload = "metadata";
    t.src = song.src;

    t.addEventListener("loadedmetadata", () => {
      durations[i] = isFinite(t.duration) ? t.duration : 0;

      const el = document.querySelector(`[data-dur="${i}"]`);

      if (el) el.textContent = formatTime(durations[i]);

      const total = durations.reduce((a, b) => a + b, 0);

      totalDurationEl.textContent = "Total " + formatTime(total);
    });

    t.addEventListener("error", () => {
      const el = document.querySelector(`[data-dur="${i}"]`);

      if (el) el.textContent = "--:--";

      const row = document.querySelector(`.track-item[data-index="${i}"]`);

      if (row) row.classList.add("error");
    });
  });
}

/* ------------------------------------------------------------
   VIEW (Beranda / Pustaka / Disukai)
   ------------------------------------------------------------ */
function applyView() {
  const view = state.view;
  let visible = 0;

  document.querySelectorAll(".track-item").forEach((row, i) => {
    const show = view !== "liked" || state.liked.has(i);

    row.classList.toggle("hidden", !show);

    if (show) visible++;
  });

  const empty = $("trackEmpty");

  if (empty) empty.classList.toggle("hidden", visible > 0);

  hero.classList.toggle("hidden", view !== "home");

  pageTitle.textContent =
    view === "home" ? "Beranda" : view === "library" ? "Pustaka" : "Disukai";

  sectionTitle.textContent = view === "liked" ? "Lagu Disukai" : "Daftar Lagu";
}

/* ------------------------------------------------------------
   BACKGROUND (gambar ATAU video)
   ------------------------------------------------------------ */
const isVideoSrc = (p) => /\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(p || "");

function clearBgVideo() {
  bgVideo.style.opacity = "0";
  bgVideo.pause();

  if (bgVideo.getAttribute("src")) {
    bgVideo.removeAttribute("src");
    bgVideo.load();
  }
}

function setBackground(src) {
  const token = ++bgToken; // abaikan hasil lama jika lagu berganti cepat

  if (!src) {
    bgImage.style.opacity = "0";
    clearBgVideo();
    return;
  }

  if (isVideoSrc(src)) {
    bgImage.style.opacity = "0";
    bgVideo.muted = true;

    bgVideo.onloadeddata = () => {
      if (token !== bgToken) return;

      bgVideo.style.opacity = "1";

      if (!audio.paused) bgVideo.play().catch(() => {});
    };

    bgVideo.onerror = () => {
      if (token !== bgToken) return;

      bgVideo.style.opacity = "0";
    };

    bgVideo.src = src;
    bgVideo.load();
    return;
  }

  clearBgVideo();

  const img = new Image();

  img.onload = () => {
    if (token !== bgToken) return;

    bgImage.style.backgroundImage = `url("${src}")`;
    bgImage.style.opacity = "1";
  };

  img.onerror = () => {
    if (token !== bgToken) return;

    bgImage.style.opacity = "0";
  };

  img.src = src;
}

/* ------------------------------------------------------------
   PLAYBACK
   ------------------------------------------------------------ */
function playTrack(index) {
  if (index < 0 || index >= SONGS.length) return;

  clearTimeout(errorTimer);

  state.currentIndex = index;
  state.seeking = false;

  /* Sinkronkan antrean acak dengan lagu yang dipilih */
  if (state.shuffle) {
    const p = state.shuffleQueue.indexOf(index);

    if (p === -1 || state.shuffleQueue.length !== SONGS.length) {
      buildShuffleQueue(index);
    } else {
      state.shufflePointer = p;
    }
  }

  const song = SONGS[index];

  audio.src = song.src;
  audio.load();

  setCover(playerCover, song.cover);
  setCover(heroCover, song.cover);

  playerTitle.textContent = song.title;
  playerArtist.textContent = song.artist;

  heroTitle.textContent = song.title;
  heroArtist.textContent = song.artist;

  document.title = `${song.title} — ${song.artist} · ${BASE_TITLE}`;

  /* Reset progress */
  progressBar.value = 0;
  updateRangeFill(progressBar, 0);
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";

  setBackground(song.background);

  document.querySelectorAll(".sidebar-item").forEach((el, i) => {
    el.classList.toggle("playing", i === index);
  });

  document.querySelectorAll(".track-item").forEach((el, i) => {
    el.classList.toggle("playing", i === index);
    if (i === index) el.classList.remove("error");
  });

  updateLikeUI(index);

  const attempt = audio.play();

  if (attempt && attempt.catch) {
    attempt.catch((err) => {
      if (err && err.name === "AbortError") return; // pergantian lagu cepat
      console.warn("Play failed:", err);
      setIsPlaying(false);
    });
  }
}

function togglePlay() {
  if (state.currentIndex < 0) {
    if (SONGS.length > 0) {
      playTrack(state.shuffle ? Math.floor(Math.random() * SONGS.length) : 0);
    }
    return;
  }

  if (audio.paused) {
    resumeAudioContext();

    const p = audio.play();

    if (p && p.catch) {
      p.catch((e) => {
        if (e && e.name !== "AbortError") console.warn(e);
      });
    }
  } else {
    audio.pause();
  }
}

/* Antrean acak: queue[0] = lagu mulai, sisanya diacak */
function buildShuffleQueue(start = state.currentIndex) {
  const indices = SONGS.map((_, i) => i).filter((i) => i !== start);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  if (start >= 0 && start < SONGS.length) indices.unshift(start);

  state.shuffleQueue = indices;
  state.shufflePointer = 0;
}

function ensureShuffleQueue() {
  if (
    state.shuffleQueue.length !== SONGS.length ||
    state.shuffleQueue[state.shufflePointer] !== state.currentIndex
  ) {
    buildShuffleQueue(state.currentIndex);
  }
}

function nextTrack(auto = false, skipRepeatOne = false) {
  if (SONGS.length === 0) return;

  if (auto && !skipRepeatOne && state.repeat === "one") {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return;
  }

  let next;

  if (state.shuffle) {
    ensureShuffleQueue();

    if (state.currentIndex < 0) {
      next = state.shuffleQueue[0];
    } else if (state.shufflePointer >= state.shuffleQueue.length - 1) {
      if (auto && state.repeat === "off") {
        setIsPlaying(false);
        audio.pause();
        return;
      }

      /* Putaran baru: lagu pertama harus BERBEDA dari yang baru diputar */
      buildShuffleQueue(state.currentIndex);
      state.shufflePointer = Math.min(1, state.shuffleQueue.length - 1);
      next = state.shuffleQueue[state.shufflePointer];
    } else {
      state.shufflePointer++;
      next = state.shuffleQueue[state.shufflePointer];
    }
  } else {
    next = state.currentIndex + 1;

    if (next >= SONGS.length) {
      if (auto && state.repeat === "off") {
        setIsPlaying(false);
        audio.pause();
        return;
      }

      next = 0;
    }
  }

  playTrack(next);
}

function prevTrack() {
  if (SONGS.length === 0) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  let prev;

  if (state.shuffle) {
    ensureShuffleQueue();

    prev =
      state.shufflePointer > 0
        ? state.shuffleQueue[state.shufflePointer - 1]
        : state.shuffleQueue[state.shuffleQueue.length - 1];
  } else {
    prev = state.currentIndex - 1;

    if (prev < 0) prev = SONGS.length - 1;
  }

  playTrack(prev);
}

function setIsPlaying(v) {
  state.isPlaying = v;

  const d = v ? ICONS.pause : ICONS.play;
  const label = v ? "Jeda" : "Putar";

  playIcon.querySelector("path").setAttribute("d", d);
  playBtn.setAttribute("aria-label", label);
  playBtn.title = label;

  /* Tombol "Putar" di hero ikut berubah */
  heroPlay.querySelector("path").setAttribute("d", d);
  heroPlay.querySelector("span").textContent = label;
}

function updatePlaybackUI() {
  setIsPlaying(!audio.paused && !!audio.getAttribute("src"));

  shuffleBtn.classList.toggle("active", state.shuffle);
  repeatBtn.classList.toggle("active", state.repeat !== "off");

  repeatIcon
    .querySelector("path")
    .setAttribute("d", state.repeat === "one" ? ICONS.repeatOne : ICONS.repeatAll);

  const repLabel =
    state.repeat === "one"
      ? "Ulangi satu lagu"
      : state.repeat === "all"
      ? "Ulangi semua"
      : "Ulangi";

  repeatBtn.title = repLabel;
  repeatBtn.setAttribute("aria-label", repLabel);

  updateLikeUI(state.currentIndex);
}

function updateLikeUI(index) {
  const liked = index >= 0 && state.liked.has(index);

  likeBtn.classList.toggle("liked", liked);

  likeBtn
    .querySelector("path")
    .setAttribute("d", liked ? ICONS.heartFull : ICONS.heartOutline);
}

function toggleLike(index) {
  if (index < 0 || index >= SONGS.length) return;

  if (state.liked.has(index)) {
    state.liked.delete(index);
  } else {
    state.liked.add(index);
  }

  document.querySelectorAll(".track-like").forEach((el) => {
    if (parseInt(el.dataset.like, 10) === index) {
      el.classList.toggle("liked", state.liked.has(index));
    }
  });

  updateLikeUI(state.currentIndex);
  applyView(); // di tab "Disukai", baris langsung hilang/muncul
  savePrefs();
}

/* ------------------------------------------------------------
   AUDIO EVENTS
   ------------------------------------------------------------ */
audio.addEventListener("play", () => {
  setIsPlaying(true);
  resumeAudioContext();

  if (bgVideo.getAttribute("src")) bgVideo.play().catch(() => {});
});

audio.addEventListener("playing", () => {
  state.errorStreak = 0;
});

audio.addEventListener("pause", () => {
  setIsPlaying(false);

  bgVideo.pause();
});

function syncDuration() {
  durationEl.textContent = formatTime(audio.duration);
}

audio.addEventListener("loadedmetadata", syncDuration);
audio.addEventListener("durationchange", syncDuration);

audio.addEventListener("timeupdate", () => {
  if (state.seeking) return; // jangan "melawan" slider saat digeser

  if (audio.duration && isFinite(audio.duration)) {
    const ratio = audio.currentTime / audio.duration;

    progressBar.value = ratio * 100;
    updateRangeFill(progressBar, ratio);

    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener("ended", () => {
  nextTrack(true);
});

audio.addEventListener("error", () => {
  if (state.currentIndex < 0) return;

  const idx = state.currentIndex;

  console.warn("Audio error on track", idx);

  const row = document.querySelector(`.track-item[data-index="${idx}"]`);

  if (row) row.classList.add("error");

  setIsPlaying(false);

  state.errorStreak++;

  /* Lompat ke lagu berikutnya, tapi berhenti jika semua lagu rusak
     (sebelumnya bisa looping tanpa henti saat repeat = all/one) */
  if (SONGS.length > 1 && state.errorStreak < SONGS.length) {
    clearTimeout(errorTimer);

    errorTimer = setTimeout(() => {
      if (state.currentIndex === idx) nextTrack(true, true);
    }, 1200);
  }
});

/* ------------------------------------------------------------
   CONTROLS
   ------------------------------------------------------------ */
playBtn.addEventListener("click", togglePlay);

prevBtn.addEventListener("click", prevTrack);

nextBtn.addEventListener("click", () => nextTrack(false));

shuffleBtn.addEventListener("click", () => {
  state.shuffle = !state.shuffle;

  if (state.shuffle) buildShuffleQueue();

  updatePlaybackUI();
  savePrefs();
});

repeatBtn.addEventListener("click", () => {
  state.repeat =
    state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";

  updatePlaybackUI();
  savePrefs();
});

function toggleMute() {
  state.muted = !state.muted;

  audio.muted = state.muted;

  updateVolumeIcon();
}

muteBtn.addEventListener("click", toggleMute);

function updateVolumeIcon() {
  const muted = state.muted || audio.volume === 0;

  volumeIcon
    .querySelector("path")
    .setAttribute("d", muted ? ICONS.volMute : ICONS.volUp);

  muteBtn.title = muted ? "Aktifkan suara" : "Bisukan";
  muteBtn.setAttribute("aria-label", muteBtn.title);
}

volumeBar.addEventListener("input", () => {
  state.volume = parseFloat(volumeBar.value);

  audio.volume = state.volume;
  state.muted = state.volume === 0;
  audio.muted = state.muted;

  updateRangeFill(volumeBar, state.volume);
  updateVolumeIcon();

  savePrefs();
});

progressBar.addEventListener("input", () => {
  state.seeking = true;

  if (audio.duration && isFinite(audio.duration)) {
    const t = (progressBar.value / 100) * audio.duration;

    currentTimeEl.textContent = formatTime(t);

    updateRangeFill(progressBar, progressBar.value / 100);
  }
});

progressBar.addEventListener("change", () => {
  if (audio.duration && isFinite(audio.duration)) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }

  state.seeking = false;
});

heroPlay.addEventListener("click", togglePlay);

heroShuffle.addEventListener("click", () => {
  state.shuffle = true;

  if (SONGS.length > 0) {
    playTrack(Math.floor(Math.random() * SONGS.length)); // antrean disinkronkan di playTrack
  }

  updatePlaybackUI();
  savePrefs();
});

likeBtn.addEventListener("click", () => {
  if (state.currentIndex >= 0) toggleLike(state.currentIndex);
});

/* ------------------------------------------------------------
   MOBILE SIDEBAR
   ------------------------------------------------------------ */
menuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("active");
});

overlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
}

/* ------------------------------------------------------------
   NAVIGATION
   ------------------------------------------------------------ */
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.remove("active");
    });

    btn.classList.add("active");

    state.view = btn.dataset.view;

    closeSidebar();
    applyView();
  });
});

/* ------------------------------------------------------------
   KEYBOARD SHORTCUTS
   ------------------------------------------------------------ */
document.addEventListener("keydown", (e) => {
  const t = e.target;
  const tag = t.tagName;

  /* Abaikan hanya saat mengetik; slider (range) tidak menghalangi shortcut */
  if (
    tag === "TEXTAREA" ||
    t.isContentEditable ||
    (tag === "INPUT" && t.type !== "range")
  ) {
    return;
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.code === "Space") {
    if (tag === "BUTTON") return; // biarkan tombol yang fokus bekerja normal

    e.preventDefault();

    if (!e.repeat) togglePlay();
  } else if (e.code === "ArrowRight" && e.shiftKey) {
    nextTrack(false);
  } else if (e.code === "ArrowLeft" && e.shiftKey) {
    prevTrack();
  } else if (e.code === "KeyM") {
    toggleMute();
  } else if (e.code === "Escape") {
    closeSidebar();
  }
});

/* ------------------------------------------------------------
   VISUALIZER (WEB AUDIO API)
   ------------------------------------------------------------ */
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let dataArray = null;

let vizCanvas;
let vizCtx;
let vizRAF = null;

function setupAudioContext() {
  if (audioCtx) return;

  /* Dari file://, browser menganggap audio "cross-origin" sehingga
     createMediaElementSource() membuat suara MENJADI SENYAP.
     Jadi visualizer hanya diaktifkan lewat http(s). */
  if (!/^https?:$/.test(location.protocol)) {
    console.info("Visualizer dinonaktifkan (jalankan lewat http/https).");
    return;
  }

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;

    if (!Ctx) return;

    audioCtx = new Ctx();

    analyser = audioCtx.createAnalyser();

    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    sourceNode = audioCtx.createMediaElementSource(audio);

    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    if (!vizRAF) drawVisualizer();
  } catch (e) {
    console.warn("Visualizer unavailable:", e);

    /* Pastikan suara tetap keluar bila rantai gagal di tengah */
    try {
      if (sourceNode && audioCtx) sourceNode.connect(audioCtx.destination);
    } catch (_) {}
  }
}

function resumeAudioContext() {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch((e) => {
      console.warn("AudioContext resume failed:", e);
    });
  }
}

function drawVisualizer() {
  if (!vizCanvas || !vizCtx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const w = vizCanvas.clientWidth;
  const h = vizCanvas.clientHeight;

  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);

  /* Bandingkan dengan nilai yang dibulatkan (sebelumnya pecahan
     membuat canvas di-reset setiap frame) */
  if (vizCanvas.width !== pw || vizCanvas.height !== ph) {
    vizCanvas.width = pw;
    vizCanvas.height = ph;

    vizCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  vizCtx.clearRect(0, 0, w, h);

  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);

    const bars = dataArray.length;
    const barW = w / bars;

    for (let i = 0; i < bars; i++) {
      const v = dataArray[i] / 255;

      const barH = v * h * 0.65;

      const x = i * barW;
      const y = h - barH;

      const hue = 140 + (i / bars) * 120;

      const grad = vizCtx.createLinearGradient(0, y, 0, h);

      grad.addColorStop(0, `hsla(${hue}, 85%, 60%, ${0.85 * v})`);
      grad.addColorStop(1, `hsla(${hue}, 85%, 40%, 0.05)`);

      vizCtx.fillStyle = grad;

      vizCtx.fillRect(x + 1, y, Math.max(barW - 2, 1), barH);
    }
  }

  vizRAF = requestAnimationFrame(drawVisualizer);
}

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
function init() {
  vizCanvas = $("visualizer");
  vizCtx = vizCanvas.getContext("2d");

  bgVideo.muted = true;

  loadPrefs();

  setCover(heroCover, null);
  setCover(playerCover, null);

  updateRangeFill(progressBar, 0);
  updateVolumeIcon();

  renderAll(); // sudah memanggil updatePlaybackUI() & applyView()

  /* Unlock AudioContext setelah interaksi pengguna */
  const unlock = () => {
    setupAudioContext();
    resumeAudioContext();

    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
  };

  document.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);

  /* Service Worker (hanya http/https; aman jika load sudah lewat) */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    const reg = () =>
      navigator.serviceWorker
        .register("sw.js")
        .catch((e) => console.warn("SW reg failed", e));

    if (document.readyState === "complete") {
      reg();
    } else {
      window.addEventListener("load", reg);
    }
  }
}

/* ------------------------------------------------------------
   DEBUG HELPER
   Jalankan window.__auroraDebug() di Console
   ------------------------------------------------------------ */
window.__auroraDebug = function () {
  console.table({
    src: audio.currentSrc || audio.src,
    paused: audio.paused,
    volume: audio.volume,
    muted: audio.muted,
    readyState: audio.readyState,
    networkState: audio.networkState,
    currentTime: audio.currentTime,
    error: audio.error
      ? `${audio.error.code}: ${audio.error.message || "Media error"}`
      : null,
    audioContext: audioCtx ? audioCtx.state : "not initialized",
    protocol: location.protocol,
    currentIndex: state.currentIndex,
    shuffle: state.shuffle,
    repeat: state.repeat,
  });
};

/* ------------------------------------------------------------
   START APPLICATION
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", init);