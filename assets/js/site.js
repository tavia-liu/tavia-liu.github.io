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
