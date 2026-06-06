const DATA_FILES = {
  itinerary: "data/itinerary.json",
  flights: "data/flights.json",
  stays: "data/stays.json",
  activities: "data/activities.json"
};

const DATA_VERSION = "2026-06-07-no-budget";

// Trip dates are kept in one place so the countdown and phase logic are easy to edit.
const tripStart = new Date("2026-06-19T00:00:00+10:00");
const tripEnd = new Date("2026-07-21T23:59:59+10:00");

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  loadTripData();
  registerServiceWorker();
});

function setupNavigation() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;

      document.querySelectorAll(".nav-button").forEach((navButton) => {
        navButton.classList.toggle("active", navButton === button);
      });

      document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("active-view", view.id === targetId);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

async function loadTripData() {
  try {
    // Each section reads from its own JSON file in /data so the trip can be edited
    // without touching the HTML structure.
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(`${path}?v=${DATA_VERSION}`);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        return [key, await response.json()];
      })
    );

    const data = Object.fromEntries(entries);
    renderHome(data);
    renderItinerary(data.itinerary.days);
    renderFlights(data.flights.flights);
    renderStays(data.stays.stays);
    renderActivities(data.activities.locations);
    setLastUpdated(data);
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

function renderHome(data) {
  const now = new Date();
  const daysUntilTrip = Math.ceil((tripStart - now) / 86400000);
  const daysUntilHome = Math.ceil((tripEnd - now) / 86400000);
  const phases = data.itinerary.phases;
  const currentPhase = findCurrentPhase(phases, now);
  const nextEvent = findNextEvent(data.itinerary.days, now);

  const countdown = document.querySelector("#countdown");
  const countdownDetail = document.querySelector("#countdown-detail");

  if (daysUntilTrip > 0) {
    countdown.textContent = `${daysUntilTrip} days to go`;
    countdownDetail.textContent = "Time to practice suitcase Tetris and choose snack priorities.";
  } else if (daysUntilHome >= 0) {
    countdown.textContent = "We are in Mexico!";
    countdownDetail.textContent = `${daysUntilHome} days until the Brisbane landing.`;
  } else {
    countdown.textContent = "Trip complete";
    countdownDetail.textContent = "Memories unlocked. Photo sorting remains undefeated.";
  }

  document.querySelector("#current-phase").textContent = currentPhase.title;
  document.querySelector("#current-phase-detail").textContent = currentPhase.description;
  document.querySelector("#next-event").textContent = nextEvent.title;
  document.querySelector("#next-event-detail").textContent = nextEvent.description;
}

function findCurrentPhase(phases, now) {
  // If the trip has not started yet, show the first upcoming phase.
  const current = phases.find((phase) => isDateInside(now, phase.startDate, phase.endDate));
  if (current) return current;

  const next = phases.find((phase) => new Date(`${phase.startDate}T00:00:00`) > now);
  return next || {
    title: "Back home",
    description: "The trip has wrapped, but the family stories are still fresh."
  };
}

function findNextEvent(days, now) {
  const next = days.find((day) => new Date(`${day.date}T00:00:00`) >= startOfToday(now) && day.majorEvent);
  if (!next) {
    return {
      title: "More family time",
      description: "Add the next big idea in data/itinerary.json."
    };
  }

  return {
    title: next.majorEvent,
    description: `${formatDate(next.date)} in ${next.location}`
  };
}

function renderItinerary(days) {
  const list = document.querySelector("#itinerary-list");
  list.innerHTML = "";

  if (!days.length) {
    list.appendChild(emptyState("📅", "No itinerary yet", "Add days in data/itinerary.json."));
    return;
  }

  days.forEach((day) => {
    list.insertAdjacentHTML("beforeend", `
      <article class="travel-card">
        <div class="travel-card-header">
          <div>
            <h3>${escapeHtml(day.location)}</h3>
            <p>${escapeHtml(day.summary)}</p>
          </div>
          <span class="date-chip">${formatDate(day.date)}</span>
        </div>
        <p><strong>Family note:</strong> ${escapeHtml(day.familyNote)}</p>
        <div class="meta-row">
          <span class="pill">🚶 ${escapeHtml(day.walking)}</span>
          ${day.majorEvent ? `<span class="pill">⭐ ${escapeHtml(day.majorEvent)}</span>` : ""}
        </div>
      </article>
    `);
  });
}

function renderFlights(flights) {
  const list = document.querySelector("#flights-list");
  list.innerHTML = "";

  if (!flights.length) {
    list.appendChild(emptyState("✈️", "No flights yet", "Add flight legs in data/flights.json."));
    return;
  }

  flights.forEach((flight) => {
    const booking = flight.bookingReferencePlaceholder
      ? `<span class="pill">Booking ref: ${escapeHtml(flight.bookingReferencePlaceholder)}</span>`
      : "";

    list.insertAdjacentHTML("beforeend", `
      <article class="travel-card">
        <div class="travel-card-header">
          <div>
            <h3>${escapeHtml(flight.airline)} ${escapeHtml(flight.flightNumber || "")}</h3>
            <p>${formatDate(flight.date)} at ${escapeHtml(flight.time || "Time TBC")}</p>
          </div>
          <span class="date-chip">${escapeHtml(flight.status)}</span>
        </div>
        <div class="route" aria-label="${escapeHtml(flight.departureCity)} to ${escapeHtml(flight.arrivalCity)}">
          <div><strong>${escapeHtml(flight.departureCity)}</strong><span>Depart</span></div>
          <div class="route-arrow">→</div>
          <div><strong>${escapeHtml(flight.arrivalCity)}</strong><span>Arrive</span></div>
        </div>
        <div class="meta-row">
          <span class="pill">🧳 ${escapeHtml(flight.note)}</span>
          ${booking}
        </div>
      </article>
    `);
  });
}

function renderStays(stays) {
  const list = document.querySelector("#stays-list");
  list.innerHTML = "";

  if (!stays.length) {
    list.appendChild(emptyState("🛏️", "No stays yet", "Add accommodation areas in data/stays.json."));
    return;
  }

  stays.forEach((stay) => {
    list.insertAdjacentHTML("beforeend", `
      <article class="travel-card">
        <div class="travel-card-header">
          <div>
            <h3>${escapeHtml(stay.location)}</h3>
            <p>${escapeHtml(stay.area)}</p>
          </div>
          <span class="date-chip">${formatShortRange(stay.startDate, stay.endDate)}</span>
        </div>
        <p>${escapeHtml(stay.notes)}</p>
        <div class="meta-row">
          <span class="pill">🏠 ${escapeHtml(stay.type)}</span>
          <span class="pill">📍 General area only</span>
        </div>
      </article>
    `);
  });
}

function renderActivities(groups) {
  const wrapper = document.querySelector("#activities-list");
  wrapper.innerHTML = "";

  if (!groups.length) {
    wrapper.appendChild(emptyState("🌮", "No activities yet", "Add ideas in data/activities.json."));
    return;
  }

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "activity-group";
    section.innerHTML = `<h3 class="activity-group-title">${escapeHtml(group.location)}</h3>`;

    group.activities.forEach((activity) => {
      section.insertAdjacentHTML("beforeend", `
        <article class="travel-card">
          <div class="travel-card-header">
            <div>
              <h3>${escapeHtml(activity.name)}</h3>
              <p>${escapeHtml(activity.description)}</p>
            </div>
            <span class="date-chip">${escapeHtml(activity.energy)}</span>
          </div>
          <div class="tag-row">
            ${activity.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>
      `);
    });

    wrapper.appendChild(section);
  });
}

function setLastUpdated(data) {
  const dates = Object.values(data)
    .map((file) => file.lastUpdated)
    .filter(Boolean)
    .sort();

  document.querySelector("#last-updated").textContent = `Last updated: ${dates.at(-1) || "Not set"}`;
}

function showLoadError() {
  document.querySelector("#main").innerHTML = "";
  document.querySelector("#main").appendChild(
    emptyState("🧯", "The trip data did not load", "If you opened index.html directly and your browser blocks local JSON, run a tiny local server or publish with GitHub Pages.")
  );
}

function emptyState(icon, title, detail) {
  const element = document.createElement("article");
  element.className = "empty-state";
  element.innerHTML = `<span>${icon}</span><h3>${title}</h3><p>${detail}</p>`;
  return element;
}

function isDateInside(date, start, end) {
  return date >= new Date(`${start}T00:00:00`) && date <= new Date(`${end}T23:59:59`);
}

function startOfToday(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short"
  }).format(new Date(`${value}T00:00:00`));
}

function formatShortRange(start, end) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function escapeHtml(value) {
  // Protects the page if someone accidentally types HTML inside a JSON file.
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  // Service workers need http/https, so this is active on GitHub Pages and local servers.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  }
}
