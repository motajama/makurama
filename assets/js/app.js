const state = {
  videos: [],
  activeTag: "All",
  activeVideo: null,
  activeVersionIndex: 0,
  lastFocus: null
};

const tagFilters = document.querySelector("#tagFilters");
const gallery = document.querySelector("#gallery");
const galleryStatus = document.querySelector("#galleryStatus");
const overlay = document.querySelector("#videoOverlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayTagline = document.querySelector("#overlayTagline");
const overlayDescription = document.querySelector("#overlayDescription");
const overlayVideo = document.querySelector("#overlayVideo");
const overlayTranscript = document.querySelector("#overlayTranscript");
const versionSwitcher = document.querySelector("#versionSwitcher");
const introScreen = document.getElementById("intro-screen");

const textOnlyPattern = /Lynx|Links|w3m|ELinks/i;
let introDismissed = false;
let introTimer = 0;
let introFallbackTimer = 0;

init();

function init() {
  setupIntro();
  setupVideoOverlay();

  if (textOnlyPattern.test(navigator.userAgent)) {
    document.documentElement.classList.add("text-only");
  }

  loadVideos();
  document.addEventListener("keydown", handleKeys);
}

function setupIntro() {
  if (!introScreen) {
    document.body.classList.remove("intro-active");
    return;
  }

  document.body.classList.add("intro-active");
  introScreen.hidden = false;
  introScreen.classList.remove("intro-dismissing");
  introScreen.style.pointerEvents = "";
  introScreen.focus({ preventScroll: true });
  introScreen.addEventListener("click", dismissIntro);
  introScreen.addEventListener("keydown", handleIntroKeys);
  introTimer = window.setTimeout(dismissIntro, 4000);
}

function handleIntroKeys(event) {
  if (!["Enter", " ", "Escape"].includes(event.key)) {
    return;
  }

  event.preventDefault();
  dismissIntro();
}

function dismissIntro() {
  if (!introScreen || introDismissed) {
    return;
  }

  introDismissed = true;
  window.clearTimeout(introTimer);
  window.clearTimeout(introFallbackTimer);
  document.body.classList.remove("intro-active");
  introScreen.classList.add("intro-dismissing");
  introScreen.style.pointerEvents = "none";
  introScreen.removeEventListener("click", dismissIntro);
  introScreen.removeEventListener("keydown", handleIntroKeys);

  /*
   Do not move focus to main/title after the intro.
   That made the title look permanently active/red in this prototype.
   Blur the intro layer and let the user continue naturally.
  */
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }

  introScreen.addEventListener("transitionend", handleIntroTransitionEnd);
  introFallbackTimer = window.setTimeout(finishIntro, 1600);
}

function handleIntroTransitionEnd(event) {
  if (event.target !== introScreen || event.propertyName !== "opacity") {
    return;
  }

  finishIntro();
}

function finishIntro() {
  if (!introScreen) {
    return;
  }

  window.clearTimeout(introFallbackTimer);
  introScreen.removeEventListener("transitionend", handleIntroTransitionEnd);
  introScreen.hidden = true;
}

async function loadVideos() {
  try {
    const response = await fetch("assets/data/videos.json");
    if (!response.ok) {
      throw new Error(`Video data failed to load: ${response.status}`);
    }

    const data = await response.json();
    state.videos = Array.isArray(data.videos) ? data.videos : [];
    renderTags();
    renderGallery();
  } catch (error) {
    if (galleryStatus) {
      galleryStatus.textContent = "The video list could not be loaded. Use the text version below.";
    }
    console.error(error);
  }
}

function setupVideoOverlay() {
  if (!overlay) {
    return;
  }

  overlay.hidden = true;
  overlay.classList.remove("is-visible");
  overlay.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-overlay]")) {
      closeOverlay();
    }
  });
}

function renderTags() {
  if (!tagFilters) {
    return;
  }

  const tags = ["All", ...new Set(state.videos.flatMap((video) => video.tags || []))];
  tagFilters.replaceChildren(...tags.map(createTagButton));
}

function createTagButton(tag) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tag-button";
  button.textContent = tag;
  button.setAttribute("role", "listitem");
  button.setAttribute("aria-pressed", String(tag === state.activeTag));
  button.addEventListener("click", () => {
    state.activeTag = tag;
    renderTags();
    renderGallery();
  });
  return button;
}

function renderGallery() {
  if (!gallery) {
    return;
  }

  const videos = getFilteredVideos();
  gallery.replaceChildren(...videos.map(createGalleryCard));
  if (galleryStatus) {
    galleryStatus.textContent = videos.length
      ? `${videos.length} video essay${videos.length === 1 ? "" : "s"} shown.`
      : "No video essays match this tag.";
  }
}

function getFilteredVideos() {
  if (state.activeTag === "All") {
    return state.videos;
  }
  return state.videos.filter((video) => (video.tags || []).includes(state.activeTag));
}

function createGalleryCard(video) {
  const card = document.createElement("article");
  card.className = "gallery-card";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "card-button";
  button.setAttribute("aria-label", `Play ${video.title}`);
  button.addEventListener("click", () => openOverlay(video));

  const poster = document.createElement("img");
  poster.src = video.poster;
  poster.alt = "";
  poster.loading = "lazy";
  poster.addEventListener("error", () => {
    poster.removeAttribute("src");
    poster.classList.add("is-missing");
  });

  const content = document.createElement("span");
  content.className = "card-content";

  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = video.title;

  const description = document.createElement("span");
  description.className = "card-description";
  description.textContent = video.description;

  const tags = document.createElement("span");
  tags.className = "card-tags";
  tags.textContent = (video.tags || []).join(" / ");

  content.append(title, description, tags);
  button.append(poster, content);
  card.append(button);
  return card;
}

function openOverlay(video, versionIndex = 0) {
  if (!overlay) {
    return;
  }

  state.lastFocus = document.activeElement;
  state.activeVideo = video;
  state.activeVersionIndex = versionIndex;
  renderOverlay();
  overlay.hidden = false;
  document.body.classList.add("overlay-open");
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
  });
  overlay.querySelector(".close-button")?.focus();
}

function renderOverlay() {
  const video = state.activeVideo;
  const version = video.versions[state.activeVersionIndex];

  overlayTitle.textContent = video.title;
  overlayTagline.textContent = (video.tags || []).join(" / ");
  overlayDescription.textContent = video.description;
  overlayTranscript.textContent = version.transcript || "Transcript placeholder.";

  versionSwitcher.replaceChildren(...video.versions.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "version-button";
    button.textContent = item.label || `Version ${index + 1}`;
    button.setAttribute("aria-pressed", String(index === state.activeVersionIndex));
    button.addEventListener("click", () => {
      state.activeVersionIndex = index;
      renderOverlay();
    });
    return button;
  }));

  overlayVideo.pause();
  overlayVideo.src = version.src;
  overlayVideo.poster = video.poster;
  const track = overlayVideo.querySelector("track");
  if (track) {
    track.src = version.captions || "";
  }
  overlayVideo.load();
}

function closeOverlay() {
  if (!overlay) {
    return;
  }

  overlay.classList.remove("is-visible");
  document.body.classList.remove("overlay-open");
  overlayVideo.pause();

  window.setTimeout(() => {
    overlay.hidden = true;
    overlayVideo.removeAttribute("src");
    overlayVideo.load();
    if (state.lastFocus) {
      state.lastFocus.focus();
    }
  }, prefersReducedMotion() ? 0 : 260);
}

function handleKeys(event) {
  if (!introDismissed && introScreen && !introScreen.hidden) {
    handleIntroKeys(event);
    return;
  }

  if (event.key === "Escape" && overlay && !overlay.hidden) {
    closeOverlay();
    return;
  }

  if (event.key === "Tab" && overlay && !overlay.hidden) {
    trapFocus(event);
  }
}

function trapFocus(event) {
  const focusable = overlay.querySelectorAll(
    'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) {
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
