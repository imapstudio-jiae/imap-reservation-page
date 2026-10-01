/**
 * IMAP Studio - Consultation Booking Application
 * Warm Atelier Aesthetics & Clean Streamlined Flow
 */

const STORAGE_KEYS = {
  BOOKINGS: 'imap_studio_bookings_v3',
  BLOCKED_SCHEDULES: 'imap_studio_blocked_schedules_v3'
};

// Initial default blocked schedules as example (e.g. regular lesson times)
const DEFAULT_BLOCKED_SCHEDULES = [
  { id: 'blk-1', date: getRelativeDateStr(1), time: '14:00', reason: '정기 개인 레슨' },
  { id: 'blk-2', date: getRelativeDateStr(1), time: '15:00', reason: '정기 개인 레슨' },
  { id: 'blk-3', date: getRelativeDateStr(3), time: 'ALL', reason: '스튜디오 휴무일' },
  { id: 'blk-4', date: getRelativeDateStr(4), time: '16:00', reason: '음원 녹음 세션' }
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
  kakaoChannelId: '_xmxmxbG'
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
  tabSchedules: document.getElementById('tabSchedules'),
  tabCountSpan: document.getElementById('tabCountSpan'),
  adminBookingsPanel: document.getElementById('adminBookingsPanel'),
  adminSchedulesPanel: document.getElementById('adminSchedulesPanel'),
  adminTableBody: document.getElementById('adminTableBody'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),

  // Admin Schedule Blocking Inputs
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
  const blockedList = getBlockedSchedules();
  return blockedList.some(item => item.date === dateStr && item.time === 'ALL');
}

function isTimeBlocked(dateStr, timeStr) {
  if (isDateBlocked(dateStr)) return true;

  const blockedList = getBlockedSchedules();
  const hasManualBlock = blockedList.some(item => item.date === dateStr && item.time === timeStr);
  if (hasManualBlock) return true;

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
}

function renderBlockedListTable() {
  const list = getBlockedSchedules();
  el.blockedListBody.innerHTML = '';

  if (list.length === 0) {
    el.blockedListBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #8C7E75; padding: 20px;">
          등록된 예약 불가/차단 일정이 없습니다.
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
      <td>등록완료</td>
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

function addBlockedSchedule() {
  const dateVal = el.blockDateInput.value;
  const timeVal = el.blockTimeSelect.value;
  const reasonVal = el.blockReasonInput.value.trim() || '스튜디오 일정/레슨';

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
  el.openAdminBtn.addEventListener('click', () => {
    renderAdminBookingsTable();
    renderBlockedListTable();
    el.adminModal.style.display = 'flex';
  });

  el.closeAdminBtn.addEventListener('click', () => {
    el.adminModal.style.display = 'none';
  });

  el.adminModal.addEventListener('click', (e) => {
    if (e.target === el.adminModal) {
      el.adminModal.style.display = 'none';
    }
  });

  el.tabBookings.addEventListener('click', () => {
    el.tabBookings.classList.add('active');
    el.tabSchedules.classList.remove('active');
    el.adminBookingsPanel.style.display = 'block';
    el.adminSchedulesPanel.style.display = 'none';
  });

  el.tabSchedules.addEventListener('click', () => {
    el.tabSchedules.classList.add('active');
    el.tabBookings.classList.remove('active');
    el.adminSchedulesPanel.style.display = 'block';
    el.adminBookingsPanel.style.display = 'none';
  });

  el.addBlockBtn.addEventListener('click', addBlockedSchedule);
  el.exportCsvBtn.addEventListener('click', exportCsv);
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
