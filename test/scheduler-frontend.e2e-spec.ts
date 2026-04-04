/**
 * Scheduler frontend tests — validates the time ribbon DOM rendering,
 * pure helper functions, and scroll-collapse behavior.
 *
 * Runs in jsdom: loads scheduler.js into a minimal DOM that mirrors
 * scheduler.html's structure, then exercises the public functions.
 *
 * @jest-environment jsdom
 */

import * as fs from 'fs';
import * as path from 'path';

const publicDir = path.join(__dirname, '..', 'public');
const schedulerJs = fs.readFileSync(
  path.join(publicDir, 'scheduler.js'),
  'utf-8',
);
const schedulerHtml = fs.readFileSync(
  path.join(publicDir, 'scheduler.html'),
  'utf-8',
);

// ── Helpers to inject the scheduler into jsdom ──────────

function setupDomAndStubs() {
  document.documentElement.innerHTML = schedulerHtml;

  // Stub fetch so init() doesn't blow up trying to reach /graphql
  (global as any).fetch = jest.fn().mockResolvedValue({
    text: () => Promise.resolve(JSON.stringify({ data: { bases: [] } })),
  });

  // Stub sessionStorage
  const storage: Record<string, string> = {};
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => {
        storage[k] = v;
      },
      removeItem: (k: string) => {
        delete storage[k];
      },
    },
    writable: true,
    configurable: true,
  });
}

// ── Tests ───────────────────────────────────────────────

describe('Scheduler HTML structure', () => {
  it('contains all required DOM anchors', () => {
    document.documentElement.innerHTML = schedulerHtml;

    expect(document.getElementById('timeline-header')).not.toBeNull();
    expect(document.getElementById('resource-rows')).not.toBeNull();
    expect(document.getElementById('scroll-surface')).not.toBeNull();
    expect(document.getElementById('canvas-wrapper')).not.toBeNull();
    expect(document.getElementById('select-base')).not.toBeNull();
    expect(document.getElementById('input-date')).not.toBeNull();
    expect(document.getElementById('btn-load')).not.toBeNull();
    expect(document.getElementById('fab')).not.toBeNull();
    expect(document.getElementById('status-msg')).not.toBeNull();
    expect(document.getElementById('backend-map')).not.toBeNull();
    expect(document.getElementById('backend-map-title')).not.toBeNull();
  });

  it('has sidebar with navigation buttons', () => {
    document.documentElement.innerHTML = schedulerHtml;
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toBeNull();
    const buttons = sidebar!.querySelectorAll('.sidebar__btn');
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('has top bar with brand, tabs, and search', () => {
    document.documentElement.innerHTML = schedulerHtml;
    expect(document.querySelector('.top-bar__name')!.textContent).toBe(
      'FlyOS',
    );
    const tabs = document.querySelectorAll('.top-bar__tab');
    expect(tabs.length).toBe(4);
    expect(Array.from(tabs).map((tab) => tab.textContent)).toEqual([
      'BOARD',
      'FLEET',
      'BOOKINGS',
      'MAINTENANCE',
    ]);
    expect(document.getElementById('input-filter')).not.toBeNull();
  });

  it('has FAB button', () => {
    document.documentElement.innerHTML = schedulerHtml;
    const fab = document.getElementById('fab');
    expect(fab).not.toBeNull();
    expect(fab!.getAttribute('aria-label')).toBe('Reload board');
  });
});

describe('Scheduler CSS', () => {
  const schedulerCss = fs.readFileSync(
    path.join(publicDir, 'scheduler.css'),
    'utf-8',
  );

  it('defines all FlyOS design tokens', () => {
    expect(schedulerCss).toContain('--bg-primary: #08090a');
    expect(schedulerCss).toContain('--accent-blue: #2979ff');
    expect(schedulerCss).toContain('--accent-green: #00e676');
    expect(schedulerCss).toContain('--accent-yellow: #ffd600');
    expect(schedulerCss).toContain('--accent-red: #ff5252');
    expect(schedulerCss).toContain('--col-width: 120px');
    expect(schedulerCss).toContain('--label-width: 280px');
  });

  it('includes styles for all booking card types', () => {
    expect(schedulerCss).toContain('.booking-card--flight');
    expect(schedulerCss).toContain('.booking-card--solo');
    expect(schedulerCss).toContain('.booking-card--reserved');
    expect(schedulerCss).toContain('.booking-card--maintenance');
    expect(schedulerCss).toContain('.booking-card--ground-hold');
  });

  it('includes collapse animation styles', () => {
    expect(schedulerCss).toContain('.resource-row__status-bar.is-collapsed');
    expect(schedulerCss).toContain('.resource-row__name.is-collapsed');
    expect(schedulerCss).toContain('.resource-row__subtitle.is-collapsed');
    expect(schedulerCss).toContain(
      '.timeline-header__label-text.is-collapsed',
    );
  });
});

describe('Scheduler JS — pure functions', () => {
  let formatHour: (hour: number) => string;
  let bookingToHours: (
    startISO: string,
    endISO: string,
    dayStart: Date,
    dayEnd: Date,
  ) => { startHour: number; endHour: number } | null;
  let dayBounds: (dateStr: string) => { start: Date; end: Date } | null;
  let statusToType: (status: string, isGrounded: boolean) => string;
  let totalHours: () => number;
  let canvasWidthPx: () => number;
  let pad2: (n: number) => string;
  let zonedWallToUtc: (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timeZone: string,
  ) => Date;
  let addOneGregorianDay: (
    y: number,
    m: number,
    d: number,
  ) => { y: number; m: number; d: number };
  let formatDateInTimeZone: (date: Date, timeZone: string) => string;

  beforeAll(() => {
    const preamble = `
      globalThis.__test_formatHour = formatHour;
      globalThis.__test_bookingToHours = bookingToHours;
      globalThis.__test_dayBounds = dayBounds;
      globalThis.__test_statusToType = statusToType;
      globalThis.__test_totalHours = totalHours;
      globalThis.__test_canvasWidthPx = canvasWidthPx;
      globalThis.__test_pad2 = pad2;
      globalThis.__test_zonedWallToUtc = zonedWallToUtc;
      globalThis.__test_addOneGregorianDay = addOneGregorianDay;
      globalThis.__test_formatDateInTimeZone = formatDateInTimeZone;
    `;

    setupDomAndStubs();
    const fn = new Function(schedulerJs + '\n' + preamble);
    fn();

    formatHour = (globalThis as any).__test_formatHour;
    bookingToHours = (globalThis as any).__test_bookingToHours;
    dayBounds = (globalThis as any).__test_dayBounds;
    statusToType = (globalThis as any).__test_statusToType;
    totalHours = (globalThis as any).__test_totalHours;
    canvasWidthPx = (globalThis as any).__test_canvasWidthPx;
    pad2 = (globalThis as any).__test_pad2;
    zonedWallToUtc = (globalThis as any).__test_zonedWallToUtc;
    addOneGregorianDay = (globalThis as any).__test_addOneGregorianDay;
    formatDateInTimeZone = (globalThis as any).__test_formatDateInTimeZone;
  });

  describe('formatHour', () => {
    it('formats positive hours', () => {
      expect(formatHour(0)).toBe('00:00');
      expect(formatHour(8)).toBe('08:00');
      expect(formatHour(23)).toBe('23:00');
    });

    it('wraps hours > 24 to next day', () => {
      expect(formatHour(25)).toBe('01:00');
      expect(formatHour(36)).toBe('12:00');
    });

    it('wraps negative hours to previous day', () => {
      expect(formatHour(-1)).toBe('23:00');
      expect(formatHour(-12)).toBe('12:00');
    });
  });

  describe('pad2', () => {
    it('pads single digits', () => {
      expect(pad2(1)).toBe('01');
      expect(pad2(9)).toBe('09');
    });

    it('leaves double digits unchanged', () => {
      expect(pad2(10)).toBe('10');
      expect(pad2(23)).toBe('23');
    });
  });

  describe('addOneGregorianDay', () => {
    it('advances a normal date by one day', () => {
      expect(addOneGregorianDay(2026, 4, 3)).toEqual({
        y: 2026,
        m: 4,
        d: 4,
      });
    });

    it('rolls over month boundary', () => {
      expect(addOneGregorianDay(2026, 1, 31)).toEqual({
        y: 2026,
        m: 2,
        d: 1,
      });
    });

    it('rolls over year boundary', () => {
      expect(addOneGregorianDay(2026, 12, 31)).toEqual({
        y: 2027,
        m: 1,
        d: 1,
      });
    });
  });

  describe('zonedWallToUtc', () => {
    it('converts Denver noon to a UTC Date', () => {
      // Denver is UTC-7 (standard) or UTC-6 (daylight saving)
      const result = zonedWallToUtc(2026, 1, 15, 12, 0, 'America/Denver');
      expect(result).toBeInstanceOf(Date);
      // January = MST = UTC-7, so 12:00 MT → 19:00 UTC
      expect(result.getUTCHours()).toBe(19);
      expect(result.getUTCMinutes()).toBe(0);
    });

    it('handles DST (summer time)', () => {
      // July = MDT = UTC-6, so 12:00 MT → 18:00 UTC
      const result = zonedWallToUtc(2026, 7, 15, 12, 0, 'America/Denver');
      expect(result.getUTCHours()).toBe(18);
      expect(result.getUTCMinutes()).toBe(0);
    });

    it('handles midnight', () => {
      const result = zonedWallToUtc(2026, 4, 3, 0, 0, 'America/Denver');
      expect(result).toBeInstanceOf(Date);
      // April = MDT = UTC-6, so 00:00 MT → 06:00 UTC
      expect(result.getUTCHours()).toBe(6);
    });
  });

  describe('formatDateInTimeZone', () => {
    it('formats a UTC date into the given timezone date string', () => {
      // 2026-04-03 06:00 UTC = 2026-04-03 00:00 MDT
      const utcDate = new Date('2026-04-03T06:00:00.000Z');
      const result = formatDateInTimeZone(utcDate, 'America/Denver');
      expect(result).toBe('2026-04-03');
    });

    it('rolls back a day when UTC is early morning and TZ is behind', () => {
      // 2026-04-03 02:00 UTC = 2026-04-02 20:00 MDT → still April 2nd
      const utcDate = new Date('2026-04-03T02:00:00.000Z');
      const result = formatDateInTimeZone(utcDate, 'America/Denver');
      expect(result).toBe('2026-04-02');
    });
  });

  describe('dayBounds (timezone-aware)', () => {
    it('returns start and end as UTC dates representing Denver midnight bounds', () => {
      const bounds = dayBounds('2026-04-03');
      expect(bounds).not.toBeNull();
      // April = MDT = UTC-6
      // 2026-04-03 00:00 MDT → 2026-04-03 06:00 UTC
      expect(bounds!.start.getUTCHours()).toBe(6);
      expect(bounds!.start.getUTCDate()).toBe(3);
      // 2026-04-04 00:00 MDT → 2026-04-04 06:00 UTC
      expect(bounds!.end.getUTCHours()).toBe(6);
      expect(bounds!.end.getUTCDate()).toBe(4);
    });

    it('spans exactly 24 hours', () => {
      const bounds = dayBounds('2026-04-03');
      expect(bounds).not.toBeNull();
      const durationMs = bounds!.end.getTime() - bounds!.start.getTime();
      expect(durationMs).toBe(24 * 60 * 60 * 1000);
    });

    it('returns null for invalid date', () => {
      expect(dayBounds('')).toBeNull();
      expect(dayBounds('bad')).toBeNull();
    });
  });

  describe('statusToType', () => {
    it('maps IN_PROGRESS to flight', () => {
      expect(statusToType('IN_PROGRESS', false)).toBe('flight');
    });

    it('maps DISPATCHED to flight', () => {
      expect(statusToType('DISPATCHED', false)).toBe('flight');
    });

    it('maps SCHEDULED to reserved', () => {
      expect(statusToType('SCHEDULED', false)).toBe('reserved');
    });

    it('maps COMPLETED to solo', () => {
      expect(statusToType('COMPLETED', false)).toBe('solo');
    });

    it('returns ground-hold when grounded regardless of status', () => {
      expect(statusToType('IN_PROGRESS', true)).toBe('ground-hold');
      expect(statusToType('SCHEDULED', true)).toBe('ground-hold');
    });

    it('defaults to reserved for unknown status', () => {
      expect(statusToType('UNKNOWN', false)).toBe('reserved');
    });
  });

  describe('bookingToHours', () => {
    it('converts UTC timestamps to fractional hours relative to day start', () => {
      // Use Denver-aware bounds: 2026-04-03 00:00 MDT = 06:00 UTC
      const dayStart = new Date('2026-04-03T06:00:00.000Z');
      const dayEnd = new Date('2026-04-04T06:00:00.000Z');
      // Booking: 10:00-12:00 MDT = 16:00-18:00 UTC
      const result = bookingToHours(
        '2026-04-03T16:00:00.000Z',
        '2026-04-03T18:00:00.000Z',
        dayStart,
        dayEnd,
      );
      expect(result).not.toBeNull();
      expect(result!.startHour).toBeCloseTo(10, 1);
      expect(result!.endHour).toBeCloseTo(12, 1);
      expect(result!.endHour - result!.startHour).toBeCloseTo(2, 1);
    });

    it('returns null when booking is outside day window', () => {
      const dayStart = new Date('2026-04-03T06:00:00.000Z');
      const dayEnd = new Date('2026-04-04T06:00:00.000Z');
      // Booking entirely on April 4
      const result = bookingToHours(
        '2026-04-04T16:00:00.000Z',
        '2026-04-04T18:00:00.000Z',
        dayStart,
        dayEnd,
      );
      expect(result).toBeNull();
    });

    it('clips bookings that span day boundaries', () => {
      const dayStart = new Date('2026-04-03T06:00:00.000Z');
      const dayEnd = new Date('2026-04-04T06:00:00.000Z');
      // Booking crosses into day start: 22:00 prev day to 02:00 this day (MDT)
      // In UTC: 2026-04-03 04:00 to 2026-04-03 08:00
      const result = bookingToHours(
        '2026-04-03T04:00:00.000Z',
        '2026-04-03T08:00:00.000Z',
        dayStart,
        dayEnd,
      );
      expect(result).not.toBeNull();
      // Clipped to dayStart → +2h
      expect(result!.startHour).toBeCloseTo(0, 1);
      expect(result!.endHour).toBeCloseTo(2, 1);
    });
  });

  describe('canvas dimensions', () => {
    it('totalHours returns 48 (from -12 to 36)', () => {
      expect(totalHours()).toBe(48);
    });

    it('canvasWidthPx returns totalHours * 120', () => {
      expect(canvasWidthPx()).toBe(48 * 120);
    });
  });
});

describe('Scheduler JS — DOM rendering', () => {
  let buildTimelineHeader: (currentHourNow: number) => void;
  let buildResourceRow: (
    name: string,
    subtitle: string,
    status: string,
    bookings: any[],
    currentHour: number,
  ) => HTMLElement;
  let buildBookingCard: (booking: any) => HTMLElement;
  let applyCollapseState: (collapsed: boolean) => void;
  let renderModulePanel: (moduleKey: string) => void;
  let applyRowFilter: () => void;

  beforeAll(() => {
    setupDomAndStubs();

    const preamble = `
      globalThis.__test_buildTimelineHeader = buildTimelineHeader;
      globalThis.__test_buildResourceRow = buildResourceRow;
      globalThis.__test_buildBookingCard = buildBookingCard;
      globalThis.__test_applyCollapseState = applyCollapseState;
      globalThis.__test_renderModulePanel = renderModulePanel;
      globalThis.__test_applyRowFilter = applyRowFilter;
    `;

    const fn = new Function(schedulerJs + '\n' + preamble);
    fn();

    buildTimelineHeader = (globalThis as any).__test_buildTimelineHeader;
    buildResourceRow = (globalThis as any).__test_buildResourceRow;
    buildBookingCard = (globalThis as any).__test_buildBookingCard;
    applyCollapseState = (globalThis as any).__test_applyCollapseState;
    renderModulePanel = (globalThis as any).__test_renderModulePanel;
    applyRowFilter = (globalThis as any).__test_applyRowFilter;
  });

  describe('buildTimelineHeader', () => {
    it('renders hour columns into the timeline header', () => {
      buildTimelineHeader(8);
      const header = document.getElementById('timeline-header')!;

      expect(header.children.length).toBe(2);

      const label = header.querySelector('.timeline-header__label');
      expect(label).not.toBeNull();
      const labelText = label!.querySelector('.timeline-header__label-text');
      expect(labelText!.textContent).toBe('Fleet Ops Center');

      const hours = header.querySelectorAll('.timeline-header__hour');
      expect(hours.length).toBe(48);

      const currentHour = header.querySelector(
        '.timeline-header__hour--current',
      );
      expect(currentHour).not.toBeNull();
      const currentLabel = currentHour!.querySelector(
        '.timeline-header__hour-label',
      );
      expect(currentLabel!.textContent).toBe('08:00');

      const dot = header.querySelector('.timeline-header__dot');
      expect(dot).not.toBeNull();
    });

    it('handles fractional current hour (floors for highlight)', () => {
      buildTimelineHeader(10.5);
      const header = document.getElementById('timeline-header')!;
      const currentHour = header.querySelector(
        '.timeline-header__hour--current',
      );
      expect(currentHour).not.toBeNull();
      const currentLabel = currentHour!.querySelector(
        '.timeline-header__hour-label',
      );
      // Floor of 10.5 = 10 → highlights 10:00
      expect(currentLabel!.textContent).toBe('10:00');
    });

    it('positions dot based on fractional hour', () => {
      buildTimelineHeader(10.5);
      const header = document.getElementById('timeline-header')!;
      const dot = header.querySelector(
        '.timeline-header__dot',
      ) as HTMLElement;
      // (10.5 - (-12)) * 120 + 120/2 = 22.5 * 120 + 60 = 2760
      expect(dot.style.left).toBe('2760px');
    });

    it('marks midnight columns', () => {
      buildTimelineHeader(8);
      const header = document.getElementById('timeline-header')!;
      const midnightCols = header.querySelectorAll(
        '.timeline-header__hour--midnight',
      );
      expect(midnightCols.length).toBeGreaterThanOrEqual(1);
    });

    it('shows timezone label (MT) on current hour', () => {
      buildTimelineHeader(8);
      const header = document.getElementById('timeline-header')!;
      const tzLabel = header.querySelector('.timeline-header__tz');
      expect(tzLabel).not.toBeNull();
      expect(tzLabel!.textContent).toBe('MT');
    });
  });

  describe('buildResourceRow', () => {
    it('creates a row with label and canvas', () => {
      const row = buildResourceRow('N172SP', 'Cessna 172S • FLIGHT_READY', 'ready', [], 8);
      expect(row.classList.contains('resource-row')).toBe(true);

      const label = row.querySelector('.resource-row__label');
      expect(label).not.toBeNull();

      const name = row.querySelector('.resource-row__name');
      expect(name!.textContent).toBe('N172SP');

      const subtitle = row.querySelector('.resource-row__subtitle');
      expect(subtitle!.textContent).toBe('Cessna 172S • FLIGHT_READY');
    });

    it('applies correct status bar class', () => {
      const readyRow = buildResourceRow('N1', 'sub', 'ready', [], 8);
      expect(
        readyRow.querySelector('.resource-row__status-bar--ready'),
      ).not.toBeNull();

      const groundedRow = buildResourceRow('N2', 'sub', 'grounded', [], 8);
      expect(
        groundedRow.querySelector('.resource-row__status-bar--grounded'),
      ).not.toBeNull();

      const instructorRow = buildResourceRow(
        'CFI',
        'sub',
        'instructor',
        [],
        8,
      );
      expect(
        instructorRow.querySelector('.resource-row__status-bar--instructor'),
      ).not.toBeNull();
    });

    it('renders booking cards in the canvas', () => {
      const bookings = [
        {
          type: 'flight',
          title: 'student · IN_PROGRESS',
          subtitle: '10:00 – 11:30',
          startHour: 10,
          endHour: 11.5,
        },
        {
          type: 'reserved',
          title: 'student · SCHEDULED',
          subtitle: '08:00 – 09:30',
          startHour: 8,
          endHour: 9.5,
        },
      ];
      const row = buildResourceRow(
        'N172SP',
        'Cessna 172S • FLIGHT_READY',
        'ready',
        bookings,
        8,
      );
      const cards = row.querySelectorAll('.booking-card');
      expect(cards.length).toBe(2);
      expect(cards[0].classList.contains('booking-card--flight')).toBe(true);
      expect(cards[1].classList.contains('booking-card--reserved')).toBe(true);
    });

    it('includes the now-line', () => {
      const row = buildResourceRow('N1', 'sub', 'ready', [], 8);
      expect(row.querySelector('.resource-row__now-line')).not.toBeNull();
    });

    it('renders grid lines', () => {
      const row = buildResourceRow('N1', 'sub', 'ready', [], 8);
      const gridLines = row.querySelectorAll('.resource-row__grid-line');
      expect(gridLines.length).toBe(48);
    });
  });

  describe('buildBookingCard', () => {
    it('creates a flight card with icon and text', () => {
      const card = buildBookingCard({
        type: 'flight',
        title: 'student · IN_PROGRESS',
        subtitle: '10:00 – 11:30',
        startHour: 10,
        endHour: 11.5,
      });
      expect(card.classList.contains('booking-card--flight')).toBe(true);
      expect(card.querySelector('.booking-card__icon')).not.toBeNull();
      expect(card.querySelector('.booking-card__title')!.textContent).toBe(
        'student · IN_PROGRESS',
      );
      expect(card.querySelector('.booking-card__subtitle')!.textContent).toBe(
        '10:00 – 11:30',
      );
    });

    it('creates a ground-hold card without icon', () => {
      const card = buildBookingCard({
        type: 'ground-hold',
        title: 'GROUND HOLD',
        startHour: 0,
        endHour: 24,
      });
      expect(card.classList.contains('booking-card--ground-hold')).toBe(true);
      expect(card.querySelector('.booking-card__icon')).toBeNull();
      expect(card.querySelector('.booking-card__title')!.textContent).toBe(
        'GROUND HOLD',
      );
    });

    it('positions card with correct left and width', () => {
      const card = buildBookingCard({
        type: 'flight',
        title: 'Test',
        startHour: 10,
        endHour: 12,
      });
      // startHour=10, CANVAS_START=-12, COL_WIDTH=120
      // left = (10 - (-12)) * 120 = 22 * 120 = 2640
      // width = (12 - 10) * 120 = 240
      expect(card.style.left).toBe('2640px');
      expect(card.style.width).toBe('240px');
    });

    it('creates a maintenance card', () => {
      const card = buildBookingCard({
        type: 'maintenance',
        title: 'OIL CHECK',
        startHour: 14,
        endHour: 15.5,
      });
      expect(card.classList.contains('booking-card--maintenance')).toBe(true);
      expect(card.querySelector('.booking-card__icon')).not.toBeNull();
    });

    it('handles a reserved card for SCHEDULED status', () => {
      const card = buildBookingCard({
        type: 'reserved',
        title: 'student · SCHEDULED',
        subtitle: '08:00 – 09:30',
        startHour: 8,
        endHour: 9.5,
      });
      expect(card.classList.contains('booking-card--reserved')).toBe(true);
      const iconSvg = card.querySelector('.booking-card__icon svg');
      expect(iconSvg).not.toBeNull();
    });

    it('handles a solo card for COMPLETED status', () => {
      const card = buildBookingCard({
        type: 'solo',
        title: 'student · COMPLETED',
        subtitle: '17:00 – 18:00',
        startHour: 17,
        endHour: 18,
      });
      expect(card.classList.contains('booking-card--solo')).toBe(true);
    });
  });

  describe('applyCollapseState', () => {
    beforeEach(() => {
      buildTimelineHeader(8);
      const rows = document.getElementById('resource-rows')!;
      rows.innerHTML = '';
      rows.appendChild(
        buildResourceRow('N172SP', 'Cessna 172S • FLIGHT_READY', 'ready', [], 8),
      );
    });

    it('adds is-collapsed classes when collapsed', () => {
      applyCollapseState(true);

      expect(
        document
          .querySelector('.timeline-header__label-text')!
          .classList.contains('is-collapsed'),
      ).toBe(true);
      expect(
        document
          .querySelector('.resource-row__status-bar')!
          .classList.contains('is-collapsed'),
      ).toBe(true);
      expect(
        document
          .querySelector('.resource-row__name')!
          .classList.contains('is-collapsed'),
      ).toBe(true);
      expect(
        document
          .querySelector('.resource-row__subtitle')!
          .classList.contains('is-collapsed'),
      ).toBe(true);
    });

    it('removes is-collapsed classes when expanded', () => {
      applyCollapseState(true);
      applyCollapseState(false);

      expect(
        document
          .querySelector('.timeline-header__label-text')!
          .classList.contains('is-collapsed'),
      ).toBe(false);
      expect(
        document
          .querySelector('.resource-row__status-bar')!
          .classList.contains('is-collapsed'),
      ).toBe(false);
    });

    it('changes header label text on collapse', () => {
      applyCollapseState(true);
      expect(
        document.querySelector('.timeline-header__label-text')!.textContent,
      ).toBe('FLEET');

      applyCollapseState(false);
      expect(
        document.querySelector('.timeline-header__label-text')!.textContent,
      ).toBe('Fleet Ops Center');
    });
  });

  describe('backend linkage panel', () => {
    it('renders backend metadata for the selected module', () => {
      renderModulePanel('maintenance');

      expect(
        document.getElementById('backend-map-title')!.textContent,
      ).toBe('Maintenance');
      expect(
        document.getElementById('backend-map-summary')!.textContent,
      ).toContain('Predictive maintenance alerts');
      expect(
        document.getElementById('backend-map-ops')!.textContent,
      ).toContain('alertHistory');
    });
  });

  describe('applyRowFilter', () => {
    beforeEach(() => {
      const rows = document.getElementById('resource-rows')!;
      rows.innerHTML = '';
      rows.appendChild(
        buildResourceRow(
          'N172SP',
          'Cessna 172S • FLIGHT_READY',
          'ready',
          [],
          8,
        ),
      );
      rows.appendChild(
        buildResourceRow(
          'N44BE',
          'Piper PA-44 Seminole • FLIGHT_READY',
          'ready',
          [],
          8,
        ),
      );
      (document.getElementById('input-filter') as HTMLInputElement).value =
        'n172';
    });

    it('hides non-matching rows for the local filter', () => {
      applyRowFilter();

      const rows = document.querySelectorAll('.resource-row');
      expect((rows[0] as HTMLElement).hidden).toBe(false);
      expect((rows[1] as HTMLElement).hidden).toBe(true);
    });
  });
});

describe('Scheduler JS — seed data rendering', () => {
  /**
   * Simulates what happens when the ribbon receives seed data from the API.
   * Uses the same structure that bookingsByBase and aircraftByBase return.
   */
  let renderSchedule: (
    aircraft: any[],
    bookings: any[],
    bounds: { start: Date; end: Date },
    dateStr: string,
  ) => void;
  let dayBounds: (dateStr: string) => { start: Date; end: Date } | null;
  let formatDateInTimeZone: (date: Date, timeZone: string) => string;

  beforeAll(() => {
    setupDomAndStubs();

    const preamble = `
      globalThis.__test_renderSchedule = renderSchedule;
      globalThis.__test_dayBounds = dayBounds;
      globalThis.__test_formatDateInTimeZone = formatDateInTimeZone;
    `;

    const fn = new Function(schedulerJs + '\n' + preamble);
    fn();

    renderSchedule = (globalThis as any).__test_renderSchedule;
    dayBounds = (globalThis as any).__test_dayBounds;
    formatDateInTimeZone = (globalThis as any).__test_formatDateInTimeZone;
  });

  // Mock data matching seed structure: Centennial Flight Academy @ KAPA
  const mockAircraft = [
    {
      id: 'ac-172',
      tailNumber: 'N172SP',
      make: 'Cessna',
      model: '172S',
      airworthinessStatus: 'FLIGHT_READY',
    },
    {
      id: 'ac-182',
      tailNumber: 'N182RG',
      make: 'Cessna',
      model: '182RG',
      airworthinessStatus: 'FLIGHT_READY',
    },
    {
      id: 'ac-44',
      tailNumber: 'N44BE',
      make: 'Piper',
      model: 'PA-44 Seminole',
      airworthinessStatus: 'FLIGHT_READY',
    },
  ];

  function mockBookings(dayStart: Date) {
    // Reproduce the seed's 5 bookings as UTC times
    // Slot times are "Denver today" wall-clock hours
    const msH = 3600000;
    return [
      {
        id: 'b1',
        status: 'SCHEDULED',
        startTime: new Date(dayStart.getTime() + 8 * msH).toISOString(),
        endTime: new Date(dayStart.getTime() + 9.5 * msH).toISOString(),
        aircraftId: 'ac-172',
        aircraft: { id: 'ac-172', tailNumber: 'N172SP' },
        user: { email: 'student@flyos.local' },
        participants: [
          { userId: 'u-student', role: 'RENTER', user: { email: 'student@flyos.local' } },
        ],
      },
      {
        id: 'b2',
        status: 'DISPATCHED',
        startTime: new Date(dayStart.getTime() + 14 * msH).toISOString(),
        endTime: new Date(dayStart.getTime() + 16 * msH).toISOString(),
        aircraftId: 'ac-172',
        aircraft: { id: 'ac-172', tailNumber: 'N172SP' },
        user: { email: 'student@flyos.local' },
        participants: [
          { userId: 'u-student', role: 'RENTER', user: { email: 'student@flyos.local' } },
          { userId: 'u-instructor', role: 'INSTRUCTOR', user: { email: 'instructor@flyos.local' } },
        ],
      },
      {
        id: 'b3',
        status: 'IN_PROGRESS',
        startTime: new Date(dayStart.getTime() + 10 * msH).toISOString(),
        endTime: new Date(dayStart.getTime() + 11.5 * msH).toISOString(),
        aircraftId: 'ac-182',
        aircraft: { id: 'ac-182', tailNumber: 'N182RG' },
        user: { email: 'student@flyos.local' },
        participants: [
          { userId: 'u-student', role: 'RENTER', user: { email: 'student@flyos.local' } },
        ],
      },
      {
        id: 'b4',
        status: 'COMPLETED',
        startTime: new Date(dayStart.getTime() + 17 * msH).toISOString(),
        endTime: new Date(dayStart.getTime() + 18 * msH).toISOString(),
        aircraftId: 'ac-182',
        aircraft: { id: 'ac-182', tailNumber: 'N182RG' },
        user: { email: 'student@flyos.local' },
        participants: [
          { userId: 'u-student', role: 'RENTER', user: { email: 'student@flyos.local' } },
        ],
      },
      {
        id: 'b5',
        status: 'SCHEDULED',
        startTime: new Date(dayStart.getTime() + 12 * msH).toISOString(),
        endTime: new Date(dayStart.getTime() + 13 * msH).toISOString(),
        aircraftId: 'ac-44',
        aircraft: { id: 'ac-44', tailNumber: 'N44BE' },
        user: { email: 'student@flyos.local' },
        participants: [
          { userId: 'u-student', role: 'RENTER', user: { email: 'student@flyos.local' } },
        ],
      },
    ];
  }

  it('renders instructor row from booking participants', () => {
    const bounds = dayBounds('2026-04-03')!;
    const bookings = mockBookings(bounds.start);
    renderSchedule(mockAircraft, bookings, bounds, '2026-04-03');

    const rows = document.querySelectorAll('.resource-row');
    // Booking b2 has an INSTRUCTOR participant → 1 instructor row
    const instructorRow = Array.from(rows).find((r) =>
      r.querySelector('.resource-row__status-bar--instructor'),
    );
    expect(instructorRow).toBeTruthy();
    expect(
      instructorRow!.querySelector('.resource-row__name')!.textContent,
    ).toBe('instructor');
  });

  it('renders all 3 aircraft rows sorted by tail number', () => {
    const bounds = dayBounds('2026-04-03')!;
    const bookings = mockBookings(bounds.start);
    renderSchedule(mockAircraft, bookings, bounds, '2026-04-03');

    const rows = document.querySelectorAll('.resource-row');
    // 1 instructor + 3 aircraft = 4 rows
    expect(rows.length).toBe(4);

    // Aircraft names in sorted order (after instructor row)
    const aircraftNames = Array.from(rows)
      .filter((r) => !r.querySelector('.resource-row__status-bar--instructor'))
      .map((r) => r.querySelector('.resource-row__name')!.textContent);
    expect(aircraftNames).toEqual(['N172SP', 'N182RG', 'N44BE']);
  });

  it('renders correct booking card types based on status', () => {
    const bounds = dayBounds('2026-04-03')!;
    const bookings = mockBookings(bounds.start);
    renderSchedule(mockAircraft, bookings, bounds, '2026-04-03');

    const allCards = document.querySelectorAll('.booking-card');
    // 5 bookings on aircraft rows + 1 on instructor row (b2) = 6 cards
    expect(allCards.length).toBe(6);

    // Check specific card types exist
    expect(document.querySelector('.booking-card--reserved')).not.toBeNull();
    expect(document.querySelector('.booking-card--flight')).not.toBeNull();
    expect(document.querySelector('.booking-card--solo')).not.toBeNull();
  });

  it('renders booking cards with correct pixel positions', () => {
    const bounds = dayBounds('2026-04-03')!;
    const bookings = mockBookings(bounds.start);
    renderSchedule(mockAircraft, bookings, bounds, '2026-04-03');

    // Find a card on N172SP: booking b1 is SCHEDULED at hours 8.0 - 9.5
    // left = (8 - (-12)) * 120 = 20 * 120 = 2400
    // width = 1.5 * 120 = 180
    const cards = document.querySelectorAll('.booking-card--reserved');
    const b1Card = Array.from(cards).find(
      (c) => (c as HTMLElement).style.left === '2400px',
    );
    expect(b1Card).toBeTruthy();
    expect((b1Card as HTMLElement).style.width).toBe('180px');
  });

  it('renders grounded aircraft with ground-hold card', () => {
    const bounds = dayBounds('2026-04-03')!;
    const groundedAircraft = [
      ...mockAircraft.slice(0, 2),
      {
        ...mockAircraft[2],
        airworthinessStatus: 'GROUNDED',
      },
    ];
    renderSchedule(groundedAircraft, [], bounds, '2026-04-03');

    const ghCards = document.querySelectorAll('.booking-card--ground-hold');
    expect(ghCards.length).toBe(1);
    expect(
      ghCards[0].querySelector('.booking-card__title')!.textContent,
    ).toBe('GROUND HOLD');
  });

  it('does not render CANCELLED bookings', () => {
    const bounds = dayBounds('2026-04-03')!;
    const bookings = mockBookings(bounds.start);
    bookings[0].status = 'CANCELLED';
    renderSchedule(mockAircraft, bookings, bounds, '2026-04-03');

    // With one cancelled, should be 4 active bookings on aircraft + 1 on instructor = 5
    const allCards = document.querySelectorAll('.booking-card');
    expect(allCards.length).toBe(5);
  });

  it('shows timeline header with current hour at anchor when not today', () => {
    // Use a date far in the future so it's never "today"
    const bounds = dayBounds('2099-01-15')!;
    renderSchedule(mockAircraft, [], bounds, '2099-01-15');

    const header = document.getElementById('timeline-header')!;
    const currentHour = header.querySelector(
      '.timeline-header__hour--current',
    );
    expect(currentHour).not.toBeNull();
    // Not today → uses ANCHOR_HOUR=8 → highlights 08:00
    const label = currentHour!.querySelector('.timeline-header__hour-label');
    expect(label!.textContent).toBe('08:00');
  });
});
