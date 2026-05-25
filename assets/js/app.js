const state = {
  site: {},
  tags: [],
  tagMap: new Map(),
  videos: [],
  activeTag: "All",
  activeVideo: null,
  activeVersionIndex: 0,
  lastFocus: null
};

const tagFilters = document.querySelector("#tagFilters");
const gallery = document.querySelector("#gallery");
const galleryStatus = document.querySelector("#galleryStatus");
const textFallback = document.querySelector("#textFallback");
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

  if (textOnlyPattern.test(navigator.userAgent)) {
    document.documentElement.classList.add("text-only");
  }

  loadVideos();

  overlay.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-overlay]")) {
      closeOverlay();
    }
  });

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
  introFallbackTimer = window.setTimeout(finishIntro, 2100);
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
    state.site = data.site || {};
    state.tags = Array.isArray(data.tags) ? data.tags : [];
    state.tagMap = new Map(state.tags.map((tag) => [tag.id, tag]));
    state.videos = Array.isArray(data.videos) ? data.videos : [];
    renderTags();
    renderGallery();
    renderTextFallback();
  } catch (error) {
    galleryStatus.textContent = "The video list could not be loaded. Use the text version below.";
    console.error(error);
  }
}

function renderTags() {
  const usedTagIds = new Set(state.videos.flatMap((video) => video.tags || []));
  const tags = [
    { id: "All", label: "All", description: "Show all video essays." },
    ...state.tags.filter((tag) => usedTagIds.has(tag.id))
  ];
  tagFilters.replaceChildren(...tags.map(createTagButton));
}

function createTagButton(tag) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tag-button";
  button.textContent = tag.label;
  button.title = tag.description || tag.label;
  button.setAttribute("role", "listitem");
  button.setAttribute("aria-pressed", String(tag.id === state.activeTag));
  button.addEventListener("click", () => {
    state.activeTag = tag.id;
    renderTags();
    renderGallery();
  });
  return button;
}

function renderGallery() {
  const videos = getFilteredVideos();
  gallery.replaceChildren(...videos.map(createGalleryCard));
  galleryStatus.textContent = videos.length
    ? `${videos.length} video essay${videos.length === 1 ? "" : "s"} shown.`
    : "No video essays match this tag.";
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
  poster.alt = video.alt || "";
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

  const subtitle = document.createElement("span");
  subtitle.className = "card-subtitle";
  subtitle.textContent = video.subtitle || "";

  const description = document.createElement("span");
  description.className = "card-description";
  description.textContent = getCardMeta(video);

  const tags = document.createElement("span");
  tags.className = "card-tags";
  tags.textContent = getTagLabels(video.tags).join(" / ");

  content.append(title);
  if (video.subtitle) {
    content.append(subtitle);
  }
  content.append(description, tags);
  button.append(poster, content);
  card.append(button);
  return card;
}

function openOverlay(video, versionIndex = 0) {
  state.lastFocus = document.activeElement;
  state.activeVideo = video;
  state.activeVersionIndex = versionIndex;
  renderOverlay();
  overlay.hidden = false;
  document.body.classList.add("overlay-open");
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  overlay.querySelector(".close-button").focus();
}

function renderOverlay() {
  const video = state.activeVideo;
  const versions = Array.isArray(video.versions) ? video.versions : [];
  const version = versions[state.activeVersionIndex] || {};

  overlayTitle.textContent = video.title;
  overlayTagline.textContent = getOverlayMeta(video);
  overlayDescription.textContent = video.description;
  overlayTranscript.replaceChildren(
    createMetaLine("Notes", version.notes || "Version notes are not available yet."),
    createMetaLine("Transcript", version.transcript || "Transcript placeholder."),
    createMetaLine("License", video.license || state.site.license_note || "License note unavailable.")
  );

  renderOverlaySubtitle(video.subtitle || "");

  versionSwitcher.replaceChildren(...versions.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "version-button";
    button.textContent = getVersionLabel(item, index);
    button.setAttribute("aria-pressed", String(index === state.activeVersionIndex));
    button.addEventListener("click", () => {
      state.activeVersionIndex = index;
      renderOverlay();
    });
    return button;
  }));

  overlayVideo.pause();
  if (version.src) {
    overlayVideo.src = version.src;
  } else {
    overlayVideo.removeAttribute("src");
  }
  overlayVideo.poster = video.poster;
  const track = overlayVideo.querySelector("track");
  if (track) {
    track.src = version.subtitles || "";
  }
  overlayVideo.load();
}

function renderOverlaySubtitle(text) {
  let subtitle = document.querySelector("#overlaySubtitle");
  if (!subtitle) {
    subtitle = document.createElement("p");
    subtitle.id = "overlaySubtitle";
    subtitle.className = "overlay-subtitle";
    overlayTitle.after(subtitle);
  }
  subtitle.textContent = text;
  subtitle.hidden = !text;
}

function createMetaLine(label, value) {
  const line = document.createElement("span");
  line.className = "meta-line";
  line.textContent = `${label}: ${value}`;
  return line;
}

function getTagLabels(tagIds = []) {
  return tagIds.map((id) => state.tagMap.get(id)?.label || id);
}

function getLatestVersion(video) {
  const versions = Array.isArray(video.versions) ? video.versions : [];
  return versions[versions.length - 1] || {};
}

function getCardMeta(video) {
  const latest = getLatestVersion(video);
  const parts = [];
  if (video.status) {
    parts.push(video.status);
  }
  if (latest.date) {
    parts.push(`latest ${latest.date}`);
  }
  return parts.join(" / ") || video.description || "";
}

function getOverlayMeta(video) {
  const latest = getLatestVersion(video);
  return [
    ...getTagLabels(video.tags),
    video.status,
    latest.date ? `latest ${latest.date}` : ""
  ].filter(Boolean).join(" / ");
}

function getVersionLabel(version, index) {
  return [
    version.label || `Version ${index + 1}`,
    version.date,
    version.duration,
    version.format
  ].filter(Boolean).join(" / ");
}

function renderTextFallback() {
  if (!textFallback || !state.videos.length) {
    return;
  }

  const list = document.createElement("ul");
  list.replaceChildren(...state.videos.map((video) => {
    const latest = getLatestVersion(video);
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = latest.src || "#";
    link.textContent = video.title;
    item.append(link, `: ${video.subtitle || video.description || "Video essay."}`);
    return item;
  }));

  const existingList = textFallback.querySelector("ul");
  if (existingList) {
    existingList.replaceWith(list);
  } else {
    textFallback.append(list);
  }
}

function closeOverlay() {
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

  if (event.key === "Escape" && !overlay.hidden) {
    closeOverlay();
    return;
  }

  if (event.key === "Tab" && !overlay.hidden) {
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
