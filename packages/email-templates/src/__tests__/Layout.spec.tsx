import * as React from 'react';
import { render } from '@react-email/render';
import {
  Layout,
  HighlightBox,
  MetricsGrid,
  InfoRows,
  StreakBadge,
  Avatar,
  BulletList,
} from '../components/Layout';

describe('Layout Component', () => {
  describe('Layout', () => {
    it('should render with required props', () => {
      const html = render(
        <Layout preview="Test preview" title="Test Title">
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('Test Title');
      expect(html).toContain('Content');
    });

    it('should include preview text', () => {
      const html = render(
        <Layout preview="This is a preview" title="Title">
          <div>Content</div>
        </Layout>
      );
      // Preview is in a hidden element for email clients
      expect(html).toContain('This is a preview');
    });

    it('should render intro text', () => {
      const html = render(
        <Layout preview="Preview" title="Title" intro="Introduction text here">
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('Introduction text here');
    });

    it('should render action button', () => {
      const html = render(
        <Layout
          preview="Preview"
          title="Title"
          action={{ label: 'Click Me', href: 'https://example.com' }}
        >
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('Click Me');
      expect(html).toContain('https://example.com');
    });

    it('should use custom app name', () => {
      const html = render(
        <Layout preview="Preview" title="Title" appName="CustomApp">
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('CustomApp');
    });

    it('should include support and unsubscribe links', () => {
      const html = render(
        <Layout
          preview="Preview"
          title="Title"
          supportUrl="https://support.example.com"
          unsubscribeUrl="https://unsub.example.com"
        >
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('https://support.example.com');
      expect(html).toContain('https://unsub.example.com');
    });

    it('should render celebration emoji', () => {
      const html = render(
        <Layout preview="Preview" title="Title" celebration="🎉">
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('🎉');
    });

    it('should render with different themes', () => {
      const themes = ['primary', 'success', 'warning', 'danger', 'purple', 'blue'] as const;

      themes.forEach((theme) => {
        const html = render(
          <Layout preview="Preview" title="Title" theme={theme}>
            <div>Content</div>
          </Layout>
        );
        expect(html).toBeDefined();
        expect(html.length).toBeGreaterThan(0);
      });
    });

    it('should render with header background', () => {
      const html = render(
        <Layout preview="Preview" title="Title" headerBg={true}>
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('linear-gradient');
    });

    it('should render custom icon', () => {
      const html = render(
        <Layout preview="Preview" title="Title" icon={<span>🔔</span>}>
          <div>Content</div>
        </Layout>
      );
      expect(html).toContain('🔔');
    });
  });

  describe('HighlightBox', () => {
    it('should render children', () => {
      const html = render(
        <HighlightBox>
          <span>Highlighted content</span>
        </HighlightBox>
      );
      expect(html).toContain('Highlighted content');
    });

    it('should apply theme colors', () => {
      const html = render(
        <HighlightBox theme="success">
          <span>Success content</span>
        </HighlightBox>
      );
      expect(html).toContain('Success content');
      expect(html).toContain('#ecfdf5'); // Success light color
    });

    it('should apply custom className', () => {
      const html = render(
        <HighlightBox className="custom-class">
          <span>Content</span>
        </HighlightBox>
      );
      expect(html).toContain('custom-class');
    });
  });

  describe('MetricsGrid', () => {
    it('should render metrics', () => {
      const metrics = [
        { label: 'Tasks', value: '10' },
        { label: 'Completed', value: '8' },
      ];
      const html = render(<MetricsGrid metrics={metrics} />);
      expect(html).toContain('Tasks');
      expect(html).toContain('10');
      expect(html).toContain('Completed');
      expect(html).toContain('8');
    });

    it('should apply theme colors', () => {
      const metrics = [{ label: 'Score', value: '100%' }];
      const html = render(<MetricsGrid metrics={metrics} theme="success" />);
      expect(html).toContain('100%');
      expect(html).toContain('#10b981'); // Success bg color
    });

    it('should handle empty metrics', () => {
      const html = render(<MetricsGrid metrics={[]} />);
      expect(html).toBeDefined();
    });
  });

  describe('InfoRows', () => {
    it('should render info items', () => {
      const items = [
        { label: 'Name', value: 'John' },
        { label: 'Email', value: 'john@example.com' },
      ];
      const html = render(<InfoRows items={items} />);
      expect(html).toContain('Name');
      expect(html).toContain('John');
      expect(html).toContain('Email');
      expect(html).toContain('john@example.com');
    });

    it('should handle empty items', () => {
      const html = render(<InfoRows items={[]} />);
      expect(html).toBeDefined();
    });
  });

  describe('StreakBadge', () => {
    it('should render streak days', () => {
      const html = render(<StreakBadge days={7} />);
      expect(html).toContain('7');
      expect(html).toContain('days');
    });

    it('should include fire emoji', () => {
      const html = render(<StreakBadge days={30} />);
      expect(html).toContain('🔥');
    });

    it('should render large streak numbers', () => {
      const html = render(<StreakBadge days={365} />);
      expect(html).toContain('365');
    });
  });

  describe('Avatar', () => {
    it('should render first letter of name', () => {
      const html = render(<Avatar name="John" />);
      expect(html).toContain('J');
    });

    it('should uppercase the letter', () => {
      const html = render(<Avatar name="alice" />);
      expect(html).toContain('A');
    });

    it('should apply theme colors', () => {
      const html = render(<Avatar name="Bob" theme="success" />);
      expect(html).toContain('#ecfdf5'); // Success light
      expect(html).toContain('#10b981'); // Success bg
    });
  });

  describe('BulletList', () => {
    it('should render list items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const html = render(<BulletList items={items} />);
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
      expect(html).toContain('Item 3');
    });

    it('should include checkmarks', () => {
      const items = ['Task completed'];
      const html = render(<BulletList items={items} />);
      expect(html).toContain('✓');
    });

    it('should handle empty list', () => {
      const html = render(<BulletList items={[]} />);
      expect(html).toBeDefined();
    });
  });
});
