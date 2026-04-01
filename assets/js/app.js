const placeholderButtons = document.querySelectorAll("[data-coming-soon]");
placeholderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    alert("Feature coming next. We'll wire this to the backend soon.");
  });
});
