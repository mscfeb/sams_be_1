import { env } from "../../config/env.js";

export function roundPercentage(value) {
  return Math.round(value * 100) / 100;
}

export function summarizeRecords(records) {
  const summary = {
    totalSessions: records.length,
    present: 0,
    absent: 0,
    late: 0
  };

  for (const record of records) {
    if (record.status === "PRESENT") summary.present += 1;
    if (record.status === "ABSENT") summary.absent += 1;
    if (record.status === "LATE") summary.late += 1;
  }

  const attended = summary.present + summary.late;
  return {
    ...summary,
    attended,
    attendancePercentage: summary.totalSessions === 0
      ? 0
      : roundPercentage((attended / summary.totalSessions) * 100),
    lowAttendance: summary.totalSessions > 0 &&
      roundPercentage((attended / summary.totalSessions) * 100) < env.LOW_ATTENDANCE_THRESHOLD
  };
}

export function groupByOffering(records) {
  const grouped = new Map();
  for (const record of records) {
    const offeringId = record.attendanceSession.subjectOfferingId;
    if (!grouped.has(offeringId)) grouped.set(offeringId, []);
    grouped.get(offeringId).push(record);
  }
  return grouped;
}
