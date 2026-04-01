/* FlyOS disposable demo — POST /graphql, no auth headers */

const Q_ME = `
  query Me {
    me {
      id
      email
      role
      createdAt
      updatedAt
    }
  }
`;

const Q_USERS = `
  query Users {
    users {
      id
      email
      role
      createdAt
      updatedAt
    }
  }
`;

const Q_AIRCRAFT = `
  query Aircraft {
    aircraft {
      id
      tailNumber
      make
      model
      airworthinessStatus
      createdAt
      updatedAt
    }
  }
`;

const Q_BOOKINGS = `
  query Bookings {
    bookings {
      id
      startTime
      endTime
      createdAt
      userId
      aircraftId
      user {
        id
        email
      }
      aircraft {
        id
        tailNumber
      }
    }
  }
`;

const Q_MY_BOOKINGS = `
  query MyBookings {
    myBookings {
      id
      startTime
      endTime
      createdAt
      userId
      aircraftId
      aircraft {
        id
        tailNumber
      }
    }
  }
`;

const M_CREATE_AIRCRAFT = `
  mutation CreateAircraft($input: CreateAircraftInput!) {
    createAircraft(input: $input) {
      id
      tailNumber
      make
      model
      airworthinessStatus
    }
  }
`;

const M_UPDATE_AIRCRAFT_STATUS = `
  mutation UpdateAircraftStatus($id: String!, $status: AirworthinessStatus!) {
    updateAircraftStatus(id: $id, status: $status) {
      id
      tailNumber
      airworthinessStatus
    }
  }
`;

const M_CREATE_BOOKING = `
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      startTime
      endTime
      userId
      aircraftId
    }
  }
`;

const M_INGEST_MAINTENANCE = `
  mutation IngestMaint($input: BatchMaintenanceInput!) {
    ingestMaintenanceLogs(input: $input) {
      id
      aircraftId
      timestamp
      data
    }
  }
`;

const M_INGEST_TELEMETRY = `
  mutation IngestTel($input: BatchTelemetryInput!) {
    ingestTelemetry(input: $input) {
      id
      aircraftId
      timestamp
      data
    }
  }
`;

function $(id) {
  return document.getElementById(id);
}

function setOutput(obj) {
  $('output').textContent = JSON.stringify(obj, null, 2);
}

async function graphqlRequest(query, variables) {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: variables ?? null }),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    return {
      httpStatus: res.status,
      httpOk: res.ok,
      parseError: String(e),
      raw: text,
    };
  }
  return {
    httpStatus: res.status,
    httpOk: res.ok,
    data: body.data,
    errors: body.errors,
    extensions: body.extensions,
  };
}

async function runQuery(query, variables) {
  const result = await graphqlRequest(query, variables);
  setOutput(result);
}

function formDataToObject(form) {
  const fd = new FormData(form);
  const o = {};
  for (const [k, v] of fd.entries()) {
    o[k] = typeof v === 'string' ? v : String(v);
  }
  return o;
}

document.getElementById('btn-me').addEventListener('click', () => runQuery(Q_ME));
document.getElementById('btn-users').addEventListener('click', () => runQuery(Q_USERS));
document.getElementById('btn-aircraft').addEventListener('click', () => runQuery(Q_AIRCRAFT));
document.getElementById('btn-bookings').addEventListener('click', () => runQuery(Q_BOOKINGS));
document.getElementById('btn-my-bookings').addEventListener('click', () => runQuery(Q_MY_BOOKINGS));

document.getElementById('form-create-aircraft').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formDataToObject(e.target);
  await runQuery(M_CREATE_AIRCRAFT, {
    input: {
      tailNumber: f.tailNumber,
      make: f.make,
      model: f.model,
    },
  });
});

document.getElementById('form-update-aircraft-status').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formDataToObject(e.target);
  await runQuery(M_UPDATE_AIRCRAFT_STATUS, {
    id: f.id,
    status: f.status,
  });
});

document.getElementById('form-create-booking').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formDataToObject(e.target);
  await runQuery(M_CREATE_BOOKING, {
    input: {
      aircraftId: f.aircraftId,
      startTime: f.startTime,
      endTime: f.endTime,
    },
  });
});

document.getElementById('form-ingest-maintenance').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formDataToObject(e.target);
  let data;
  try {
    data = JSON.parse(f.data);
  } catch (err) {
    setOutput({ clientError: 'maintenance data must be valid JSON object', detail: String(err) });
    return;
  }
  await runQuery(M_INGEST_MAINTENANCE, {
    input: {
      entries: [{ aircraftId: f.aircraftId, data }],
    },
  });
});

document.getElementById('form-ingest-telemetry').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formDataToObject(e.target);
  let data;
  try {
    data = JSON.parse(f.data);
  } catch (err) {
    setOutput({ clientError: 'telemetry data must be valid JSON object', detail: String(err) });
    return;
  }
  await runQuery(M_INGEST_TELEMETRY, {
    input: {
      entries: [{ aircraftId: f.aircraftId, data }],
    },
  });
});
