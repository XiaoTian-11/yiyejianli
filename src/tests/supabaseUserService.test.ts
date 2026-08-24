import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '../types';

// ─── Mock Supabase ───────────────────────────────────────────────────────────
// Build a reusable query-chain mock that handles all three branches:
//   select → eq → maybeSingle|single
//   insert → select → single
//   update → eq (Promise)

const mock = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const single = vi.fn();
  const insertSingle = vi.fn();
  const updateEq = vi.fn();

  // Chain object returned by .from() — every chaining method returns itself
  const chain: Record<string, any> = {};

  // --- Select branch ---
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.maybeSingle = maybeSingle;   // terminal
  chain.single = single;             // terminal

  // --- Insert branch: insert() → items.select() → items.single() ---
  chain.insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: insertSingle,          // terminal
    })),
  }));

  // --- Update branch: update() → eq() → Promise directly ---
  chain.update = vi.fn(() => ({
    eq: updateEq,                    // terminal (returns Promise directly)
  }));

  const from = vi.fn(() => chain);

  return { maybeSingle, single, insertSingle, updateEq, from };
});

vi.mock('../lib/supabase', () => ({
  supabase: { from: mock.from },
}));

// ─── Module under test ───────────────────────────────────────────────────────
import { getUser, updateUser, checkAndDowngrade } from '../lib/supabaseUserService';

// ─── Test data ───────────────────────────────────────────────────────────────
const rawUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  tier: 'free',
  member_until: null,
  remaining_pdf_exports: 0,
  remaining_png_exports: 0,
  remaining_ats_checks: 0,
};

const expectedUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  tier: 'free',
  status: 'active',
  memberUntil: undefined,
  remainingPdfExports: 0,
  remainingPngExports: 0,
  remainingAtsChecks: 0,
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('supabaseUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all queries succeed with empty result
    mock.maybeSingle.mockResolvedValue({ data: null, error: null });
    mock.single.mockResolvedValue({ data: null, error: null });
    mock.insertSingle.mockResolvedValue({ data: null, error: null });
    mock.updateEq.mockResolvedValue({ error: null });
  });

  // ── getUser ──────────────────────────────────────────────────────────────
  describe('getUser', () => {
    it('should return user data when user exists in database', async () => {
      mock.maybeSingle.mockResolvedValue({ data: rawUser, error: null });

      const result = await getUser('test-user-id');

      expect(result.error).toBeNull();
      expect(result.user).toEqual(expectedUser);
      // Verify the query chain was built correctly
      expect(mock.from).toHaveBeenCalledWith('users');
    });

    it('should create a default free user when no record exists', async () => {
      // Step 1: select returns null
      mock.maybeSingle.mockResolvedValue({ data: null, error: null });
      // Step 2: insert succeeds
      const newUser = {
        id: 'new-user-id',
        email: '',
        tier: 'free',
        remaining_pdf_exports: 0,
        remaining_png_exports: 0,
        remaining_ats_checks: 0,
      };
      mock.insertSingle.mockResolvedValue({ data: newUser, error: null });

      const result = await getUser('new-user-id');

      expect(result.error).toBeNull();
      expect(result.user).toBeDefined();
      expect(result.user!.tier).toBe('free');
      expect(result.user!.id).toBe('new-user-id');
    });

    it('should return error when database select fails', async () => {
      mock.maybeSingle.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const result = await getUser('test-user-id');

      expect(result.error).toBe('Database connection failed');
      expect(result.user).toBeNull();
    });

    it('should return error when insert fails for new user', async () => {
      mock.maybeSingle.mockResolvedValue({ data: null, error: null });
      mock.insertSingle.mockResolvedValue({
        data: null,
        error: new Error('Insert failed'),
      });

      const result = await getUser('new-user-id');

      expect(result.error).toBe('Insert failed');
      expect(result.user).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      mock.maybeSingle.mockRejectedValue(new Error('Unexpected error'));

      const result = await getUser('test-user-id');

      expect(result.error).toContain('Unexpected error');
      expect(result.user).toBeNull();
    });
  });

  // ── updateUser ─────────────────────────────────────────────────────────────
  describe('updateUser', () => {
    it('should return success when update completes', async () => {
      mock.updateEq.mockResolvedValue({ error: null });

      const result = await updateUser('test-user-id', { tier: 'member' });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return error when update fails', async () => {
      mock.updateEq.mockResolvedValue({ error: new Error('Update failed') });

      const result = await updateUser('test-user-id', { tier: 'member' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('should handle exceptions in update', async () => {
      mock.updateEq.mockRejectedValue(new Error('Network error'));

      const result = await updateUser('test-user-id', { tier: 'member' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  // ── checkAndDowngrade ──────────────────────────────────────────────────────
  describe('checkAndDowngrade', () => {
    it('should not downgrade a free user', async () => {
      mock.single.mockResolvedValue({ data: rawUser, error: null });

      const result = await checkAndDowngrade('test-user-id');

      expect(result.downgraded).toBe(false);
      expect(result.user?.tier).toBe('free');
      expect(result.error).toBeNull();
    });

    it('should not downgrade a member with future expiry', async () => {
      const activeMember = {
        ...rawUser,
        tier: 'member',
        member_until: '2099-12-31T23:59:59Z',
      };
      mock.single.mockResolvedValue({ data: activeMember, error: null });

      const result = await checkAndDowngrade('test-user-id');

      expect(result.downgraded).toBe(false);
      expect(result.user?.tier).toBe('member');
      expect(result.error).toBeNull();
    });

    it('should downgrade an expired member to free', async () => {
      const expiredMember = {
        ...rawUser,
        tier: 'member',
        member_until: '2020-01-01T00:00:00Z',
      };
      mock.single.mockResolvedValue({ data: expiredMember, error: null });
      mock.updateEq.mockResolvedValue({ error: null });

      const result = await checkAndDowngrade('test-user-id');

      expect(result.downgraded).toBe(true);
      expect(result.user?.tier).toBe('free');
      expect(result.error).toBeNull();
    });

    it('should return error when user is not found', async () => {
      mock.single.mockResolvedValue({
        data: null,
        error: new Error('User not found'),
      });

      const result = await checkAndDowngrade('nonexistent');

      expect(result.error).toBe('User not found');
      expect(result.user).toBeNull();
      expect(result.downgraded).toBe(false);
    });

    it('should handle exception in checkAndDowngrade', async () => {
      mock.single.mockRejectedValue(new Error('DB crashed'));

      const result = await checkAndDowngrade('test-user-id');

      expect(result.error).toContain('DB crashed');
      expect(result.user).toBeNull();
      expect(result.downgraded).toBe(false);
    });
  });
});
