/* Shared business rules. No network, DOM or secrets. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OstazyCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function localDate(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  function recentMonths(date = new Date(), count = 6) {
    return Array.from({length: count}, (_, i) => localDate(new Date(date.getFullYear(), date.getMonth() - count + i + 1, 1, 12)).slice(0, 7));
  }
  function findStudent(state, id) {
    for (const group of state.groups) {
      const student = group.students.find(item => item.id === id);
      if (student) return student;
    }
    return null;
  }
  function isActive(subscription, now = Date.now()) {
    return !!subscription && (Date.parse(subscription.trial_ends) > now || Date.parse(subscription.paid_until) > now);
  }
  function clampScore(value, maximum) {
    if (value === '') return null;
    const parsed = Number(String(value).replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    return Number.isFinite(parsed) && Number.isFinite(maximum) && maximum > 0 ? Math.max(0, Math.min(parsed, maximum)) : null;
  }
  function money(amount) { return Math.round(amount * 100) / 100; }
  function monthlyTotals(state, month) {
    const ledger = (state.paymentLedger || []).filter(item => item.month === month);
    const amount = money(ledger.reduce((sum, item) => sum + (item.kind === 'payment' ? item.amount : -item.amount), 0));
    const tracked = new Set(ledger.map(item => item.studentId));
    const legacyCount = Object.entries(state.pay[month] || {}).filter(([id, paid]) => paid && !tracked.has(id)).length;
    return {amount, legacyCount};
  }
  function togglePayment(state, month, studentId, id, now = new Date().toISOString()) {
    state.pay[month] = state.pay[month] || {};
    state.paymentLedger = state.paymentLedger || [];
    const wasPaid = !!state.pay[month][studentId];
    const student = findStudent(state, studentId);
    if (!student) throw new Error('Student not found');
    if (wasPaid) {
      const records = state.paymentLedger.filter(item => item.studentId === studentId && item.month === month);
      const last = records[records.length - 1];
      // Legacy booleans contain no historical amount. Never invent one.
      if (last && last.kind === 'payment') state.paymentLedger.push({id, month, studentId, studentName: student.name, kind: 'reversal', amount: last.amount, paymentId: last.id, occurredAt: now});
    } else {
      state.paymentLedger.push({id, month, studentId, studentName: student.name, kind: 'payment', amount: money(state.price), currency: 'EGP', occurredAt: now});
    }
    state.pay[month][studentId] = !wasPaid;
  }
  function validateState(state) {
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const text = value => typeof value === 'string' && value.length <= 20000;
    const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
    const month = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
    const date = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value);
    const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
    if (!object(state) || !text(state.subject) || !text(state.stage) || !amount(state.price) || !month(state.since) || !Array.isArray(state.groups) || state.groups.length > 500 || !object(state.att) || !object(state.pay) || !Array.isArray(state.exams)) throw new Error('Invalid backup structure');
    const groupIds = new Set(), studentIds = new Set();
    for (const group of state.groups) {
      if (!object(group) || !id(group.id) || groupIds.has(group.id) || !Array.isArray(group.students) || group.students.length > 50000 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(group.t) || (group.e && !/^([01]\d|2[0-3]):[0-5]\d$/.test(group.e))) throw new Error('Invalid group');
      groupIds.add(group.id);
      const days = group.days || [group.d || 0];
      if (!Array.isArray(days) || days.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Invalid schedule');
      for (const student of group.students) {
        if (!object(student) || !id(student.id) || studentIds.has(student.id) || !text(student.name) || !text(student.phone || '') || (student.since && !month(student.since))) throw new Error('Invalid student');
        studentIds.add(student.id);
        for (const field of ['lvl', 'ct', 'style', 'strg', 'weak', 'note']) if (student[field] != null && !text(student[field])) throw new Error('Invalid student field');
        if (student.lvl && !['ممتاز', 'جيد', 'محتاج دعم'].includes(student.lvl)) throw new Error('Invalid level');
        if (student.ct && !['صباحًا', 'مساءً', 'أي وقت'].includes(student.ct)) throw new Error('Invalid contact time');
      }
    }
    for (const [key, records] of Object.entries(state.att)) {
      const [day, groupId] = key.split('|');
      if (!date(day) || !id(groupId) || !object(records) || Object.entries(records).some(([key, value]) => !id(key) || ![true, false, null].includes(value))) throw new Error('Invalid attendance');
    }
    for (const [key, records] of Object.entries(state.pay)) if (!month(key) || !object(records) || Object.entries(records).some(([key, value]) => !id(key) || typeof value !== 'boolean')) throw new Error('Invalid payments');
    for (const exam of state.exams) if (!object(exam) || !id(exam.id) || !id(exam.gid) || !text(exam.title) || !date(exam.date) || !amount(exam.max) || exam.max === 0 || !object(exam.scores) || Object.entries(exam.scores).some(([key, score]) => !id(key) || !(score == null || score === '' || amount(score) && score <= exam.max))) throw new Error('Invalid exam');
    if (state.paymentLedger != null && (!Array.isArray(state.paymentLedger) || state.paymentLedger.some(item => !object(item) || !id(item.id) || !id(item.studentId) || !text(item.studentName) || !month(item.month) || !['payment', 'reversal'].includes(item.kind) || !amount(item.amount) || !Number.isFinite(Date.parse(item.occurredAt))))) throw new Error('Invalid ledger');
    return state;
  }
  function parseBackup(text) {
    if (text.length > 5 * 1024 * 1024) throw new Error('Backup exceeds 5 MB');
    const state = JSON.parse(text, (key, value) => {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Unsafe backup key');
      return value;
    });
    return validateState(state);
  }
  return {localDate, recentMonths, findStudent, isActive, clampScore, monthlyTotals, togglePayment, validateState, parseBackup};
});
