import * as React from 'react';
import { render } from '@react-email/render';
import { Welcome } from '../templates/welcome';
import { VerifyEmail } from '../templates/verify-email';
import { ResetPassword } from '../templates/reset-password';
import { PasswordChanged } from '../templates/password-changed';
import { TaskDueReminderEmail } from '../templates/task-due-reminder';

describe('Email Templates', () => {
  describe('Welcome Template', () => {
    it('should render without errors', () => {
      const html = render(<Welcome />);
      expect(html).toContain('Welcome');
    });

    it('should include action button when provided', () => {
      const html = render(
        <Welcome action={{ label: 'Get Started', href: 'https://example.com' }} />
      );
      expect(html).toContain('Get Started');
      expect(html).toContain('https://example.com');
    });

    it('should include custom app name', () => {
      const html = render(<Welcome appName="MyApp" />);
      expect(html).toContain('MyApp');
    });

    it('should include support URL', () => {
      const html = render(<Welcome supportUrl="https://support.example.com" />);
      expect(html).toContain('https://support.example.com');
    });

    it('should include unsubscribe URL', () => {
      const html = render(<Welcome unsubscribeUrl="https://unsub.example.com" />);
      expect(html).toContain('https://unsub.example.com');
    });
  });

  describe('VerifyEmail Template', () => {
    it('should render without errors', () => {
      const html = render(<VerifyEmail />);
      expect(html).toContain('Verify');
      expect(html).toContain('email');
    });

    it('should include verify action', () => {
      const html = render(
        <VerifyEmail action={{ label: 'Verify Email', href: 'https://verify.example.com' }} />
      );
      expect(html).toContain('Verify Email');
      expect(html).toContain('https://verify.example.com');
    });

    it('should mention expiration', () => {
      const html = render(<VerifyEmail />);
      expect(html.toLowerCase()).toContain('expire');
    });
  });

  describe('ResetPassword Template', () => {
    it('should render without errors', () => {
      const html = render(<ResetPassword />);
      expect(html).toContain('Reset');
      expect(html).toContain('password');
    });

    it('should include reset action', () => {
      const html = render(
        <ResetPassword action={{ label: 'Reset Password', href: 'https://reset.example.com' }} />
      );
      expect(html).toContain('Reset Password');
      expect(html).toContain('https://reset.example.com');
    });

    it('should mention link expiration', () => {
      const html = render(<ResetPassword />);
      expect(html.toLowerCase()).toContain('expire');
    });
  });

  describe('PasswordChanged Template', () => {
    it('should render without errors', () => {
      const html = render(<PasswordChanged />);
      expect(html).toContain('Password');
    });

    it('should include secure account action', () => {
      const html = render(
        <PasswordChanged action={{ label: 'Secure Account', href: 'https://secure.example.com' }} />
      );
      expect(html).toContain('Secure Account');
    });

    it('should mention action if not user', () => {
      const html = render(<PasswordChanged />);
      expect(html.toLowerCase()).toContain('if');
    });
  });

  describe('TaskDueReminderEmail Template', () => {
    it('should render with goal name', () => {
      const html = render(<TaskDueReminderEmail goalName="Complete project" />);
      expect(html).toContain('Complete project');
    });

    it('should include project name when provided', () => {
      const html = render(<TaskDueReminderEmail goalName="Task 1" projectName="My Project" />);
      expect(html).toContain('My Project');
    });

    it('should include action button', () => {
      const html = render(
        <TaskDueReminderEmail
          goalName="Task 1"
          action={{ label: 'View Task', href: 'https://tasks.example.com' }}
        />
      );
      expect(html).toContain('View Task');
    });

    it('should have warning theme', () => {
      const html = render(<TaskDueReminderEmail goalName="Task 1" />);
      // Warning theme color is amber/orange related
      expect(html).toContain('fffbeb'); // Warning light color
    });
  });
});
