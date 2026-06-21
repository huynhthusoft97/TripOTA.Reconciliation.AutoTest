import { expect } from 'vitest';

export function assertStatus(actual: number, expected: number) {
  expect(actual, `HTTP status mong đợi ${expected}, nhận ${actual}`).toBe(expected);
}

// Assertion nghiệp vụ — Sale Ticket sau parsing
export function assertTicketParsed(
  ticket: any,
  expected: { ticketNumber?: string; isNDC?: boolean; status?: string },
) {
  expect(ticket, 'ticket rỗng').toBeTruthy();
  if (expected.ticketNumber !== undefined) expect(ticket.ticketNumber).toBe(expected.ticketNumber);
  if (expected.isNDC !== undefined) expect(Boolean(ticket.isNDC)).toBe(expected.isNDC);
  if (expected.status !== undefined) expect(ticket.status).toBe(expected.status);
}

// Đối soát: bản ghi đã được cập nhật đủ thông tin & nhất quán
export function assertTicketReconciled(ticket: any) {
  expect(ticket.ticketNumber, 'thiếu ticketNumber').toBeTruthy();
  expect(ticket.fareAmount, 'thiếu fareAmount').toBeDefined();
  expect(['MATCHED', 'RECONCILED'], 'trạng thái đối soát không hợp lệ').toContain(ticket.reconcileStatus);
}

// Chính sách đã được áp đúng
export function assertPolicyApplied(ticket: any, expectedPolicyCode?: string) {
  expect(ticket.policyApplied, 'chính sách chưa được áp').toBe(true);
  if (expectedPolicyCode) expect(ticket.policyCode).toBe(expectedPolicyCode);
}
