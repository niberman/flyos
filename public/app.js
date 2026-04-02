/* FlyOS Fleet Dashboard */

const TOKEN_KEY = 'flyos_demo_jwt';

const Q_BASES = `
  query Bases {
    bases { id name icaoCode }
  }
`;

const Q_DASHBOARD = `
  query Dashboard {
    aircraft {
      id tailNumber make model airworthinessStatus hobbsHours
      homeBase { id name icaoCode }
    }
    bookings {
      id status startTime endTime
      user { email }
      aircraft { tailNumber }
    }
  }
`;

const M_LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { access_token organizationId }
  }
`;

const M_CREATE_AIRCRAFT = `
  mutation CreateAircraft($input: CreateAircraftInput!) {
    createAircraft(input: $input) { id tailNumber }
  }
`;

const M_DISPATCH_BOOKING = `
  mutation DispatchBooking($input: DispatchBookingInput!) {
    dispatchBooking(input: $input) { id status }
  }
`;

const M_COMPLETE_BOOKING = `
  mutation CompleteBooking($input: CompleteBookingInput!) {
    completeBooking(input: $input) { id status }
  }
`;

function $(id) { return document.getElementById(id); }

async function graphqlRequest(query, variables) {
  const headers = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const res = await fetch('/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: variables ?? null }),
  });
  const body = await res.json();
  return body;
}

function updateAuthIndicator() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  $('auth-indicator').textContent = token ? 'Authenticated' : 'Dev Mode';
}

function setOutput(obj) {
  $('output').textContent = JSON.stringify(obj, null, 2);
}

async function loadDashboard() {
  const res = await graphqlRequest(Q_DASHBOARD);
  if (res.errors) {
    setOutput(res);
    return;
  }

  const aircraft = res.data.aircraft || [];
  const bookings = (res.data.bookings || []).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // Overview Stats
  $('stat-total-aircraft').textContent = aircraft.length;
  $('stat-ready-aircraft').textContent = aircraft.filter(a => a.airworthinessStatus === 'FLIGHT_READY').length;
  $('stat-active-bookings').textContent = bookings.filter(b => b.status === 'SCHEDULED' || b.status === 'DISPATCHED').length;

  // Bookings Table (Overview)
  const bookingsTbody = $('bookings-tbody');
  bookingsTbody.innerHTML = bookings.slice(0, 10).map(b => `
    <tr>
      <td>${b.aircraft?.tailNumber || 'N/A'}</td>
      <td>${b.user?.email.split('@')[0] || 'Unknown'}</td>
      <td>${new Date(b.startTime).toLocaleString()}</td>
      <td>${new Date(b.endTime).toLocaleString()}</td>
      <td><span class="status-badge">${b.status}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center">No recent bookings.</td></tr>';

  // Fleet Table
  const fleetTbody = $('fleet-tbody');
  fleetTbody.innerHTML = aircraft.map(a => `
    <tr>
      <td><strong>${a.tailNumber}</strong></td>
      <td>${a.make} ${a.model}</td>
      <td><span class="status-badge ${a.airworthinessStatus === 'FLIGHT_READY' ? 'status-badge--ready' : 'status-badge--grounded'}">${a.airworthinessStatus}</span></td>
      <td>${a.homeBase?.icaoCode || 'N/A'}</td>
      <td>${a.hobbsHours}</td>
    </tr>
  `).join('');
}

async function loadBases() {
  const res = await graphqlRequest(Q_BASES);
  const select = $('select-home-base-aircraft');
  if (res.data?.bases) {
    res.data.bases.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.name} (${b.icaoCode})`;
      select.appendChild(opt);
    });
  }
}

// Tab Switching
document.querySelectorAll('.tab-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('is-active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('is-active'));
    
    link.classList.add('is-active');
    $(`tab-${link.dataset.tab}`).classList.add('is-active');
  });
});

// Forms
$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await graphqlRequest(M_LOGIN, {
    input: { email: fd.get('email'), password: fd.get('password') }
  });
  if (res.data?.login?.access_token) {
    sessionStorage.setItem(TOKEN_KEY, res.data.login.access_token);
    updateAuthIndicator();
    loadDashboard();
  }
  setOutput(res);
});

$('btn-clear-token').addEventListener('click', () => {
  sessionStorage.removeItem(TOKEN_KEY);
  updateAuthIndicator();
  location.reload();
});

$('form-create-aircraft').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await graphqlRequest(M_CREATE_AIRCRAFT, {
    input: {
      tailNumber: fd.get('tailNumber'),
      make: fd.get('make'),
      model: fd.get('model'),
      homeBaseId: fd.get('homeBaseId')
    }
  });
  setOutput(res);
  if (!res.errors) loadDashboard();
});

$('form-dispatch-booking').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await graphqlRequest(M_DISPATCH_BOOKING, {
    input: {
      bookingId: fd.get('bookingId'),
      hobbsOut: parseFloat(fd.get('hobbsOut'))
    }
  });
  setOutput(res);
  if (!res.errors) loadDashboard();
});

$('form-complete-booking').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await graphqlRequest(M_COMPLETE_BOOKING, {
    input: {
      bookingId: fd.get('bookingId'),
      hobbsIn: parseFloat(fd.get('hobbsIn'))
    }
  });
  setOutput(res);
  if (!res.errors) loadDashboard();
});

// Init
updateAuthIndicator();
loadDashboard();
loadBases();
