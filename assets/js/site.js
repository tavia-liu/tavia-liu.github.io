document.documentElement.classList.add("js");

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

const revealItems = document.querySelectorAll("[data-reveal], .entry");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

let pointerFrame = null;

window.addEventListener("pointermove", (event) => {
  if (pointerFrame) return;
  pointerFrame = window.requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
    document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    pointerFrame = null;
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
  const active = document.activeElement;
  const isTyping = active && ["INPUT", "TEXTAREA"].includes(active.tagName);
  if (isTyping) return;

  const search = document.querySelector("[data-search-input]");
  if (!search) return;

  event.preventDefault();
  search.focus();
});
