import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePilotAccess } from '../src/services/pilotAccessService.js';

test('pilot access is blocked without invitation while pilot mode is enabled', () => {
  const result = evaluatePilotAccess({
    isPilotMode: true,
    role: 'CUSTOMER',
    email: 'new-customer@example.com',
    invitations: [],
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'Pilot access is required for private beta signup.');
});

test('pilot access is allowed with a valid invitation while pilot mode is enabled', () => {
  const result = evaluatePilotAccess({
    isPilotMode: true,
    role: 'WORKSHOP_OWNER',
    email: 'owner@example.com',
    invitations: [{ email: 'owner@example.com', role: 'WORKSHOP_OWNER', status: 'INVITED', expiresAt: '2099-01-01T00:00:00.000Z' }],
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reason, null);
});
