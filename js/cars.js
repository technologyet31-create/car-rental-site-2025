/* cars listing page logic */

(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function buildCard(car) {
    const article = document.createElement("article");
    article.className = "card card-flip";
    article.setAttribute("data-car-id", car.id);

    const name = escapeHtml(car.name);
    const year = escapeHtml(car.year);
    const category = escapeHtml(car.category);
    const transmission = escapeHtml(car.transmission);
    const fuel = escapeHtml(car.fuel);
    const seats = escapeHtml(car.seats);
    const pricePerDay = escapeHtml(car.pricePerDay);
    const img = escapeHtml(car.img);
    const description = escapeHtml(car.description);

    const title = `<div class="card-title"><span>${name} ${year}</span><span class="badge">${category}</span></div>`;
    const meta = `<div class="meta"><span>${transmission}</span><span>${fuel}</span><span>${seats} مقاعد</span></div>`;
    const actions = `
      <div class="card-actions">
        <a class="btn btn-primary" data-action="book" href="booking.html">احجز الآن</a>
        <a class="btn" data-action="details" href="car-details.html">عرض التفاصيل</a>
      </div>
    `;

    article.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front">
          <div class="card-img"><img src="${img}" alt="${name}"></div>
          <div class="card-body">
            ${title}
            ${meta}
            <div class="price">${pricePerDay} <small>د.ل / يوم</small></div>
            ${actions}
          </div>
        </div>

        <div class="card-face card-back" aria-hidden="true">
          <div class="card-back-head">
            ${title}
            ${meta}
          </div>
          <p class="card-brief">${description}</p>
          <div class="price">${pricePerDay} <small>د.ل / يوم</small></div>
          ${actions}
        </div>
      </div>
    `;

    return article;
  }

  function matchesQuery(car, rawQuery) {
    const query = normalizeText(rawQuery);
    if (!query) return true;

    const name = normalizeText(car.name);
    const category = normalizeText(car.category);
    const year = normalizeText(car.year);

    return name.includes(query) || category.includes(query) || year.includes(query);
  }

  function matchesCategory(car, category) {
    const selected = normalizeText(category);
    if (!selected) return true;
    return normalizeText(car.category) === selected;
  }

  function matchesPrice(car, priceKey) {
    const key = String(priceKey ?? "").trim();
    if (!key) return true;
    const price = Number(car.pricePerDay);
    if (!Number.isFinite(price)) return true;

    if (key === "lt150") return price < 150;
    if (key === "150to250") return price >= 150 && price <= 250;
    if (key === "gt250") return price > 250;
    return true;
  }

  function applyFilters(cars, filters) {
    return (cars || []).filter((car) => {
      return (
        matchesQuery(car, filters.query) &&
        matchesCategory(car, filters.category) &&
        matchesPrice(car, filters.priceKey)
      );
    });
  }

  function renderCars(cars) {
    const grid = document.getElementById("carsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    (cars || []).forEach((car) => grid.appendChild(buildCard(car)));
  }

  function wireCards() {
    const isTouchLike = window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;

    const cards = document.querySelectorAll("[data-car-id]");
    cards.forEach((card) => {
      const carId = card.getAttribute("data-car-id");
      if (!carId) return;

      const detailsLinks = card.querySelectorAll('a[data-action="details"]');
      const bookLinks = card.querySelectorAll('a[data-action="book"]');

      detailsLinks.forEach((detailsLink) => {
        detailsLink.href = `car-details.html?id=${encodeURIComponent(carId)}`;
        detailsLink.addEventListener("click", () => window.CarRent.setSelectedCarId(carId));
      });

      bookLinks.forEach((bookLink) => {
        bookLink.href = `booking.html?id=${encodeURIComponent(carId)}`;
        bookLink.addEventListener("click", () => window.CarRent.setSelectedCarId(carId));
      });

      // On touch devices there is no hover: tap the card (not the buttons) to flip.
      if (isTouchLike) {
        card.addEventListener("click", (e) => {
          const target = e.target;
          if (!(target instanceof Element)) return;
          if (target.closest('a[data-action="details"], a[data-action="book"], button, input, select, textarea')) {
            return;
          }

          card.classList.toggle("is-flipped");
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const allCars = window.CarRent.getCars();
    const controls = {
      searchInput: document.getElementById("carSearchInput"),
      categorySelect: document.getElementById("carCategorySelect"),
      priceSelect: document.getElementById("carPriceSelect"),
      searchBtn: document.getElementById("carSearchBtn"),
    };

    function readFilters() {
      return {
        query: controls.searchInput ? controls.searchInput.value : "",
        category: controls.categorySelect ? controls.categorySelect.value : "",
        priceKey: controls.priceSelect ? controls.priceSelect.value : "",
      };
    }

    function runSearch() {
      const filtered = applyFilters(allCars, readFilters());
      renderCars(filtered);
      wireCards();
    }

    // Initial render
    runSearch();

    // Live filtering
    if (controls.searchInput) {
      controls.searchInput.addEventListener("input", runSearch);
      controls.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runSearch();
      });
    }

    if (controls.categorySelect) controls.categorySelect.addEventListener("change", runSearch);
    if (controls.priceSelect) controls.priceSelect.addEventListener("change", runSearch);
    if (controls.searchBtn) controls.searchBtn.addEventListener("click", runSearch);
  });
})();
