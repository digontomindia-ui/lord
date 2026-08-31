import { assertTransition, TRANSITIONS } from '../src/services/orderStateMachine.js';

describe('Order State Machine Pure Unit Tests', () => {
  test('All transitions contain valid structure', () => {
    Object.entries(TRANSITIONS).forEach(([status, rules]) => {
      expect(Array.isArray(rules.allowedNext)).toBe(true);
      expect(Array.isArray(rules.allowedRoles)).toBe(true);
    });
  });

  test('Shop can create and request pickup', () => {
    expect(assertTransition('ORDER_CREATED', 'PICKUP_REQUESTED', 'SHOP')).toBe(true);
  });

  test('Master can assign tailor', () => {
    expect(assertTransition('WORKSHOP_RECEIVED', 'TAILOR_ASSIGNED', 'MASTER')).toBe(true);
  });

  test('Tailor can accept and start work', () => {
    expect(assertTransition('TAILOR_ASSIGNED', 'TAILOR_ACCEPTED', 'TAILOR')).toBe(true);
    expect(assertTransition('TAILOR_ACCEPTED', 'WORK_STARTED', 'TAILOR')).toBe(true);
  });

  test('QC Approve transitions to READY_FOR_DELIVERY', () => {
    expect(assertTransition('QC_PENDING', 'QC_APPROVED', 'MASTER')).toBe(true);
    expect(assertTransition('QC_APPROVED', 'READY_FOR_DELIVERY', 'MASTER')).toBe(true);
  });

  test('QC Fail transitions to REWORK_REQUIRED', () => {
    expect(assertTransition('QC_PENDING', 'QC_FAILED', 'MASTER')).toBe(true);
    expect(assertTransition('QC_FAILED', 'REWORK_REQUIRED', 'MASTER')).toBe(true);
  });

  test('Super Admin has master override permissions across valid transitions', () => {
    expect(assertTransition('ORDER_CREATED', 'PICKUP_REQUESTED', 'SUPER_ADMIN')).toBe(true);
    expect(assertTransition('WORKSHOP_RECEIVED', 'TAILOR_ASSIGNED', 'SUPER_ADMIN')).toBe(true);
    expect(assertTransition('QC_PENDING', 'QC_APPROVED', 'SUPER_ADMIN')).toBe(true);
  });

  test('Invalid transition jumps throw illegal transition error', () => {
    expect(() => assertTransition('ORDER_CREATED', 'QC_APPROVED', 'SHOP'))
      .toThrow('Illegal state transition');
    expect(() => assertTransition('PICKUP_REQUESTED', 'WORK_COMPLETED', 'TAILOR'))
      .toThrow('Illegal state transition');
  });

  test('Unauthorized role throws role permission error', () => {
    expect(() => assertTransition('WORKSHOP_RECEIVED', 'TAILOR_ASSIGNED', 'SHOP'))
      .toThrow('is not permitted to transition');
  });
});
