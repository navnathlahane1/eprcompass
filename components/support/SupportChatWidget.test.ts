import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('@/lib/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: undefined }));
import SupportChatWidget from './SupportChatWidget';

it('does not initialize support or crash login when Supabase is not configured', () => {
  expect(renderToString(createElement(SupportChatWidget, { portal: 'partner' }))).toBe('');
  expect(renderToString(createElement(SupportChatWidget, { portal: 'recycler-portal' }))).toBe('');
});
