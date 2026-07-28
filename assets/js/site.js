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
