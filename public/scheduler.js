/**
 * FlyOS Scheduler — Time Ribbon
 * v0-style design with live GraphQL data.
 */

const TOKEN_KEY = 'flyos_demo_jwt';
const COL_WIDTH = 120;        // px per hour
const LABEL_WIDTH = 280;      // px — label column
const CANVAS_START = -12;     // hours before midnight
const CANVAS_END = 36;        // hours after midnight
const ANCHOR_HOUR = 8;        // scroll to 08:00 on load
/** Date picker + day strip use this zone (matches seeded bases & prisma seed demo). */
const SCHEDULE_BOARD_TZ = 'America/Denver';
const TIMEZONE_LABEL = 'MT';
const MODULE_DEFINITIONS = {
  board: {
    title: 'Board',
    summary:
      'Live ribbon surface for base-scoped aircraft rows, instructor overlays, and booking occupancy.',
    badge: 'LIVE ON RIBBON',
    badgeTone: 'live',
    models: ['Base', 'Aircraft', 'Booking', 'BookingParticipant'],
    operations: [
      'GET /',
      'GET /scheduler',
      'POST /graphql',
      'bases',
      'aircraftByBase',
      'bookingsByBase',
    ],
  },
  fleet: {
    title: 'Fleet',
    summary:
      'Aircraft inventory, airworthiness state, and schedulable aircraft resources.',
    badge: 'PARTIAL RIBBON READ',
    badgeTone: 'partial',
    models: ['Aircraft', 'SchedulableResource', 'Base'],
    operations: [
      'POST /graphql',
      'aircraft',
      'aircraftByBase',
      'createAircraft',
      'updateAircraftStatus',
    ],
  },
  bookings: {
    title: 'Bookings',
    summary:
      'Booking lifecycle from creation through dispatch, completion, cancellation, and aircraft occupancy.',
    badge: 'LIVE READ + API WRITE',
    badgeTone: 'partial',
    models: ['Booking', 'BookingParticipant', 'SchedulableResource'],
    operations: [
      'POST /graphql',
      'createBooking',
      'bookings',
      'myBookings',
      'bookingsByBase',
      'bookingsByAircraft',
      'dispatchBooking',
      'completeBooking',
      'cancelBooking',
    ],
  },
  maintenance: {
    title: 'Maintenance',
    summary:
      'Predictive maintenance alerts, telemetry ingestion, maintenance logs, squawks, and manual grounding.',
    badge: 'BACKEND READY',
    badgeTone: 'backend',
    models: ['Telemetry', 'MaintenanceLog', 'Squawk', 'Aircraft'],
    operations: [
      'POST /graphql',
      'alertHistory',
      'squawks',
      'ingestTelemetry',
      'ingestMaintenanceLogs',
      'createSquawk',
      'updateSquawkStatus',
      'updateAircraftStatus',
    ],
  },
  compliance: {
    title: 'Compliance',
    summary:
      'Pilot qualifications covering medicals, flight reviews, and aircraft checkouts.',
    badge: 'BACKEND READY',
    badgeTone: 'backend',
    models: ['PilotMedical', 'FlightReviewRecord', 'AircraftCheckout'],
    operations: [
      'POST /graphql',
      'upsertPilotMedical',
      'upsertFlightReview',
      'upsertAircraftCheckout',
    ],
  },
  users: {
    title: 'Users And Auth',
    summary:
      'Authenticated profile, user roster, org membership, and JWT entry points.',
    badge: 'BACKEND READY',
    badgeTone: 'backend',
    models: ['User', 'Organization', 'UserBase'],
    operations: ['POST /graphql', 'me', 'users', 'login', 'register'],
  },
  bases: {
    title: 'Bases',
    summary:
      'Organization bases drive the ribbon selector and scope aircraft plus booking queries.',
    badge: 'LIVE SELECTOR',
    badgeTone: 'live',
    models: ['Base', 'UserBase', 'SchedulableResource'],
    operations: ['POST /graphql', 'bases', 'createBase'],
  },
};
const boardState = {
  activeModuleKey: 'board',
  aircraftCount: 0,
  bookingCount: 0,
};

// ── GraphQL ─────────────────────────────────────────────

const Q_BASES = `
  query Bases {
    bases { id name icaoCode }
  }
`;

const Q_AIRCRAFT_BY_BASE = `
  query AircraftByBase($baseId: ID!) {
    aircraftByBase(baseId: $baseId) {
      id tailNumber make model airworthinessStatus
    }
  }
`;

const Q_BOOKINGS_BY_BASE = `
  query BookingsByBase($baseId: String!, $startDate: DateTime, $endDate: DateTime) {
    bookingsByBase(baseId: $baseId, startDate: $startDate, endDate: $endDate) {
      id status startTime endTime aircraftId
      user { email }
      aircraft { id tailNumber }
      participants { userId role user { email } }
    }
  }
`;

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

async function graphqlRequest(query, variables) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch('/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: variables ?? null }),
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; }
  catch (e) { return { errors: [{ message: 'Invalid JSON: ' + e }] }; }
  return { data: body.data, errors: body.errors };
}

// ── Helpers ─────────────────────────────────────────────

function setStatusMessage(message, kind = 'info') {
  const statusEl = document.getElementById('status-msg');
  statusEl.textContent = message ?? '';
  statusEl.classList.toggle('is-error', kind === 'error');
  statusEl.classList.toggle('is-busy', kind === 'busy');
  statusEl.classList.toggle('is-info', kind === 'info');
}

function appendChips(container, items) {
  container.innerHTML = '';
  items.forEach((item) => {
    const chip = document.createElement('span');
    chip.className = 'backend-map__chip';
    chip.textContent = item;
    container.appendChild(chip);
  });
}

function renderModulePanel(moduleKey) {
  const module = MODULE_DEFINITIONS[moduleKey] || MODULE_DEFINITIONS.board;
  const badgeEl = document.getElementById('backend-map-badge');
  const titleEl = document.getElementById('backend-map-title');
  const summaryEl = document.getElementById('backend-map-summary');
  const modelsEl = document.getElementById('backend-map-models');
  const opsEl = document.getElementById('backend-map-ops');

  badgeEl.className = 'backend-map__badge backend-map__badge--' + module.badgeTone;
  badgeEl.textContent = module.badge;
  titleEl.textContent = module.title;
  summaryEl.textContent = module.summary;
  appendChips(modelsEl, module.models);
  appendChips(opsEl, module.operations);
}

function syncModuleButtons(moduleKey) {
  document.querySelectorAll('[data-module-key]').forEach((button) => {
    const isActive = button.dataset.moduleKey === moduleKey;
    button.classList.toggle('is-active', isActive);
    if (isActive) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

function setActiveModule(moduleKey) {
  boardState.activeModuleKey = MODULE_DEFINITIONS[moduleKey] ? moduleKey : 'board';
  syncModuleButtons(boardState.activeModuleKey);
  renderModulePanel(boardState.activeModuleKey);
}

function totalHours() { return CANVAS_END - CANVAS_START; }
function canvasWidthPx() { return totalHours() * COL_WIDTH; }

function formatHour(hour) {
  const n = ((hour % 24) + 24) % 24;
  return n.toString().padStart(2, '0') + ':00';
}

/** Clip a booking interval to a day window, return fractional hours */
function bookingToHours(startISO, endISO, dayStart, dayEnd) {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  const ds = dayStart.getTime();
  const de = dayEnd.getTime();
  const left = Math.max(s, ds);
  const right = Math.min(e, de);
  if (right <= left) return null;
  // Convert to fractional hours relative to CANVAS_START
  // dayStart corresponds to hour 0 of that day
  const msPerHour = 3600000;
  const startFrac = (left - ds) / msPerHour;
  const endFrac = (right - ds) / msPerHour;
  return { startHour: startFrac, endHour: endFrac };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Wall time in `timeZone` → UTC instant (same idea as prisma seed). */
function zonedWallToUtc(year, month, day, hour, minute, timeZone) {
  const target = `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  let lo = Date.UTC(year, month - 1, day - 1, 12, 0, 0);
  let hi = Date.UTC(year, month - 1, day + 1, 12, 0, 0);
  for (let i = 0; i < 56; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const got = fmt.format(new Date(mid));
    if (got === target) {
      return new Date(mid);
    }
    if (got < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return new Date(Date.UTC(year, month - 1, day, hour + 7, minute, 0));
}

function addOneGregorianDay(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + 1);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** Inclusive start, exclusive end: [00:00, next 00:00) in SCHEDULE_BOARD_TZ. */
function dayBounds(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const tz = SCHEDULE_BOARD_TZ;
  const start = zonedWallToUtc(y, m, d, 0, 0, tz);
  const next = addOneGregorianDay(y, m, d);
  const end = zonedWallToUtc(next.y, next.m, next.d, 0, 0, tz);
  return { start, end };
}

function formatDateInTimeZone(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Map booking status to a visual type */
function statusToType(status, isGrounded) {
  if (isGrounded) return 'ground-hold';
  const s = String(status || '').toUpperCase();
  if (s === 'IN_PROGRESS') return 'flight';
  if (s === 'DISPATCHED') return 'flight';
  if (s === 'SCHEDULED') return 'reserved';
  if (s === 'COMPLETED') return 'solo';
  return 'reserved';
}

function showBoardSummary(force = false) {
  const statusEl = document.getElementById('status-msg');
  if (!force && statusEl.classList.contains('is-error')) {
    return;
  }

  const filterValue = document.getElementById('input-filter')?.value.trim();
  const parts = [
    boardState.aircraftCount + ' aircraft',
    boardState.bookingCount + ' bookings',
  ];

  if (filterValue) {
    const visibleRows = document.querySelectorAll(
      '.resource-row:not([hidden])',
    ).length;
    parts.push(visibleRows + ' visible rows');
  }

  setStatusMessage(parts.join(' · '), 'info');
}

function applyRowFilter() {
  const filterInput = document.getElementById('input-filter');
  const query = (filterInput?.value || '').trim().toLowerCase();
  const rows = Array.from(document.querySelectorAll('.resource-row'));
  let visibleRows = 0;

  rows.forEach((row) => {
    const match = !query || (row.dataset.search || '').includes(query);
    row.hidden = !match;
    if (match) {
      visibleRows += 1;
    }
  });

  const rowsContainer = document.getElementById('resource-rows');
  let emptyState = document.getElementById('filter-empty-state');
  const shouldShowEmpty = query && rows.length > 0 && visibleRows === 0;

  if (shouldShowEmpty && !emptyState) {
    emptyState = document.createElement('div');
    emptyState.id = 'filter-empty-state';
    emptyState.className = 'empty-state empty-state--filter';
    emptyState.textContent = 'No loaded rows match the current filter.';
    rowsContainer.prepend(emptyState);
  }
  if (!shouldShowEmpty && emptyState) {
    emptyState.remove();
  }

  showBoardSummary(false);
}

function bindModuleControls() {
  document.querySelectorAll('[data-module-key]').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveModule(button.dataset.moduleKey);
    });
  });

  document.getElementById('btn-alerts').addEventListener('click', () => {
    setActiveModule('maintenance');
  });

  document.getElementById('btn-users').addEventListener('click', () => {
    setActiveModule('users');
  });
}

// ── SVG Icons (inline, matching v0) ─────────────────────

const ICONS = {
  plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
};

const TYPE_ICONS = {
  flight: ICONS.plane,
  solo: ICONS.user,
  reserved: ICONS.clock,
  maintenance: ICONS.alert,
  'ground-hold': ICONS.alert,
};

// ── Scroll state ────────────────────────────────────────

let scrollTimer = null;
let isCollapsed = false;

function onScroll() {
  if (!isCollapsed) {
    isCollapsed = true;
    applyCollapseState(true);
  }
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isCollapsed = false;
    applyCollapseState(false);
  }, 150);
}

function applyCollapseState(collapsed) {
  // Header label
  const headerLabel = document.querySelector('.timeline-header__label-text');
  if (headerLabel) {
    headerLabel.classList.toggle('is-collapsed', collapsed);
    headerLabel.textContent = collapsed ? 'FLEET' : 'Fleet Ops Center';
  }

  // Resource rows
  document.querySelectorAll('.resource-row__status-bar').forEach(el =>
    el.classList.toggle('is-collapsed', collapsed));
  document.querySelectorAll('.resource-row__name').forEach(el =>
    el.classList.toggle('is-collapsed', collapsed));
  document.querySelectorAll('.resource-row__subtitle').forEach(el =>
    el.classList.toggle('is-collapsed', collapsed));
}

// ── Build Timeline Header ───────────────────────────────

function buildTimelineHeader(currentHourNow) {
  const container = document.getElementById('timeline-header');
  container.innerHTML = '';

  // Label column
  const label = document.createElement('div');
  label.className = 'timeline-header__label';
  const labelText = document.createElement('span');
  labelText.className = 'timeline-header__label-text';
  labelText.textContent = 'Fleet Ops Center';
  label.appendChild(labelText);
  container.appendChild(label);

  // Canvas
  const canvas = document.createElement('div');
  canvas.className = 'timeline-header__canvas';
  canvas.style.width = canvasWidthPx() + 'px';

  const hoursRow = document.createElement('div');
  hoursRow.className = 'timeline-header__hours';

  const hourFloor = Math.floor(currentHourNow);
  for (let h = CANVAS_START; h < CANVAS_END; h++) {
    const cell = document.createElement('div');
    cell.className = 'timeline-header__hour';

    const isCurrent = h === hourFloor;
    const isMidnight = h % 24 === 0;

    if (isCurrent) cell.classList.add('timeline-header__hour--current');
    if (isMidnight) cell.classList.add('timeline-header__hour--midnight');

    // Day marker
    if (isMidnight && h !== 0) {
      const dayMark = document.createElement('span');
      dayMark.className = 'timeline-header__day-marker';
      dayMark.textContent = h > 0 ? '+1 DAY' : '-1 DAY';
      cell.appendChild(dayMark);
    }

    const hourLabel = document.createElement('span');
    hourLabel.className = 'timeline-header__hour-label';
    hourLabel.textContent = formatHour(h);
    cell.appendChild(hourLabel);

    if (isCurrent) {
      const tz = document.createElement('span');
      tz.className = 'timeline-header__tz';
      tz.textContent = TIMEZONE_LABEL;
      cell.appendChild(tz);
    }

    hoursRow.appendChild(cell);
  }

  canvas.appendChild(hoursRow);

  // Current time dot
  const dotLeft = (currentHourNow - CANVAS_START) * COL_WIDTH + COL_WIDTH / 2;
  const dot = document.createElement('div');
  dot.className = 'timeline-header__dot';
  dot.style.left = dotLeft + 'px';
  const dotInner = document.createElement('div');
  dotInner.className = 'timeline-header__dot-inner';
  dot.appendChild(dotInner);
  canvas.appendChild(dot);

  container.appendChild(canvas);
}

// ── Build Resource Row ──────────────────────────────────

function buildResourceRow(name, subtitle, status, bookings, currentHour) {
  const row = document.createElement('div');
  row.className = 'resource-row';
  row.setAttribute('role', 'listitem');
  row.setAttribute('aria-label', name + ', ' + subtitle);
  row.dataset.search = [
    name,
    subtitle,
    ...bookings.map((booking) => booking.title + ' ' + (booking.subtitle || '')),
  ]
    .join(' ')
    .toLowerCase();

  // Label
  const label = document.createElement('div');
  label.className = 'resource-row__label';

  const bar = document.createElement('span');
  bar.className = 'resource-row__status-bar resource-row__status-bar--' + status;
  label.appendChild(bar);

  const textBlock = document.createElement('div');
  textBlock.className = 'resource-row__text';

  const nameEl = document.createElement('span');
  nameEl.className = 'resource-row__name';
  nameEl.textContent = name;
  textBlock.appendChild(nameEl);

  const subEl = document.createElement('span');
  subEl.className = 'resource-row__subtitle resource-row__subtitle--' + status;
  subEl.textContent = subtitle;
  textBlock.appendChild(subEl);

  label.appendChild(textBlock);
  row.appendChild(label);

  // Canvas
  const canvas = document.createElement('div');
  canvas.className = 'resource-row__canvas';
  canvas.style.width = canvasWidthPx() + 'px';

  // Grid lines
  const grid = document.createElement('div');
  grid.className = 'resource-row__grid';
  for (let i = 0; i < totalHours(); i++) {
    const line = document.createElement('div');
    line.className = 'resource-row__grid-line';
    const hour = CANVAS_START + i;
    if (hour % 24 === 0) line.classList.add('resource-row__grid-line--midnight');
    grid.appendChild(line);
  }
  canvas.appendChild(grid);

  // Booking cards
  bookings.forEach(b => {
    canvas.appendChild(buildBookingCard(b));
  });

  // Now line
  const lineLeft = (currentHour - CANVAS_START) * COL_WIDTH + COL_WIDTH / 2;
  const nowLine = document.createElement('div');
  nowLine.className = 'resource-row__now-line';
  nowLine.style.left = lineLeft + 'px';
  canvas.appendChild(nowLine);

  row.appendChild(canvas);
  return row;
}

// ── Build Booking Card ──────────────────────────────────

function buildBookingCard(booking) {
  const { type, title, subtitle, startHour, endHour } = booking;
  const left = (startHour - CANVAS_START) * COL_WIDTH;
  const width = (endHour - startHour) * COL_WIDTH;

  const card = document.createElement('div');
  card.className = 'booking-card booking-card--' + type;
  card.style.left = left + 'px';
  card.style.width = width + 'px';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', title + (subtitle ? ', ' + subtitle : ''));

  if (type === 'ground-hold') {
    const titleEl = document.createElement('span');
    titleEl.className = 'booking-card__title';
    titleEl.textContent = title;
    card.appendChild(titleEl);
    return card;
  }

  // Icon
  const icon = document.createElement('div');
  icon.className = 'booking-card__icon';
  icon.innerHTML = TYPE_ICONS[type] || TYPE_ICONS.reserved;
  card.appendChild(icon);

  // Text
  const text = document.createElement('div');
  text.className = 'booking-card__text';

  const titleEl = document.createElement('span');
  titleEl.className = 'booking-card__title';
  titleEl.textContent = title;
  text.appendChild(titleEl);

  if (subtitle) {
    const subEl = document.createElement('span');
    subEl.className = 'booking-card__subtitle';
    subEl.textContent = subtitle;
    text.appendChild(subEl);
  }

  card.appendChild(text);
  return card;
}

// ── Format time range string ────────────────────────────

function formatTimeRange(startISO, endISO) {
  const opts = {
    timeZone: SCHEDULE_BOARD_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const fmt = (d) =>
    new Intl.DateTimeFormat('en-GB', opts).format(new Date(d));
  return fmt(startISO) + ' – ' + fmt(endISO);
}

// ── Render full schedule ────────────────────────────────

function renderSchedule(aircraft, bookings, bounds, dateStr) {
  const rowsContainer = document.getElementById('resource-rows');
  rowsContainer.innerHTML = '';

  const dayStart = bounds.start;
  const dayEnd = bounds.end;

  // "Now" position: hours since midnight in SCHEDULE_BOARD_TZ on this strip
  const now = new Date();
  const todayStr = formatDateInTimeZone(now, SCHEDULE_BOARD_TZ);
  const isToday = dateStr === todayStr;
  const currentHourNow = isToday
    ? (now.getTime() - dayStart.getTime()) / 3600000
    : ANCHOR_HOUR;

  // Build header
  buildTimelineHeader(currentHourNow);

  // Set canvas wrapper width
  const wrapper = document.getElementById('canvas-wrapper');
  wrapper.style.minWidth = (LABEL_WIDTH + canvasWidthPx()) + 'px';

  const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');

  // Build instructor rows
  const instructorMap = new Map();
  for (const b of activeBookings) {
    for (const p of (b.participants || [])) {
      if (p.role !== 'INSTRUCTOR') continue;
      if (!instructorMap.has(p.userId)) {
        instructorMap.set(p.userId, {
          id: p.userId,
          email: p.user?.email || p.userId,
        });
      }
    }
  }
  const instructors = Array.from(instructorMap.values()).sort((a, b) =>
    a.email.localeCompare(b.email));

  // Build aircraft rows
  const acSorted = [...aircraft].sort((a, b) =>
    a.tailNumber.localeCompare(b.tailNumber));

  if (instructors.length === 0 && acSorted.length === 0) {
    rowsContainer.innerHTML = '<div class="empty-state">No resources for this base on this day.</div>';
    boardState.aircraftCount = 0;
    boardState.bookingCount = 0;
    showBoardSummary(true);
    return;
  }

  // Instructors
  for (const inst of instructors) {
    const instBookings = activeBookings
      .filter(b => (b.participants || []).some(p =>
        p.role === 'INSTRUCTOR' && p.userId === inst.id))
      .map(b => {
        const hrs = bookingToHours(b.startTime, b.endTime, dayStart, dayEnd);
        if (!hrs) return null;
        const tail = b.aircraft?.tailNumber || 'Aircraft';
        const renter = b.user?.email?.split('@')[0] || 'Renter';
        return {
          type: statusToType(b.status, false),
          title: tail + ' · ' + renter,
          subtitle: formatTimeRange(b.startTime, b.endTime),
          startHour: hrs.startHour,
          endHour: hrs.endHour,
        };
      })
      .filter(Boolean);

    const displayName = inst.email.split('@')[0] || inst.email;
    const row = buildResourceRow(
      displayName,
      'CFI • ON DUTY',
      'instructor',
      instBookings,
      currentHourNow
    );
    rowsContainer.appendChild(row);
  }

  // Aircraft
  for (const ac of acSorted) {
    const isGrounded = ac.airworthinessStatus === 'GROUNDED';
    const acBookings = activeBookings
      .filter(b => b.aircraftId === ac.id || b.aircraft?.id === ac.id)
      .map(b => {
        const hrs = bookingToHours(b.startTime, b.endTime, dayStart, dayEnd);
        if (!hrs) return null;
        const renter = b.user?.email?.split('@')[0] || 'Booking';
        return {
          type: isGrounded ? 'ground-hold' : statusToType(b.status, false),
          title: isGrounded ? 'GROUND HOLD' : renter + ' · ' + b.status,
          subtitle: isGrounded ? undefined : formatTimeRange(b.startTime, b.endTime),
          startHour: hrs.startHour,
          endHour: hrs.endHour,
        };
      })
      .filter(Boolean);

    // If grounded and no bookings, show full-day ground hold
    if (isGrounded && acBookings.length === 0) {
      acBookings.push({
        type: 'ground-hold',
        title: 'GROUND HOLD',
        startHour: 0,
        endHour: 24,
      });
    }

    const status = isGrounded ? 'grounded' : 'ready';
    const statusLabel = isGrounded ? 'MX' : ac.airworthinessStatus || 'READY';
    const row = buildResourceRow(
      ac.tailNumber,
      ac.make + ' ' + ac.model + ' • ' + statusLabel,
      status,
      acBookings,
      currentHourNow
    );
    rowsContainer.appendChild(row);
  }

  // Scroll to anchor
  const scrollSurface = document.getElementById('scroll-surface');
  const anchorOffset = (-CANVAS_START + ANCHOR_HOUR) * COL_WIDTH;
  scrollSurface.scrollLeft = anchorOffset;

  boardState.aircraftCount = aircraft.length;
  boardState.bookingCount = bookings.length;
  applyRowFilter();
  showBoardSummary(true);
}

// ── Load Board ──────────────────────────────────────────

async function loadBoard() {
  const baseId = document.getElementById('select-base').value;
  const dateStr = document.getElementById('input-date').value;
  setStatusMessage('', 'info');

  if (!baseId) {
    setStatusMessage('Select a base.', 'error');
    return;
  }
  const bounds = dayBounds(dateStr);
  if (!bounds) {
    setStatusMessage('Pick a valid date.', 'error');
    return;
  }

  setStatusMessage('Loading…', 'busy');

  // Widen the GraphQL window by ±24h so bookings stored in UTC / other TZ still
  // overlap the selected local day; renderSchedule still clips to `bounds`.
  const MS_DAY = 24 * 60 * 60 * 1000;
  const queryStart = new Date(bounds.start.getTime() - MS_DAY);
  const queryEnd = new Date(bounds.end.getTime() + MS_DAY);

  const [acRes, bkRes] = await Promise.all([
    graphqlRequest(Q_AIRCRAFT_BY_BASE, { baseId }),
    graphqlRequest(Q_BOOKINGS_BY_BASE, {
      baseId,
      startDate: queryStart.toISOString(),
      endDate: queryEnd.toISOString(),
    }),
  ]);

  // Aircraft errors are fatal (nothing to show).
  const acErrs = (acRes.errors || []).map(e => e.message).join('; ');
  if (acErrs) {
    setStatusMessage(acErrs, 'error');
    document.getElementById('resource-rows').innerHTML = '';
    boardState.aircraftCount = 0;
    boardState.bookingCount = 0;
    return;
  }

  // Booking errors are non-fatal — still render aircraft rows with empty bookings.
  const bkErrs = (bkRes.errors || []).map(e => e.message).join('; ');

  renderSchedule(
    acRes.data?.aircraftByBase || [],
    bkRes.data?.bookingsByBase || [],
    bounds,
    dateStr
  );

  if (bkErrs) {
    setStatusMessage(
      'Bookings unavailable (login as instructor/dispatcher to see them): ' + bkErrs,
      'error',
    );
  }
}

// ── Init ────────────────────────────────────────────────

async function init() {
  document.getElementById('input-date').value = formatDateInTimeZone(
    new Date(),
    SCHEDULE_BOARD_TZ,
  );

  // Scroll collapse behavior
  const scrollSurface = document.getElementById('scroll-surface');
  scrollSurface.addEventListener('scroll', onScroll, { passive: true });

  // Load button
  document.getElementById('btn-load').addEventListener('click', loadBoard);
  document.getElementById('fab').addEventListener('click', loadBoard);
  document.getElementById('input-filter').addEventListener('input', applyRowFilter);
  bindModuleControls();
  setActiveModule(boardState.activeModuleKey);

  // Build empty header on load
  buildTimelineHeader(ANCHOR_HOUR);
  const wrapper = document.getElementById('canvas-wrapper');
  wrapper.style.minWidth = (LABEL_WIDTH + canvasWidthPx()) + 'px';

  // Scroll to anchor
  requestAnimationFrame(() => {
    scrollSurface.scrollLeft = (-CANVAS_START + ANCHOR_HOUR) * COL_WIDTH;
  });

  // Fetch bases for dropdown
  const selectBase = document.getElementById('select-base');
  const basesRes = await graphqlRequest(Q_BASES);
  const bases = basesRes.data?.bases || [];
  bases.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name + ' (' + b.icaoCode + ')';
    selectBase.appendChild(opt);
  });

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const qBase = params.get('baseId');
  const qDate = params.get('date');
  if (qBase) {
    selectBase.value = qBase;
  } else if (bases.length > 0) {
    // Auto-select the first base so the ribbon loads on page open
    selectBase.value = bases[0].id;
  }
  if (qDate) document.getElementById('input-date').value = qDate;

  // Auto-load if a base is now selected
  if (selectBase.value) loadBoard();
}

init();
