import { hashPassword, verifyPassword } from '@/lib/auth-utils';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('auth-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with salt rounds', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashed_password_123';

      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle hashing errors', async () => {
      const password = 'testpassword123';
      const error = new Error('Hashing failed');

      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow('Hashing failed');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashed_password_123';

      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);

      const result = await verifyPassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'wrongpassword';
      const hashedPassword = 'hashed_password_123';

      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      const result = await verifyPassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle verification errors', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashed_password_123';
      const error = new Error('Verification failed');

      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockRejectedValue(error);

      await expect(verifyPassword(password, hashedPassword)).rejects.toThrow(
        'Verification failed'
      );
    });
  });
});
