/**
 * IMAP Studio - Consultation Booking Application
 * Warm Atelier Aesthetics & Clean Streamlined Flow
 */

const STORAGE_KEYS = {
  BOOKINGS: 'imap_studio_bookings_v3',
  BLOCKED_SCHEDULES: 'imap_studio_blocked_schedules_v3',
  WEEKLY_BLOCKED: 'imap_studio_weekly_blocks_v1'
};

// Initial default blocked schedules as example (e.g. regular lesson times)
const DEFAULT_BLOCKED_SCHEDULES = [
  { id: 'blk-3', date: getRelativeDateStr(3), time: 'ALL', reason: '스튜디오 휴무일' },
  { id: 'blk-4', date: getRelativeDateStr(4), time: '16:00', reason: '음원 녹음 세션' }
];

// Initial default recurring weekly blocked schedules (e.g. fixed regular lessons)
const DEFAULT_WEEKLY_BLOCKED = [
  { id: 'wblk-1', dayOfWeek: 2, time: '14:00', reason: '정기 개인 레슨' },
  { id: 'wblk-2', dayOfWeek: 2, time: '15:00', reason: '정기 개인 레슨' },
  { id: 'wblk-3', dayOfWeek: 4, time: '17:00', reason: '정기 기타 레슨' }
];

function getRelativeDateStr(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_TIME_SLOTS = [
  '10:00', '11:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// App State
const state = {
  currentCalendarMonth: new Date(),
  selectedMainType: '레슨 상담',
  selectedSubType: '어쿠스틱 기타',
  selectedDate: null,
  selectedTime: null,
  contactMethod: '카카오톡',
  lastSubmitted: null,
  kakaoChannelId: '_xmxmxbG',
  adminCalendarMonth: new Date(),
  adminSelectedDate: null
};

// DOM Elements
const el = {
  formView: document.getElementById('formView'),
  completeView: document.getElementById('completeView'),
  consultationForm: document.getElementById('consultationForm'),

  // Inquiry Types & Sub Panels
  inquiryTypeCards: document.querySelectorAll('.type-card'),
  lessonSubPanel: document.getElementById('lessonSubPanel'),
  workSubPanel: document.getElementById('workSubPanel'),
  lessonSubChips: document.querySelectorAll('#lessonSubPanel .sub-chip'),
  workSubChips: document.querySelectorAll('#workSubPanel .sub-chip'),
  
  // Calendar & Times
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  currentMonthLabel: document.getElementById('currentMonthLabel'),
  calendarDaysGrid: document.getElementById('calendarDaysGrid'),
  selectedDateDisplay: document.getElementById('selectedDateDisplay'),
  timeSlotGrid: document.getElementById('timeSlotGrid'),
  datetimeError: document.getElementById('datetimeError'),

  // Customer Inputs
  userName: document.getElementById('userName'),
  nameError: document.getElementById('nameError'),
  userNotes: document.getElementById('userNotes'),
  contactChips: document.querySelectorAll('.method-chip'),
  userPhone: document.getElementById('userPhone'),
  phoneError: document.getElementById('phoneError'),

  // Review Card Elements
  reviewType: document.getElementById('reviewType'),
  reviewDate: document.getElementById('reviewDate'),
  reviewTime: document.getElementById('reviewTime'),
  reviewName: document.getElementById('reviewName'),
  reviewMethod: document.getElementById('reviewMethod'),
  reviewPhone: document.getElementById('reviewPhone'),
  reviewNotes: document.getElementById('reviewNotes'),

  // Complete View Elements
  ticketId: document.getElementById('ticketId'),
  ticketType: document.getElementById('ticketType'),
  ticketDateTime: document.getElementById('ticketDateTime'),
  ticketName: document.getElementById('ticketName'),
  ticketMethod: document.getElementById('ticketMethod'),
  ticketNotes: document.getElementById('ticketNotes'),
  kakaoChannelBtn: document.getElementById('kakaoChannelBtn'),
  downloadIcsBtn: document.getElementById('downloadIcsBtn'),
  resetBookingBtn: document.getElementById('resetBookingBtn'),

  // Admin Modal & Tabs
  openAdminBtn: document.getElementById('openAdminBtn'),
  adminPendingCount: document.getElementById('adminPendingCount'),
  adminModal: document.getElementById('adminModal'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
  tabBookings: document.getElementById('tabBookings'),
  tabCalendar: document.getElementById('tabCalendar'),
  tabSchedules: document.getElementById('tabSchedules'),
  tabCountSpan: document.getElementById('tabCountSpan'),
  adminBookingsPanel: document.getElementById('adminBookingsPanel'),
  adminCalendarPanel: document.getElementById('adminCalendarPanel'),
  adminSchedulesPanel: document.getElementById('adminSchedulesPanel'),
  adminTableBody: document.getElementById('adminTableBody'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),

  // Admin Calendar Elements
  adminCalPrev: document.getElementById('adminCalPrev'),
  adminCalNext: document.getElementById('adminCalNext'),
  adminCalMonthLabel: document.getElementById('adminCalMonthLabel'),
  adminCalGrid: document.getElementById('adminCalGrid'),
  adminCalDetail: document.getElementById('adminCalDetail'),

  // Schedule Mode & Forms
  modeWeeklyBtn: document.getElementById('modeWeeklyBtn'),
  modeSingleBtn: document.getElementById('modeSingleBtn'),
  weeklyBlockForm: document.getElementById('weeklyBlockForm'),
  singleBlockForm: document.getElementById('singleBlockForm'),

  // Weekly Recurring Blocking Inputs
  weeklyDaySelect: document.getElementById('weeklyDaySelect'),
  weeklyTimeSelect: document.getElementById('weeklyTimeSelect'),
  weeklyReasonInput: document.getElementById('weeklyReasonInput'),
  addWeeklyBlockBtn: document.getElementById('addWeeklyBlockBtn'),
  weeklyBlockListBody: document.getElementById('weeklyBlockListBody'),
  weeklyBlockCountSpan: document.getElementById('weeklyBlockCountSpan'),
  singleBlockCountSpan: document.getElementById('singleBlockCountSpan'),

  // Admin Single Schedule Blocking Inputs
  blockDateInput: document.getElementById('blockDateInput'),
  blockTimeSelect: document.getElementById('blockTimeSelect'),
  blockReasonInput: document.getElementById('blockReasonInput'),
  addBlockBtn: document.getElementById('addBlockBtn'),
  blockedListBody: document.getElementById('blockedListBody')
};

// ----------------------------------------------------
// Storage Handlers
// ----------------------------------------------------
function getBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveBookings(list) {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
  updateAdminCounters();
}

function getWeeklyBlockedSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_BLOCKED);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_BLOCKED, JSON.stringify(DEFAULT_WEEKLY_BLOCKED));
      return DEFAULT_WEEKLY_BLOCKED;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_WEEKLY_BLOCKED;
  }
}

function saveWeeklyBlockedSchedules(list) {
  localStorage.setItem(STORAGE_KEYS.WEEKLY_BLOCKED, JSON.stringify(list));
}

function getBlockedSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKED_SCHEDULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_SCHEDULES, JSON.stringify(DEFAULT_BLOCKED_SCHEDULES));
      return DEFAULT_BLOCKED_SCHEDULES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveBlockedSchedules(list) {
  localStorage.setItem(STORAGE_KEYS.BLOCKED_SCHEDULES, JSON.stringify(list));
}

function updateAdminCounters() {
  const bookings = getBookings();
  const pending = bookings.filter(b => b.status === 'pending').length;
  el.adminPendingCount.textContent = pending;
  el.tabCountSpan.textContent = bookings.length;
}

// ----------------------------------------------------
// Date & Time Utility Functions
// ----------------------------------------------------
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatKoreanDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = KOREAN_WEEKDAYS[dateObj.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

function isDateBlocked(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  // 1. Weekly recurring all-day block check
  const weeklyList = getWeeklyBlockedSchedules();
  if (weeklyList.some(item => item.dayOfWeek === dayOfWeek && item.time === 'ALL')) {
    return true;
  }

  // 2. Specific single-day all-day block check
  const blockedList = getBlockedSchedules();
  return blockedList.some(item => item.date === dateStr && item.time === 'ALL');
}

function isTimeBlocked(dateStr, timeStr) {
  if (!dateStr || !timeStr) return true;
  if (isDateBlocked(dateStr)) return true;

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  // 1. Weekly recurring block check (matches day of week + time slot or ALL)
  const weeklyList = getWeeklyBlockedSchedules();
  if (weeklyList.some(item => item.dayOfWeek === dayOfWeek && (item.time === timeStr || item.time === 'ALL'))) {
    return true;
  }

  // 2. Specific single-day manual block check
  const blockedList = getBlockedSchedules();
  const hasManualBlock = blockedList.some(item => item.date === dateStr && (item.time === timeStr || item.time === 'ALL'));
  if (hasManualBlock) return true;

  // 3. Existing customer booking check
  const bookings = getBookings();
  return bookings.some(b => b.date === dateStr && b.time === timeStr && b.status !== 'declined');
}

// ----------------------------------------------------
// Calendar Logic
// ----------------------------------------------------
function renderCalendar() {
  const year = state.currentCalendarMonth.getFullYear();
  const month = state.currentCalendarMonth.getMonth();

  el.currentMonthLabel.textContent = `${year}년 ${month + 1}월`;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  el.calendarDaysGrid.innerHTML = '';

  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell disabled';
    el.calendarDaysGrid.appendChild(emptyCell);
  }

  const today = new Date();
  const todayStr = formatDate(today);

  for (let day = 1; day <= lastDate; day++) {
    const dayBtn = document.createElement('button');
    dayBtn.type = 'button';
    dayBtn.className = 'day-cell';
    dayBtn.textContent = day;

    const cellDate = new Date(year, month, day);
    const dateStr = formatDate(cellDate);
    const dayOfWeek = cellDate.getDay();

    if (dayOfWeek === 0) dayBtn.classList.add('sun');
    if (dayOfWeek === 6) dayBtn.classList.add('sat');

    const isPast = cellDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0);
    const isFullDayOff = isDateBlocked(dateStr);

    if (isPast || isFullDayOff) {
      dayBtn.classList.add('disabled');
      dayBtn.disabled = true;
      if (isFullDayOff) {
        dayBtn.title = '휴무/예약 불가일입니다.';
      }
    } else {
      if (dateStr === todayStr) {
        dayBtn.classList.add('today');
      }
      if (dateStr === state.selectedDate) {
        dayBtn.classList.add('selected');
      }

      dayBtn.addEventListener('click', () => {
        selectDate(dateStr);
      });
    }

    el.calendarDaysGrid.appendChild(dayBtn);
  }
}

function selectDate(dateStr) {
  state.selectedDate = dateStr;
  state.selectedTime = null;

  renderCalendar();
  el.selectedDateDisplay.textContent = formatKoreanDate(dateStr);
  renderTimeSlots();
  updateReviewCard();
}

// ----------------------------------------------------
// Time Slots Logic
// ----------------------------------------------------
function renderTimeSlots() {
  el.timeSlotGrid.innerHTML = '';

  if (!state.selectedDate) {
    el.timeSlotGrid.innerHTML = `
      <div class="no-slots-msg">
        📅 달력에서 원하시는 날짜를<br>먼저 선택해 주세요.
      </div>
    `;
    return;
  }

  DEFAULT_TIME_SLOTS.forEach(time => {
    const slotBtn = document.createElement('button');
    slotBtn.type = 'button';
    slotBtn.className = 'slot-btn';
    slotBtn.textContent = time;

    const blocked = isTimeBlocked(state.selectedDate, time);

    if (blocked) {
      slotBtn.classList.add('booked');
      slotBtn.disabled = true;
      slotBtn.title = '레슨/스튜디오 일정 또는 이미 상담이 잡힌 시간입니다.';
    } else {
      if (state.selectedTime === time) {
        slotBtn.classList.add('selected');
      }

      slotBtn.addEventListener('click', () => {
        selectTime(time);
      });
    }

    el.timeSlotGrid.appendChild(slotBtn);
  });
}

function selectTime(time) {
  state.selectedTime = time;
  el.datetimeError.style.display = 'none';

  const allBtns = el.timeSlotGrid.querySelectorAll('.slot-btn');
  allBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === time);
  });

  updateReviewCard();
}

// ----------------------------------------------------
// Realtime Review Card Updater
// ----------------------------------------------------
function getFullInquiryTypeLabel() {
  if (state.selectedSubType) {
    return `${state.selectedMainType} · ${state.selectedSubType}`;
  }
  return state.selectedMainType;
}

function updateReviewCard() {
  el.reviewType.textContent = getFullInquiryTypeLabel();
  el.reviewDate.textContent = state.selectedDate ? formatKoreanDate(state.selectedDate) : '날짜를 선택해 주세요';
  el.reviewTime.textContent = state.selectedTime ? state.selectedTime : '시간을 선택해 주세요';
  
  const nameVal = el.userName.value.trim();
  el.reviewName.textContent = nameVal ? `${nameVal} 님` : '-';

  el.reviewMethod.textContent = state.contactMethod;

  const phoneVal = el.userPhone.value.trim();
  el.reviewPhone.textContent = phoneVal || '-';

  const notesVal = el.userNotes.value.trim();
  el.reviewNotes.textContent = notesVal || '(작성 내용 없음)';
}

function formatPhoneNumber(val) {
  const clean = val.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
}

// ----------------------------------------------------
// Form Submission Logic
// ----------------------------------------------------
function handleSubmit(e) {
  e.preventDefault();

  let hasError = false;

  if (!state.selectedDate || !state.selectedTime) {
    el.datetimeError.style.display = 'block';
    hasError = true;
  } else {
    el.datetimeError.style.display = 'none';
  }

  const name = el.userName.value.trim();
  if (!name) {
    el.nameError.style.display = 'block';
    if (!hasError) el.userName.focus();
    hasError = true;
  } else {
    el.nameError.style.display = 'none';
  }

  const phone = el.userPhone.value.trim();
  const phoneRegex = /^01[016789]-?[0-9]{3,4}-?[0-9]{4}$/;
  if (!phone || !phoneRegex.test(phone)) {
    el.phoneError.style.display = 'block';
    if (!hasError) el.userPhone.focus();
    hasError = true;
  } else {
    el.phoneError.style.display = 'none';
  }

  if (hasError) return;

  const now = new Date();
  const bookingId = 'IMAP-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);

  const fullType = getFullInquiryTypeLabel();

  const newBooking = {
    id: bookingId,
    type: fullType,
    mainType: state.selectedMainType,
    subType: state.selectedSubType,
    date: state.selectedDate,
    time: state.selectedTime,
    name: name,
    contactMethod: state.contactMethod,
    phone: phone,
    notes: el.userNotes.value.trim(),
    createdAt: now.toISOString(),
    status: 'pending'
  };

  const bookings = getBookings();
  bookings.push(newBooking);
  saveBookings(bookings);

  state.lastSubmitted = newBooking;
  showCompleteView(newBooking);
}

function showCompleteView(b) {
  el.ticketId.textContent = '#' + b.id;
  el.ticketType.textContent = b.type;
  el.ticketDateTime.textContent = `${formatKoreanDate(b.date)} ${b.time}`;
  el.ticketName.textContent = `${b.name} 님`;
  el.ticketMethod.textContent = `${b.contactMethod} (${b.phone.replace(/(\d{3})-\d{4}-(\d{4})/, '$1-****-$2')})`;
  el.ticketNotes.textContent = b.notes ? b.notes : '특이사항 없음';

  el.formView.style.display = 'none';
  el.completeView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------------------
// Calendar Export (.ics)
// ----------------------------------------------------
function downloadIcsCalendar(booking) {
  if (!booking) return;

  const [y, m, d] = booking.date.split('-').map(Number);
  const [hour, minute] = booking.time.split(':').map(Number);

  const startDate = new Date(y, m - 1, d, hour, minute);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1000);

  const formatIcsTime = (dt) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IMAP Studio Reservation//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@imapstudio.kr`,
    `DTSTAMP:${formatIcsTime(new Date())}`,
    `DTSTART:${formatIcsTime(startDate)}`,
    `DTEND:${formatIcsTime(endDate)}`,
    `SUMMARY:[상담신청] IMAP Studio - ${booking.type}`,
    `DESCRIPTION:신청자: ${booking.name}\\n연락처: ${booking.phone}\\n선호연락: ${booking.contactMethod}`,
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `IMAP스튜디오_상담신청_${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// Admin Dashboard
// ----------------------------------------------------
function renderAdminBookingsTable() {
  const bookings = getBookings();
  el.adminTableBody.innerHTML = '';

  if (bookings.length === 0) {
    el.adminTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #8C7E75; padding: 24px;">
          접수된 상담 신청 내역이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  [...bookings].reverse().forEach(item => {
    const tr = document.createElement('tr');
    
    let statusBadge = `<span class="badge-pending">신청 대기</span>`;
    if (item.status === 'confirmed') statusBadge = `<span class="badge-confirmed">상담 확정</span>`;
    if (item.status === 'declined') statusBadge = `<span class="badge-declined">취소/거절</span>`;

    const createdAtFormatted = item.createdAt ? item.createdAt.substring(5, 16).replace('T', ' ') : '-';

    tr.innerHTML = `
      <td>${createdAtFormatted}</td>
      <td><strong>${item.type}</strong></td>
      <td>${item.date} ${item.time}</td>
      <td>${item.name} (${item.contactMethod}: ${item.phone})</td>
      <td style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.notes || ''}">
        ${item.notes || '-'}
      </td>
      <td>${statusBadge}</td>
      <td>
        <div style="display: flex; gap: 4px;">
          ${item.status !== 'confirmed' ? `<button type="button" class="btn-sm btn-approve" data-act="confirm" data-id="${item.id}">확정</button>` : ''}
          ${item.status !== 'declined' ? `<button type="button" class="btn-sm btn-decline" data-act="decline" data-id="${item.id}">거절</button>` : ''}
          <button type="button" class="btn-sm btn-outline" data-act="delete" data-id="${item.id}">삭제</button>
        </div>
      </td>
    `;
    el.adminTableBody.appendChild(tr);
  });

  el.adminTableBody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const act = e.currentTarget.getAttribute('data-act');
      const id = e.currentTarget.getAttribute('data-id');
      handleAdminAction(act, id);
    });
  });
}

function handleAdminAction(act, id) {
  let bookings = getBookings();
  const target = bookings.find(b => b.id === id);
  if (!target) return;

  if (act === 'confirm') {
    target.status = 'confirmed';
    alert(`[${target.name} 님]의 ${target.date} ${target.time} 일정이 '상담 확정'되었습니다.\n해당 시간은 달력에서 자동으로 마감됩니다.`);
  } else if (act === 'decline') {
    if (!confirm('신청을 거절하시겠습니까? 해당 시간은 다시 예약 가능 상태로 변경될 수 있습니다.')) return;
    target.status = 'declined';
  } else if (act === 'delete') {
    if (!confirm('이 예약 내역을 영구 삭제하시겠습니까?')) return;
    bookings = bookings.filter(b => b.id !== id);
  }

  saveBookings(bookings);
  renderAdminBookingsTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

function renderBlockedListTable() {
  // 1. Render Weekly Recurring Blocks
  renderWeeklyBlockedListTable();

  // 2. Render Single Date Blocks
  const list = getBlockedSchedules();
  el.blockedListBody.innerHTML = '';
  if (el.singleBlockCountSpan) {
    el.singleBlockCountSpan.textContent = list.length;
  }

  if (list.length === 0) {
    el.blockedListBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #8C7E75; padding: 18px;">
          등록된 1회성 날짜 차단 일정이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.date}</strong></td>
      <td>${item.time === 'ALL' ? '<span style="color:#B45348; font-weight:700;">하루 종일 (휴무)</span>' : item.time}</td>
      <td>${item.reason || '-'}</td>
      <td><span class="badge-confirmed">차단중</span></td>
      <td>
        <button type="button" class="btn-sm btn-decline remove-block-btn" data-id="${item.id}">해제</button>
      </td>
    `;
    el.blockedListBody.appendChild(tr);
  });

  el.blockedListBody.querySelectorAll('.remove-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeBlockedSchedule(id);
    });
  });
}

function renderWeeklyBlockedListTable() {
  if (!el.weeklyBlockListBody) return;
  const list = getWeeklyBlockedSchedules();
  el.weeklyBlockListBody.innerHTML = '';
  if (el.weeklyBlockCountSpan) {
    el.weeklyBlockCountSpan.textContent = list.length;
  }

  if (list.length === 0) {
    el.weeklyBlockListBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #8C7E75; padding: 18px;">
          등록된 매주 반복 고정 레슨/일정이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  // Sort by Monday -> Sunday then time
  const sorted = [...list].sort((a, b) => {
    const da = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const db = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    if (da !== db) return da - db;
    return a.time.localeCompare(b.time);
  });

  sorted.forEach(item => {
    const dayName = KOREAN_WEEKDAYS[item.dayOfWeek];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="color:var(--primary);">매주 ${dayName}요일</strong></td>
      <td>${item.time === 'ALL' ? '<span style="color:#B45348; font-weight:700;">하루 종일 (정기 휴무)</span>' : `<strong>${item.time}</strong>`}</td>
      <td>${item.reason || '정기 레슨'}</td>
      <td><span class="badge-confirmed">매주 반복중</span></td>
      <td>
        <button type="button" class="btn-sm btn-decline remove-weekly-block-btn" data-id="${item.id}">해제</button>
      </td>
    `;
    el.weeklyBlockListBody.appendChild(tr);
  });

  el.weeklyBlockListBody.querySelectorAll('.remove-weekly-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeWeeklyBlockedSchedule(id);
    });
  });
}

function addWeeklyBlockedSchedule() {
  const dayOfWeek = Number(el.weeklyDaySelect.value);
  const timeVal = el.weeklyTimeSelect.value;
  const reasonVal = el.weeklyReasonInput.value.trim() || '정기 고정 레슨';

  const list = getWeeklyBlockedSchedules();

  // Check duplicate
  const exists = list.some(item => item.dayOfWeek === dayOfWeek && item.time === timeVal);
  if (exists) {
    alert(`매주 [${KOREAN_WEEKDAYS[dayOfWeek]}요일 ${timeVal === 'ALL' ? '하루 종일' : timeVal}]은(는) 이미 등록되어 있습니다.`);
    return;
  }

  list.push({
    id: 'wblk-' + Date.now(),
    dayOfWeek: dayOfWeek,
    time: timeVal,
    reason: reasonVal
  });

  saveWeeklyBlockedSchedules(list);
  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();

  el.weeklyReasonInput.value = '';
  alert(`[매주 ${KOREAN_WEEKDAYS[dayOfWeek]}요일 ${timeVal === 'ALL' ? '하루 종일' : timeVal}] 정기 레슨/일정이 등록되었습니다.\n매주 해당 시간에는 예약자가 신청할 수 없도록 자동 차단됩니다.`);
}

function removeWeeklyBlockedSchedule(id) {
  let list = getWeeklyBlockedSchedules();
  const target = list.find(item => item.id === id);
  if (!target) return;
  if (!confirm(`[매주 ${KOREAN_WEEKDAYS[target.dayOfWeek]}요일 ${target.time}] 정기 차단을 해제하시겠습니까?`)) return;

  list = list.filter(item => item.id !== id);
  saveWeeklyBlockedSchedules(list);
  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

function addBlockedSchedule() {
  const dateVal = el.blockDateInput.value;
  const timeVal = el.blockTimeSelect.value;
  const reasonVal = el.blockReasonInput.value.trim() || '스튜디오 일정/임시 휴무';

  if (!dateVal) {
    alert('차단할 날짜를 선택해 주세요.');
    return;
  }

  const list = getBlockedSchedules();
  list.push({
    id: 'blk-' + Date.now(),
    date: dateVal,
    time: timeVal,
    reason: reasonVal
  });

  saveBlockedSchedules(list);
  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();

  el.blockReasonInput.value = '';
  alert(`${dateVal} [${timeVal === 'ALL' ? '하루 종일' : timeVal}] 일정이 예약 불가로 차단되었습니다.`);
}

function removeBlockedSchedule(id) {
  let list = getBlockedSchedules();
  list = list.filter(item => item.id !== id);
  saveBlockedSchedules(list);
  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

function exportCsv() {
  const bookings = getBookings();
  if (bookings.length === 0) {
    alert('다운로드할 내역이 없습니다.');
    return;
  }

  const BOM = '\uFEFF';
  const headers = ['신청번호', '문의유형', '희망일자', '희망시간', '이름', '선호연락', '전화번호', '문의내용', '상태', '신청일시'];
  const rows = bookings.map(b => [
    `"${b.id}"`,
    `"${b.type}"`,
    `"${b.date}"`,
    `"${b.time}"`,
    `"${b.name}"`,
    `"${b.contactMethod}"`,
    `"${b.phone}"`,
    `"${(b.notes || '').replace(/"/g, '""')}"`,
    `"${b.status}"`,
    `"${b.createdAt}"`
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `IMAP스튜디오_상담신청목록_${formatDate(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// Admin Calendar View Functions
// ----------------------------------------------------
function renderAdminCalendar() {
  if (!el.adminCalGrid) return;

  const current = state.adminCalendarMonth;
  const year = current.getFullYear();
  const month = current.getMonth();

  if (el.adminCalMonthLabel) {
    el.adminCalMonthLabel.textContent = `${year}년 ${month + 1}월`;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const allBookings = getBookings();
  const allBlocked = getBlockedSchedules();
  const weeklyList = getWeeklyBlockedSchedules();
  const todayStr = formatDate(new Date());

  if (!state.adminSelectedDate) {
    state.adminSelectedDate = todayStr;
  }

  el.adminCalGrid.innerHTML = '';

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'admin-cal-cell empty';
    el.adminCalGrid.appendChild(emptyCell);
  }

  // Days in month
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay();

    const cell = document.createElement('div');
    cell.className = 'admin-cal-cell';
    if (dayOfWeek === 0) cell.classList.add('sun');
    if (dayOfWeek === 6) cell.classList.add('sat');
    if (dateStr === todayStr) cell.classList.add('today');
    if (dateStr === state.adminSelectedDate) cell.classList.add('selected');

    // Count bookings & blocks on this day
    const dayBookings = allBookings.filter(b => b.date === dateStr);
    const dayBlocked = allBlocked.filter(b => b.date === dateStr);
    const dayWeekly = weeklyList.filter(item => item.dayOfWeek === dayOfWeek);
    const totalCount = dayBookings.length;

    let badgeHtml = '';
    if (totalCount > 0) {
      badgeHtml = `<span class="admin-cal-badge">${totalCount}건</span>`;
    } else if (dayBlocked.some(b => b.time === 'ALL') || dayWeekly.some(b => b.time === 'ALL')) {
      badgeHtml = `<span class="admin-cal-badge" style="background:#8C7E75;">휴무</span>`;
    } else if (dayWeekly.length > 0) {
      badgeHtml = `<span class="admin-cal-badge" style="background:#4A7C72;">${dayWeekly.length}레슨</span>`;
    } else if (dayBlocked.length > 0) {
      badgeHtml = `<span class="admin-cal-badge" style="background:#5C6B64;">${dayBlocked.length}차단</span>`;
    }

    cell.innerHTML = `
      <span>${day}</span>
      ${badgeHtml}
    `;

    cell.addEventListener('click', () => {
      state.adminSelectedDate = dateStr;
      renderAdminCalendar();
    });

    el.adminCalGrid.appendChild(cell);
  }

  renderAdminDayDetail(state.adminSelectedDate);
}

function renderAdminDayDetail(dateStr) {
  if (!el.adminCalDetail) return;
  if (!dateStr) {
    el.adminCalDetail.innerHTML = '<div class="admin-cal-detail-empty">날짜를 선택하시면 해당 일자의 예약 및 일정 상세가 표시됩니다.</div>';
    return;
  }

  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const dayName = KOREAN_WEEKDAYS[dayOfWeek];
  const formattedTitle = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayName})`;

  const allBookings = getBookings();
  const allBlocked = getBlockedSchedules();
  const weeklyList = getWeeklyBlockedSchedules();

  const dayBookings = allBookings.filter(b => b.date === dateStr);
  const dayBlocked = allBlocked.filter(b => b.date === dateStr);
  const dayWeekly = weeklyList.filter(item => item.dayOfWeek === dayOfWeek);

  let html = `<div class="admin-cal-detail-title">📅 ${formattedTitle} 일정 상세 (신청 ${dayBookings.length}건 / 매주레슨 ${dayWeekly.length}건 / 차단 ${dayBlocked.length}건)</div>`;

  if (dayBookings.length === 0 && dayBlocked.length === 0 && dayWeekly.length === 0) {
    html += '<div class="admin-cal-detail-empty">이 날짜에는 등록된 상담 신청이나 차단 일정이 없습니다.</div>';
    el.adminCalDetail.innerHTML = html;
    return;
  }

  // 1. Weekly recurring lessons for this weekday
  if (dayWeekly.length > 0) {
    dayWeekly.forEach(item => {
      html += `
        <div class="admin-detail-card" style="border-left: 4px solid #4A7C72; background: #F3F8F6;">
          <div class="admin-detail-info">
            <div class="admin-detail-time" style="color: #2D524A;">
              🔁 ${item.time === 'ALL' ? '하루 종일 (정기 휴무)' : item.time + ' [매주 고정 레슨]'}
            </div>
            <div class="admin-detail-name">레슨/사유: <strong>${item.reason || '정기 레슨'}</strong> (매주 ${dayName}요일 반복)</div>
          </div>
          <div class="admin-detail-actions">
            <span class="badge-confirmed" style="background:#E1EFEA; color:#2D524A;">매주 반복</span>
          </div>
        </div>
      `;
    });
  }

  // 2. Single-day blocked schedules
  if (dayBlocked.length > 0) {
    dayBlocked.forEach(item => {
      html += `
        <div class="admin-detail-card" style="border-left: 4px solid #8C7E75; background: #FAF7F4;">
          <div class="admin-detail-info">
            <div class="admin-detail-time" style="color: #6C5E55;">
              🚫 ${item.time === 'ALL' ? '하루 종일 (스튜디오 휴무)' : item.time + ' (예약 차단)'}
            </div>
            <div class="admin-detail-name">사유: ${item.reason || '일정 차단'} (1회성 차단)</div>
          </div>
          <div class="admin-detail-actions">
            <button type="button" class="btn-sm btn-decline remove-cal-block-btn" data-id="${item.id}">해제</button>
          </div>
        </div>
      `;
    });
  }

  // 3. Customer Bookings list
  if (dayBookings.length > 0) {
    dayBookings.forEach(item => {
      let statusBadge = `<span class="badge-pending">대기</span>`;
      if (item.status === 'confirmed') statusBadge = `<span class="badge-confirmed">확정</span>`;
      if (item.status === 'declined') statusBadge = `<span class="badge-declined">취소</span>`;

      html += `
        <div class="admin-detail-card">
          <div class="admin-detail-info">
            <div class="admin-detail-time">
              ⏰ ${item.time} ${statusBadge}
            </div>
            <div class="admin-detail-name">
              <strong>${item.name}</strong> 님 (${item.contactMethod}: ${item.phone})
            </div>
            <div class="admin-detail-type">
              📌 ${item.type} ${item.notes ? `| 메모: ${item.notes}` : ''}
            </div>
          </div>
          <div class="admin-detail-actions">
            ${item.status !== 'confirmed' ? `<button type="button" class="btn-sm btn-approve" data-act="confirm" data-id="${item.id}">확정</button>` : ''}
            ${item.status !== 'declined' ? `<button type="button" class="btn-sm btn-decline" data-act="decline" data-id="${item.id}">거절</button>` : ''}
            <button type="button" class="btn-sm btn-outline" data-act="delete" data-id="${item.id}">삭제</button>
          </div>
        </div>
      `;
    });
  }

  el.adminCalDetail.innerHTML = html;

  // Add event listeners for booking action buttons in detail view
  el.adminCalDetail.querySelectorAll('.admin-detail-actions button[data-act]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const act = e.currentTarget.getAttribute('data-act');
      const id = e.currentTarget.getAttribute('data-id');
      handleAdminAction(act, id);
    });
  });

  // Add event listeners for unblocking in detail view
  el.adminCalDetail.querySelectorAll('.remove-cal-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeBlockedSchedule(id);
    });
  });
}

// ----------------------------------------------------
// Event Listeners & Initialization
// ----------------------------------------------------
function initEventListeners() {
  // 1. Main Inquiry Type Selection (레슨 상담 / 작업 의뢰 상담)
  el.inquiryTypeCards.forEach(card => {
    card.addEventListener('click', () => {
      el.inquiryTypeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      radio.checked = true;
      state.selectedMainType = radio.value;

      if (state.selectedMainType === '레슨 상담') {
        el.lessonSubPanel.classList.add('active');
        el.workSubPanel.classList.remove('active');
        // Set default or current active chip
        const activeChip = el.lessonSubPanel.querySelector('.sub-chip.selected') || el.lessonSubChips[0];
        state.selectedSubType = activeChip ? activeChip.getAttribute('data-value') : '어쿠스틱 기타';
      } else {
        el.workSubPanel.classList.add('active');
        el.lessonSubPanel.classList.remove('active');
        const activeChip = el.workSubPanel.querySelector('.sub-chip.selected') || el.workSubChips[0];
        state.selectedSubType = activeChip ? activeChip.getAttribute('data-value') : '음원 녹음';
      }

      updateReviewCard();
    });
  });

  // Sub Chips Handlers
  el.lessonSubChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.lessonSubChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      state.selectedSubType = chip.getAttribute('data-value');
      updateReviewCard();
    });
  });

  el.workSubChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.workSubChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      state.selectedSubType = chip.getAttribute('data-value');
      updateReviewCard();
    });
  });

  // 2. Calendar Month Navigation
  el.prevMonthBtn.addEventListener('click', () => {
    state.currentCalendarMonth.setMonth(state.currentCalendarMonth.getMonth() - 1);
    renderCalendar();
  });
  el.nextMonthBtn.addEventListener('click', () => {
    state.currentCalendarMonth.setMonth(state.currentCalendarMonth.getMonth() + 1);
    renderCalendar();
  });

  // 3. User Inputs Live Review
  el.userName.addEventListener('input', () => {
    el.nameError.style.display = 'none';
    updateReviewCard();
  });

  el.userNotes.addEventListener('input', () => {
    updateReviewCard();
  });

  // 4. Contact Method Selector (Kakao / Phone)
  el.contactChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.contactChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const radio = chip.querySelector('input[type="radio"]');
      radio.checked = true;
      state.contactMethod = radio.value;
      updateReviewCard();
    });
  });

  // 5. Phone Input Formatting & Validation
  el.userPhone.addEventListener('input', (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
    el.phoneError.style.display = 'none';
    updateReviewCard();
  });

  // 6. Form Submission
  el.consultationForm.addEventListener('submit', handleSubmit);

  // 7. Complete View Actions
  el.kakaoChannelBtn.addEventListener('click', () => {
    const channelUrl = `http://pf.kakao.com/${state.kakaoChannelId}/chat`;
    if (confirm('카카오톡 채널 채팅방으로 이동하시겠습니까?')) {
      window.open(channelUrl, '_blank');
    }
  });

  el.downloadIcsBtn.addEventListener('click', () => {
    downloadIcsCalendar(state.lastSubmitted);
  });

  el.resetBookingBtn.addEventListener('click', () => {
    state.selectedDate = null;
    state.selectedTime = null;
    el.consultationForm.reset();
    
    // Reset Type
    el.inquiryTypeCards.forEach(c => c.classList.remove('selected'));
    el.inquiryTypeCards[0].classList.add('selected');
    state.selectedMainType = '레슨 상담';
    el.lessonSubPanel.classList.add('active');
    el.workSubPanel.classList.remove('active');
    el.lessonSubChips.forEach(c => c.classList.remove('selected'));
    el.lessonSubChips[0].classList.add('selected');
    state.selectedSubType = '어쿠스틱 기타';

    // Reset Method
    el.contactChips.forEach(c => c.classList.remove('selected'));
    el.contactChips[0].classList.add('selected');
    state.contactMethod = '카카오톡';

    el.completeView.style.display = 'none';
    el.formView.style.display = 'block';

    renderCalendar();
    renderTimeSlots();
    updateReviewCard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 8. Admin Modal Actions
  const pwModal    = document.getElementById('pwModal');
  const pwInput    = document.getElementById('pwInput');
  const pwError    = document.getElementById('pwError');
  const pwCancelBtn  = document.getElementById('pwCancelBtn');
  const pwConfirmBtn = document.getElementById('pwConfirmBtn');

  function openPwModal() {
    pwInput.value = '';
    pwError.style.display = 'none';
    pwModal.style.display = 'flex';
    setTimeout(() => pwInput.focus(), 100);
  }

  function closePwModal() {
    pwModal.style.display = 'none';
    pwInput.value = '';
    pwError.style.display = 'none';
  }

  function submitPw() {
    if (pwInput.value === '202424') {
      closePwModal();
      renderAdminBookingsTable();
      renderAdminCalendar();
      renderBlockedListTable();
      el.adminModal.style.display = 'flex';
    } else {
      pwError.style.display = 'block';
      // Re-trigger shake animation
      pwError.style.animation = 'none';
      void pwError.offsetWidth;
      pwError.style.animation = '';
      pwInput.value = '';
      pwInput.focus();
    }
  }

  el.openAdminBtn.addEventListener('click', openPwModal);
  pwCancelBtn.addEventListener('click', closePwModal);
  pwConfirmBtn.addEventListener('click', submitPw);
  pwInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitPw();
    if (e.key === 'Escape') closePwModal();
  });
  pwModal.addEventListener('click', (e) => {
    if (e.target === pwModal) closePwModal();
  });

  el.closeAdminBtn.addEventListener('click', () => {
    el.adminModal.style.display = 'none';
  });

  el.adminModal.addEventListener('click', (e) => {
    if (e.target === el.adminModal) {
      el.adminModal.style.display = 'none';
    }
  });

  // Admin Tab Switcher
  function switchAdminTab(targetTab) {
    if (el.tabBookings) el.tabBookings.classList.remove('active');
    if (el.tabCalendar) el.tabCalendar.classList.remove('active');
    if (el.tabSchedules) el.tabSchedules.classList.remove('active');

    if (el.adminBookingsPanel) el.adminBookingsPanel.style.display = 'none';
    if (el.adminCalendarPanel) el.adminCalendarPanel.style.display = 'none';
    if (el.adminSchedulesPanel) el.adminSchedulesPanel.style.display = 'none';

    if (targetTab === 'bookings') {
      if (el.tabBookings) el.tabBookings.classList.add('active');
      if (el.adminBookingsPanel) el.adminBookingsPanel.style.display = 'block';
      renderAdminBookingsTable();
    } else if (targetTab === 'calendar') {
      if (el.tabCalendar) el.tabCalendar.classList.add('active');
      if (el.adminCalendarPanel) el.adminCalendarPanel.style.display = 'block';
      renderAdminCalendar();
    } else if (targetTab === 'schedules') {
      if (el.tabSchedules) el.tabSchedules.classList.add('active');
      if (el.adminSchedulesPanel) el.adminSchedulesPanel.style.display = 'block';
      renderBlockedListTable();
    }
  }

  if (el.tabBookings) el.tabBookings.addEventListener('click', () => switchAdminTab('bookings'));
  if (el.tabCalendar) el.tabCalendar.addEventListener('click', () => switchAdminTab('calendar'));
  if (el.tabSchedules) el.tabSchedules.addEventListener('click', () => switchAdminTab('schedules'));

  // Admin Calendar Navigation
  if (el.adminCalPrev) {
    el.adminCalPrev.addEventListener('click', () => {
      state.adminCalendarMonth.setMonth(state.adminCalendarMonth.getMonth() - 1);
      renderAdminCalendar();
    });
  }
  if (el.adminCalNext) {
    el.adminCalNext.addEventListener('click', () => {
      state.adminCalendarMonth.setMonth(state.adminCalendarMonth.getMonth() + 1);
      renderAdminCalendar();
    });
  }

  // Schedule Mode Toggle (Weekly vs Single Date)
  if (el.modeWeeklyBtn && el.modeSingleBtn) {
    el.modeWeeklyBtn.addEventListener('click', () => {
      el.modeWeeklyBtn.classList.add('active');
      el.modeSingleBtn.classList.remove('active');
      if (el.weeklyBlockForm) el.weeklyBlockForm.style.display = 'block';
      if (el.singleBlockForm) el.singleBlockForm.style.display = 'none';
    });

    el.modeSingleBtn.addEventListener('click', () => {
      el.modeSingleBtn.classList.add('active');
      el.modeWeeklyBtn.classList.remove('active');
      if (el.singleBlockForm) el.singleBlockForm.style.display = 'block';
      if (el.weeklyBlockForm) el.weeklyBlockForm.style.display = 'none';
    });
  }

  if (el.addWeeklyBlockBtn) {
    el.addWeeklyBlockBtn.addEventListener('click', addWeeklyBlockedSchedule);
  }
  if (el.addBlockBtn) {
    el.addBlockBtn.addEventListener('click', addBlockedSchedule);
  }
  if (el.exportCsvBtn) {
    el.exportCsvBtn.addEventListener('click', exportCsv);
  }
}

function init() {
  initEventListeners();
  renderCalendar();
  renderTimeSlots();
  updateReviewCard();
  updateAdminCounters();

  if (el.blockDateInput) {
    el.blockDateInput.min = formatDate(new Date());
  }
}

document.addEventListener('DOMContentLoaded', init);
