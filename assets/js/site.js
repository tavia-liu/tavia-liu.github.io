const searchableLists = document.querySelectorAll("[data-search-list]");

searchableLists.forEach((list) => {
  const input = document.querySelector(`[data-search-input="${list.dataset.searchList}"]`);
  const count = document.querySelector(`[data-search-count="${list.dataset.searchList}"]`);
  const entries = Array.from(list.querySelectorAll("[data-search-text]"));

  if (!input) return;

  const renderCount = () => {
    if (!count) return;
    const visible = entries.filter((entry) => !entry.hidden).length;
    count.textContent = `${visible} ${visible === 1 ? "entry" : "entries"}`;
  };

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    entries.forEach((entry) => {
      entry.hidden = query.length > 0 && !entry.dataset.searchText.includes(query);
    });
    renderCount();
  });

  renderCount();
});

const revealEntries = document.querySelectorAll(".entry");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (observedEntries) => {
      observedEntries.forEach((observedEntry) => {
        if (!observedEntry.isIntersecting) return;
        observedEntry.target.classList.add("is-visible");
        observer.unobserve(observedEntry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  revealEntries.forEach((entry) => {
    entry.dataset.reveal = "";
    observer.observe(entry);
  });
}

const axis = document.querySelector(".film-axis");

if (axis) {
  const progress = axis.querySelector("[data-film-progress]");
  const ticks = axis.querySelector("[data-film-ticks]");
  const index = axis.querySelector("[data-film-index]");
  const caption = axis.querySelector("[data-film-caption]");
  const candidates = Array.from(
    document.querySelectorAll(".section-link, .entry, .article-header, .prose h2")
  );
  const frames = candidates
    .filter((candidate) => candidate.getBoundingClientRect().height > 0)
    .map((candidate) => {
      const title =
        candidate.querySelector(".entry-title")?.textContent ||
        candidate.querySelector("strong")?.textContent ||
        candidate.querySelector("h1")?.textContent ||
        candidate.textContent;

      return {
        element: candidate,
        title: title.trim().replace(/\s+/g, " "),
      };
    });

  if (frames.length > 1 && progress && ticks && index && caption) {
    axis.hidden = false;

    const buttons = frames.map((frame, frameIndex) => {
      const button = document.createElement("button");
      const position = frames.length === 1 ? 0 : (frameIndex / (frames.length - 1)) * 100;
      button.className = "film-axis__tick";
      button.type = "button";
      button.style.left = `${position}%`;
      button.setAttribute("aria-label", frame.title || `Frame ${frameIndex + 1}`);
      button.addEventListener("click", () => {
        frame.element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      });
      ticks.appendChild(button);
      return button;
    });

    const formatNumber = (number) => String(number).padStart(2, "0");

    const setActiveFrame = () => {
      const viewportLine = window.innerHeight * 0.42;
      let activeIndex = 0;

      frames.forEach((frame, frameIndex) => {
        const rect = frame.element.getBoundingClientRect();
        if (rect.top <= viewportLine) activeIndex = frameIndex;
      });

      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0;

      progress.style.setProperty("--progress", Math.max(0, Math.min(100, scrollPercent)));
      index.textContent = `${formatNumber(activeIndex + 1)} / ${formatNumber(frames.length)}`;
      caption.textContent = frames[activeIndex].title || "Frame";

      buttons.forEach((button, buttonIndex) => {
        button.classList.toggle("is-active", buttonIndex === activeIndex);
      });
    };

    setActiveFrame();
    window.addEventListener("scroll", setActiveFrame, { passive: true });
    window.addEventListener("resize", setActiveFrame);
  }
}
