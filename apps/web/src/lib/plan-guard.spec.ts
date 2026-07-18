import { getPlanRequirement, hasPlanAccess } from './plan-guard';

describe('plan-guard', () => {
  describe('hasPlanAccess', () => {
    describe('admin role bypass', () => {
      it('should grant ADMIN access to PRO routes regardless of plan', () => {
        expect(hasPlanAccess('FREE', 'PRO', 'ADMIN')).toBe(true);
      });

      it('should grant ADMIN access to FAMILY routes regardless of plan', () => {
        expect(hasPlanAccess('FREE', 'FAMILY', 'ADMIN')).toBe(true);
      });

      it('should grant SUPER_ADMIN access to PRO routes regardless of plan', () => {
        expect(hasPlanAccess('FREE', 'PRO', 'SUPER_ADMIN')).toBe(true);
      });

      it('should grant SUPER_ADMIN access to FAMILY routes regardless of plan', () => {
        expect(hasPlanAccess('FREE', 'FAMILY', 'SUPER_ADMIN')).toBe(true);
      });

      it('should grant ADMIN access even with null plan', () => {
        expect(hasPlanAccess(null, 'PRO', 'ADMIN')).toBe(true);
      });

      it('should grant SUPER_ADMIN access even with undefined plan', () => {
        expect(hasPlanAccess(undefined, 'FAMILY', 'SUPER_ADMIN')).toBe(true);
      });
    });

    describe('regular user plan checks', () => {
      it('should deny FREE user access to PRO routes', () => {
        expect(hasPlanAccess('FREE', 'PRO')).toBe(false);
      });

      it('should deny FREE user access to PRO routes with USER role', () => {
        expect(hasPlanAccess('FREE', 'PRO', 'USER')).toBe(false);
      });

      it('should deny FREE user access to FAMILY routes', () => {
        expect(hasPlanAccess('FREE', 'FAMILY')).toBe(false);
      });

      it('should deny PRO user access to FAMILY routes', () => {
        expect(hasPlanAccess('PRO', 'FAMILY')).toBe(false);
      });

      it('should grant PRO user access to PRO routes', () => {
        expect(hasPlanAccess('PRO', 'PRO')).toBe(true);
      });

      it('should grant FAMILY user access to PRO routes', () => {
        expect(hasPlanAccess('FAMILY', 'PRO')).toBe(true);
      });

      it('should grant FAMILY user access to FAMILY routes', () => {
        expect(hasPlanAccess('FAMILY', 'FAMILY')).toBe(true);
      });

      it('should return false when userPlan is null and no admin role', () => {
        expect(hasPlanAccess(null, 'PRO')).toBe(false);
      });

      it('should return false when userPlan is undefined and no admin role', () => {
        expect(hasPlanAccess(undefined, 'PRO')).toBe(false);
      });
    });

    describe('unknown role falls through to plan check', () => {
      it('should use plan check for unrecognised role', () => {
        expect(hasPlanAccess('FREE', 'PRO', 'MODERATOR')).toBe(false);
        expect(hasPlanAccess('PRO', 'PRO', 'MODERATOR')).toBe(true);
      });
    });
  });

  describe('getPlanRequirement', () => {
    it('should return PRO requirement for /ai route', () => {
      const req = getPlanRequirement('/ai');
      expect(req?.requiredPlan).toBe('PRO');
    });

    it('should return PRO requirement for /rhythm route', () => {
      const req = getPlanRequirement('/rhythm');
      expect(req?.requiredPlan).toBe('PRO');
    });

    it('should return FAMILY requirement for /family route', () => {
      const req = getPlanRequirement('/family');
      expect(req?.requiredPlan).toBe('FAMILY');
    });

    it('should return null for /dashboard (no plan required)', () => {
      expect(getPlanRequirement('/dashboard')).toBeNull();
    });

    it('should return null for /settings (no plan required)', () => {
      expect(getPlanRequirement('/settings')).toBeNull();
    });

    it('should match nested paths', () => {
      const req = getPlanRequirement('/reviews/weekly/current');
      expect(req?.requiredPlan).toBe('PRO');
    });
  });
});
