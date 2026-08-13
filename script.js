"use strict";

/* ============================================================
   RUBIKON VENTURE
   new-rubicon-script.js

   Responsibilities:
   - Switch between Identity / Connection Map / FlowBoard
   - Maintain navigation state
   - Show Request Feedback only on Identity
   - Populate dynamic Connection Map details
   - Highlight selected network connections
   - Add restrained cursor-driven network motion
   - Filter FlowBoard signals
   - Maintain quick-filter state
   - Maintain result count and empty state
============================================================ */


/* ============================================================
   DOM REFERENCES
============================================================ */

const navButtons = document.querySelectorAll(".nav-link[data-view]");
const viewLinks = document.querySelectorAll("[data-view-link]");
const views = document.querySelectorAll(".view");

const feedbackButton = document.getElementById("feedback-button");

const networkStage = document.getElementById("network-stage");
const networkNodes = document.querySelectorAll(".person-node");
const networkDetail = document.getElementById("network-detail-card");

const flowSearch = document.getElementById("flow-search");
const quickFilters = document.querySelectorAll(".quick-filter");
const signalCards = Array.from(
  document.querySelectorAll(".signal-card")
);

const resultsCount = document.getElementById("results-count");
const emptyResults = document.getElementById("empty-results");


/* ============================================================
   VIEW SWITCHING
============================================================ */

function activateView(viewName) {
  const targetView = document.getElementById(`${viewName}-view`);

  if (!targetView) {
    return;
  }

  views.forEach((view) => {
    view.classList.remove("active");
  });

  navButtons.forEach((button) => {
    const isActive = button.dataset.view === viewName;

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  targetView.classList.add("active");

  if (feedbackButton) {
    feedbackButton.classList.toggle(
      "visible",
      viewName === "identity"
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const viewName = button.dataset.view;

    activateView(viewName);
  });
});


viewLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const viewName = link.dataset.viewLink;

    activateView(viewName);
  });
});


/* ============================================================
   CONNECTION MAP
============================================================ */

function highlightConnection(selectedId) {
  for (let index = 1; index <= 6; index += 1) {
    const line = document.getElementById(
      `line-center-${index}`
    );

    if (!line) {
      continue;
    }

    const selected =
      String(index) === String(selectedId);

    line.style.stroke = selected
      ? "rgba(113, 183, 255, 0.98)"
      : "rgba(255, 255, 255, 0.11)";

    line.style.strokeWidth = selected
      ? "3"
      : "1.15";

    line.style.opacity = selected
      ? "1"
      : "0.68";
  }
}


function buildConnectionDetail(node) {
  if (!networkDetail || !node) {
    return;
  }

  const {
    id,
    name,
    role,
    city,
    origin,
    building,
    culture,
    pipelineTitle,
    pipelineSummary,
    pipeline1,
    pipeline2,
    pipeline3
  } = node.dataset;

  const avatar =
    node.querySelector(".person-avatar")?.textContent.trim() || "";


  networkDetail.innerHTML = `
    <p class="kicker">
      Selected connection
    </p>

    <div class="selected-person">

      <div class="selected-person-avatar">
        ${avatar}
      </div>

      <div class="selected-person-copy">

        <h2>
          ${name}
        </h2>

        <p class="selected-role">
          ${role}
        </p>

        <p class="selected-location">
          ${city} · From ${origin}
        </p>

      </div>

    </div>


    <div class="detail-section">

      <p class="section-label">
        What they are building
      </p>

      <p>
        ${building}
      </p>

    </div>


    <div class="detail-section">

      <p class="section-label">
        Collaboration culture
      </p>

      <p>
        ${culture}
      </p>

    </div>


    <div class="detail-section opportunity-detail-section">

      <p class="section-label">
        Opportunity pathway
      </p>

      <h3>
        ${pipelineTitle}
      </h3>

      <p>
        ${pipelineSummary}
      </p>

      <ol class="relationship-actions">
        <li>${pipeline1}</li>
        <li>${pipeline2}</li>
        <li>${pipeline3}</li>
      </ol>

    </div>


    <button
      class="button primary-button detail-save-button"
      type="button"
    >
      Save relationship path
    </button>
  `;


  networkNodes.forEach((item) => {
    item.classList.remove("active");
  });

  node.classList.add("active");

  highlightConnection(id);
}


networkNodes.forEach((node) => {

  node.addEventListener("mouseenter", () => {
    buildConnectionDetail(node);
  });

  node.addEventListener("focus", () => {
    buildConnectionDetail(node);
  });

  node.addEventListener("click", () => {
    buildConnectionDetail(node);
  });

});


/* ============================================================
   CONNECTION MAP CURSOR MOTION

   Intentionally restrained:
   - no movement on touch devices
   - maximum tilt kept very small
============================================================ */

if (networkStage) {

  networkStage.addEventListener("mousemove", (event) => {

    const coarsePointer = window.matchMedia(
      "(pointer: coarse)"
    ).matches;

    if (coarsePointer) {
      return;
    }

    const rect =
      networkStage.getBoundingClientRect();

    const x =
      event.clientX -
      rect.left -
      rect.width / 2;

    const y =
      event.clientY -
      rect.top -
      rect.height / 2;

    const normalizedX =
      x / (rect.width / 2);

    const normalizedY =
      y / (rect.height / 2);

    const rotateY =
      normalizedX * 2.8;

    const rotateX =
      normalizedY * -2.8;

    networkStage.style.transform = `
      perspective(1200px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
    `;
  });


  networkStage.addEventListener("mouseleave", () => {

    networkStage.style.transform = `
      perspective(1200px)
      rotateX(0deg)
      rotateY(0deg)
    `;

  });

}


/* ============================================================
   FLOWBOARD FILTERING
============================================================ */

function updateResultCount(count) {
  if (resultsCount) {
    resultsCount.textContent =
      `${count} active signal${count === 1 ? "" : "s"}`;
  }

  if (emptyResults) {
    emptyResults.hidden = count !== 0;
  }
}


function filterSignals(query) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  let visibleCount = 0;


  signalCards.forEach((card) => {

    const searchableContent = `
      ${card.dataset.search || ""}
      ${card.textContent || ""}
    `.toLowerCase();


    const matches =
      normalizedQuery === "" ||
      searchableContent.includes(normalizedQuery);


    card.classList.toggle(
      "hidden",
      !matches
    );


    if (matches) {
      visibleCount += 1;
    }

  });


  updateResultCount(visibleCount);
}


/* ============================================================
   SEARCH INPUT
============================================================ */

if (flowSearch) {

  flowSearch.addEventListener("input", (event) => {

    const value =
      event.target.value;

    filterSignals(value);


    const normalized =
      value
        .trim()
        .toLowerCase();


    quickFilters.forEach((filter) => {

      const filterName =
        filter.textContent
          .trim()
          .toLowerCase();

      filter.classList.toggle(
        "active",
        normalized !== "" &&
        filterName === normalized
      );

    });

  });

}


/* ============================================================
   QUICK FILTERS

   Behavior:
   - click → activate filter
   - click active filter → clear filter
============================================================ */

quickFilters.forEach((filter) => {

  filter.addEventListener("click", () => {

    const label =
      filter.textContent.trim();

    const currentlyActive =
      filter.classList.contains("active");


    quickFilters.forEach((item) => {
      item.classList.remove("active");
    });


    if (currentlyActive) {

      if (flowSearch) {
        flowSearch.value = "";
      }

      filterSignals("");

      return;
    }


    filter.classList.add("active");


    if (flowSearch) {
      flowSearch.value = label;
    }


    filterSignals(label);

  });

});


/* ============================================================
   OPTIONAL BUTTON FEEDBACK

   These prototype actions do not yet connect to a backend.
   They receive a small visual state instead of doing nothing.
============================================================ */

document.addEventListener("click", (event) => {

  const actionButton =
    event.target.closest(
      ".signal-action, .detail-save-button"
    );

  if (!actionButton) {
    return;
  }


  const originalText =
    actionButton.textContent.trim();


  actionButton.classList.add(
    "prototype-confirmed"
  );


  actionButton.textContent =
    "Saved to prototype";


  window.setTimeout(() => {

    actionButton.classList.remove(
      "prototype-confirmed"
    );

    actionButton.textContent =
      originalText;

  }, 1400);

});


/* ============================================================
   INITIAL STATE
============================================================ */

if (feedbackButton) {
  feedbackButton.classList.add("visible");
}

updateResultCount(signalCards.length);
