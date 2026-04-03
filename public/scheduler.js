/**
 * FlyOS ribbon scheduler — read-only day board (aircraft + instructor rows).
 * Optional JWT: sessionStorage key flyos_demo_jwt (set via GraphQL login).
 */

const TOKEN_KEY = 'flyos_demo_jwt';
const HOUR_START = 0;
const HOUR_END = 24;
const PX_PER_HOUR = 72;
const ROW_H = 52;

let nowTimer = null;

const Q_BASES = `
  query Bases {
    bases {
      id
      name
      icaoCode
    }
  }
`;

const Q_AIRCRAFT_BY_BASE = `
  query AircraftByBase($baseId: ID!) {
    aircraftByBase(baseId: $baseId) {
      id
      tailNumber
      make
      model
      airworthinessStatus
    }
  }
`;

const Q_BOOKINGS_BY_BASE = `
  query BookingsByBase($baseId: String!, $startDate: DateTime, $endDate: DateTime) {
    bookingsByBase(baseId: $baseId, startDate: $startDate, endDate: $endDate) {
      id
      status
      startTime
      endTime
      aircraftId
      user { email }
      aircraft { id tailNumber }
      participants { userId role user { email } }
    }
  }
`;

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function dayBounds(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  // Use local time for the bounds
  return {
    start: new Date(y, m - 1, d, HOUR_START, 0, 0, 0),
    end: new Date(y, m - 1, d, HOUR_END, 0, 0, 0),
  };
}

function timelineWidthPx() {
  return (HOUR_END - HOUR_START) * PX_PER_HOUR;
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
  try {
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    return { errors: [{ message: 'Invalid JSON: ' + String(e) }], httpStatus: res.status };
  }
  return { data: body.data, errors: body.errors, httpStatus: res.status, httpOk: res.ok };
}

function clipInterval(bookingStart, bookingEnd, dayStart, dayEnd) {
  const s = new Date(bookingStart).getTime();
  const e = new Date(bookingEnd).getTime();
  const ds = dayStart.getTime();
  const de = dayEnd.getTime();
  const left = Math.max(s, ds);
  const right = Math.min(e, de);
  if (right <= left) return null;
  return { left, right };
}

function intervalToPercent(leftMs, rightMs, dayStart, dayEnd) {
  const ds = dayStart.getTime();
  const de = dayEnd.getTime();
  const span = de - ds;
  const p0 = ((leftMs - ds) / span) * 100;
  const p1 = ((rightMs - ds) / span) * 100;
  return { left: Math.max(0, p0), width: Math.max(0, p1 - p0) };
}

function ribbonClass(status) {
  const s = String(status || '');
  if (['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(s)) {
    return `ribbon ribbon--${s}`;
  }
  return 'ribbon';
}

function buildHourRuler() {
  const ruler = document.createElement('div');
  ruler.className = 'hour-ruler';
  ruler.style.width = `${timelineWidthPx()}px`;
  for (let h = HOUR_START; h < HOUR_END; h++) {
    const cell = document.createElement('div');
    cell.className = 'hour-cell';
    cell.textContent = `${String(h).padStart(2, '0')}:00`;
    ruler.appendChild(cell);
  }
  return ruler;
}

function syncScroll(headerEl, bodyEl, labelsEl) {
  let isScrolling = false;

  const onScrollBody = () => {
    if (isScrolling) return;
    isScrolling = true;
    headerEl.scrollLeft = bodyEl.scrollLeft;
    labelsEl.scrollTop = bodyEl.scrollTop;
    isScrolling = false;
  };

  const onScrollHeader = () => {
    if (isScrolling) return;
    isScrolling = true;
    bodyEl.scrollLeft = headerEl.scrollLeft;
    isScrolling = false;
  };

  const onScrollLabels = () => {
    if (isScrolling) return;
    isScrolling = true;
    bodyEl.scrollTop = labelsEl.scrollTop;
    isScrolling = false;
  };

  bodyEl.addEventListener('scroll', onScrollBody, { passive: true });
  headerEl.addEventListener('scroll', onScrollHeader, { passive: true });
  labelsEl.addEventListener('scroll', onScrollLabels, { passive: true });
}

function renderSchedule(aircraft, bookings, bounds, selectedDateStr) {
  const labelsCol = document.getElementById('labels-col');
  const gridInner = document.getElementById('grid-inner');
  const gridScrollStage = document.getElementById('grid-scroll-stage');
  const nowLine = document.getElementById('now-line');
  const headerInner = document.getElementById('hour-ruler-inner');

  labelsCol.innerHTML = '';
  gridInner.innerHTML = '';
  headerInner.innerHTML = '';
  headerInner.appendChild(buildHourRuler());
  gridScrollStage.style.width = `${timelineWidthPx()}px`;

  const dayStart = bounds.start;
  const dayEnd = bounds.end;
  const activeBookings = bookings.filter((b) => b.status !== 'CANCELLED');

  const instructorMap = new Map();
  for (const b of activeBookings) {
    const parts = b.participants || [];
    for (const p of parts) {
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
    a.email.localeCompare(b.email),
  );

  const acSorted = [...aircraft].sort((a, b) => a.tailNumber.localeCompare(b.tailNumber));

  const rows = [];

  for (const inst of instructors) {
    rows.push({ type: 'instructor', data: inst });
  }
  for (const ac of acSorted) {
    rows.push({ type: 'aircraft', data: ac });
  }

  if (rows.length === 0) {
    labelsCol.innerHTML =
      '<div class="empty-state">No aircraft (and no instructor-only rows) for this base.</div>';
    gridInner.innerHTML = '';
    nowLine.style.display = 'none';
    if (nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
    return;
  }

  const totalHeight = rows.length * ROW_H;
  gridInner.style.width = `${timelineWidthPx()}px`;
  gridInner.style.minHeight = `${totalHeight}px`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const showNow = selectedDateStr === todayStr;
  const nowMs = Date.now();

  if (showNow && nowMs >= dayStart.getTime() && nowMs <= dayEnd.getTime()) {
    const { left } = intervalToPercent(nowMs, nowMs + 1, dayStart, dayEnd);
    nowLine.style.display = 'block';
    nowLine.style.left = `${left}%`;
    nowLine.style.height = `${totalHeight}px`;
    nowLine.style.top = '0';
  } else {
    nowLine.style.display = 'none';
  }

  rows.forEach((row, idx) => {
    const label = document.createElement('div');
    label.className = 'resource-label';

    const bar = document.createElement('div');
    bar.className = 'resource-label__bar';

    const text = document.createElement('div');
    text.className = 'resource-label__text';

    const title = document.createElement('div');
    title.className = 'resource-label__title';
    const sub = document.createElement('div');
    sub.className = 'resource-label__sub';

    const lane = document.createElement('div');
    lane.className = 'timeline-row';
    lane.style.width = `${timelineWidthPx()}px`;

    if (row.type === 'instructor') {
      bar.classList.add('resource-label__bar--instructor');
      title.textContent = row.data.email.split('@')[0] || row.data.email;
      sub.textContent = 'CFI • schedule';
      const instBookings = activeBookings.filter((b) =>
        (b.participants || []).some((p) => p.role === 'INSTRUCTOR' && p.userId === row.data.id),
      );
      instBookings.forEach((b) => {
        const iv = clipInterval(b.startTime, b.endTime, dayStart, dayEnd);
        if (!iv) return;
        const { left, width } = intervalToPercent(iv.left, iv.right, dayStart, dayEnd);
        const rib = document.createElement('div');
        rib.className = ribbonClass(b.status);
        rib.style.left = `${left}%`;
        rib.style.width = `${width}%`;
        const tail = b.aircraft?.tailNumber || 'Aircraft';
        const renter = b.user?.email?.split('@')[0] || 'Renter';
        rib.textContent = `${tail} · ${renter}`;
        rib.title = `${b.status} ${b.startTime}–${b.endTime}`;
        lane.appendChild(rib);
      });
    } else {
      const ac = row.data;
      const grounded = ac.airworthinessStatus === 'GROUNDED';
      if (grounded) {
        bar.classList.add('resource-label__bar--grounded');
        lane.classList.add('timeline-row--grounded');
        const gh = document.createElement('div');
        gh.className = 'ground-hold';
        gh.textContent = 'Ground hold';
        lane.appendChild(gh);
      } else {
        bar.classList.add('resource-label__bar--ready');
      }
      title.textContent = ac.tailNumber;
      sub.textContent = `${ac.make} ${ac.model} · ${ac.airworthinessStatus || ''}`;

      const acBookings = activeBookings.filter((b) => b.aircraftId === ac.id);
      acBookings.forEach((b) => {
        const iv = clipInterval(b.startTime, b.endTime, dayStart, dayEnd);
        if (!iv) return;
        const { left, width } = intervalToPercent(iv.left, iv.right, dayStart, dayEnd);
        const rib = document.createElement('div');
        rib.className = ribbonClass(b.status);
        rib.style.left = `${left}%`;
        rib.style.width = `${width}%`;
        const renter = b.user?.email?.split('@')[0] || 'Booking';
        rib.textContent = `${renter} · ${b.status}`;
        rib.title = `${b.startTime} – ${b.endTime}`;
        lane.appendChild(rib);
      });
    }

    label.appendChild(bar);
    text.appendChild(title);
    text.appendChild(sub);
    label.appendChild(text);
    labelsCol.appendChild(label);
    gridInner.appendChild(lane);
  });

  if (showNow) {
    const refreshNow = () => {
      const n = Date.now();
      if (n < dayStart.getTime() || n > dayEnd.getTime()) {
        nowLine.style.display = 'none';
        return;
      }
      const { left } = intervalToPercent(n, n + 1, dayStart, dayEnd);
      nowLine.style.left = `${left}%`;
    };
    if (nowTimer) clearInterval(nowTimer);
    nowTimer = setInterval(refreshNow, 60 * 1000);
  } else {
    if (nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
  }
}

async function loadBoard() {
  const statusEl = document.getElementById('status-msg');
  const selectBase = document.getElementById('select-base');
  const baseId = selectBase.value;
  const dateStr = document.getElementById('input-date').value;
  statusEl.textContent = '';
  statusEl.classList.remove('is-error');

  if (!baseId) {
    statusEl.textContent = 'Select a base.';
    statusEl.classList.add('is-error');
    return;
  }
  const bounds = dayBounds(dateStr);
  if (!bounds) {
    statusEl.textContent = 'Pick a valid date.';
    statusEl.classList.add('is-error');
    return;
  }

  statusEl.textContent = 'Loading…';

  const [acRes, bkRes] = await Promise.all([
    graphqlRequest(Q_AIRCRAFT_BY_BASE, { baseId }),
    graphqlRequest(Q_BOOKINGS_BY_BASE, {
      baseId,
      startDate: bounds.start.toISOString(),
      endDate: bounds.end.toISOString(),
    }),
  ]);

  const errs = [...(acRes.errors || []), ...(bkRes.errors || [])].map((e) => e.message).join('; ');
  if (errs) {
    statusEl.textContent = errs;
    statusEl.classList.add('is-error');
    document.getElementById('labels-col').innerHTML = '';
    document.getElementById('grid-inner').innerHTML = '';
    return;
  }

  const aircraft = acRes.data?.aircraftByBase || [];
  const bookings = bkRes.data?.bookingsByBase || [];

  statusEl.textContent = `${aircraft.length} aircraft · ${bookings.length} bookings in window (incl. cancelled).`;

  renderSchedule(aircraft, bookings, bounds, dateStr);
  statusEl.classList.remove('is-error');
}

async function fetchBases() {
  const res = await graphqlRequest(Q_BASES);
  if (res.errors) {
    console.error('Failed to fetch bases:', res.errors);
    return [];
  }
  return res.data?.bases || [];
}

async function init() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('input-date').value = today;

  const headerScroll = document.getElementById('schedule-header-scroll');
  const gridScroll = document.getElementById('grid-scroll');
  const labelsCol = document.getElementById('labels-col');
  syncScroll(headerScroll, gridScroll, labelsCol);

  document.getElementById('btn-load').addEventListener('click', () => loadBoard());

  const selectBase = document.getElementById('select-base');
  const bases = await fetchBases();
  bases.forEach((b) => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.icaoCode})`;
    selectBase.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  const qBase = params.get('baseId');
  const qDate = params.get('date');
  if (qBase) selectBase.value = qBase;
  if (qDate) document.getElementById('input-date').value = qDate;

  if (selectBase.value) {
    loadBoard();
  }
}

init();
