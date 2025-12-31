import { describe, it, expect } from '@jest/globals';

// 邮箱格式验证正则
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 密码安全性验证
const isValidPassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少6位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  return { valid: true, message: '' };
};

describe('用户注册验证', () => {
  describe('邮箱格式验证', () => {
    it('应该接受有效邮箱格式', () => {
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('user.name@domain.cn')).toBe(true);
      expect(emailRegex.test('123456@qq.com')).toBe(true);
    });

    it('应该拒绝无效邮箱格式', () => {
      expect(emailRegex.test('invalid')).toBe(false);
      expect(emailRegex.test('no@domain')).toBe(false);
      expect(emailRegex.test('@example.com')).toBe(false);
      expect(emailRegex.test('test@.com')).toBe(false);
    });
  });

  describe('密码安全性验证', () => {
    it('应该接受符合要求的密码', () => {
      expect(isValidPassword('abc123').valid).toBe(true);
      expect(isValidPassword('Test2024').valid).toBe(true);
      expect(isValidPassword('Password1').valid).toBe(true);
    });

    it('应该拒绝长度不足的密码', () => {
      const result = isValidPassword('ab1');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码长度至少6位');
    });

    it('应该拒绝不含字母的密码', () => {
      const result = isValidPassword('123456');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码必须包含字母');
    });

    it('应该拒绝不含数字的密码', () => {
      const result = isValidPassword('abcdef');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码必须包含数字');
    });
  });
});
