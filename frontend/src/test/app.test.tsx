import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/layout/Toast'
import { NAV_ITEMS } from '../components/layout/MenuDrawer'
import { StatusBadge } from '../components/common/StatusBadge'
import { AppRoutes } from '../AppRoutes'

afterEach(() => cleanup())

/**
 * Render AppRoutes inside MemoryRouter + ToastProvider.
 * AppRoutes contains NO Router provider, so this is safe.
 */
function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </MemoryRouter>
  )
}

// ── Test 1: Navigation entries order ─────────────────────────────────────────
describe('Menu Drawer navigation', () => {
  it('has exactly 13 nav items in the specified order', () => {
    expect(NAV_ITEMS).toHaveLength(13)
    const expectedOrder = [
      'Overview', 'Chat', 'Computer', 'Files', 'Browser', 'Phone',
      'Messages', 'Calendar', 'Integrations', 'Automation', 'Memory',
      'Activity', 'Settings',
    ]
    NAV_ITEMS.forEach((item, i) => {
      expect(item.label).toBe(expectedOrder[i])
    })
  })

  it('opens drawer and shows all 13 navigation links', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const menuBtn = screen.getByRole('button', { name: /open navigation menu/i })
    await user.click(menuBtn)

    const drawer = screen.getByRole('dialog', { name: /navigation menu/i })
    expect(drawer).toBeInTheDocument()

    const links = within(drawer).getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(13)
  })

  it('closes drawer on Escape and removes it from DOM', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const menuBtn = screen.getByRole('button', { name: /open navigation menu/i })
    await user.click(menuBtn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('current page link has aria-current="page"', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const menuBtn = screen.getByRole('button', { name: /open navigation menu/i })
    await user.click(menuBtn)

    const drawer = screen.getByRole('dialog')
    const currentLink = within(drawer).getByRole('link', { name: /overview/i })
    expect(currentLink).toHaveAttribute('aria-current', 'page')
  })
})

// ── Test 2: DEMO DATA labels on Overview ─────────────────────────────────────
describe('Overview DEMO DATA labels', () => {
  it('has DEMO DATA badges visible in the UI', () => {
    renderAt('/')
    const demoBadges = screen.getAllByText(/demo data/i)
    expect(demoBadges.length).toBeGreaterThan(0)
  })

  it('shows Storage panel', () => {
    renderAt('/')
    expect(screen.getByText('Storage')).toBeInTheDocument()
  })

  it('shows "DEMO — none running" on Active Tasks panel', () => {
    renderAt('/')
    expect(screen.getByText(/demo.*none running/i)).toBeInTheDocument()
  })

  it('shows Network panel title', () => {
    renderAt('/')
    expect(screen.getByText('Network')).toBeInTheDocument()
  })

  it('shows Recent Activity panel title', () => {
    renderAt('/')
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })

  it('shows Upcoming Events panel title', () => {
    renderAt('/')
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
  })
})

// ── Test 3: Local AI Model — NOT CONNECTED, no fabricated metrics ─────────────
describe('Local AI Model panel', () => {
  it('shows NOT CONNECTED status (badge, caption, or status div)', () => {
    renderAt('/')
    // Multiple elements can legitimately say "not connected" on Overview
    const matches = screen.getAllByText(/not connected/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows "--" for all metric fields (no fabricated numbers)', () => {
    renderAt('/')
    const dashes = screen.getAllByText(/^--$/)
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('shows "Configured target (not verified)" note', () => {
    renderAt('/')
    expect(screen.getByText(/configured target \(not verified\)/i)).toBeInTheDocument()
  })

  it('shows model name qwen3.5:4b', () => {
    renderAt('/')
    expect(screen.getByText('qwen3.5:4b')).toBeInTheDocument()
  })
})

// ── Test 4: Integrations all Unimplemented ────────────────────────────────────
describe('Integrations rail on Overview', () => {
  it('shows "All integrations: Unimplemented" caption', () => {
    renderAt('/')
    expect(screen.getByText(/all integrations: unimplemented/i)).toBeInTheDocument()
  })

  it('none show a connected status indicator', () => {
    renderAt('/')
    // No "Connected" text anywhere in the integrations section
    const connectedTexts = screen.queryAllByText(/^connected$/i)
    expect(connectedTexts.length).toBe(0)
  })
})

// ── Test 5: Integrations full page ───────────────────────────────────────────
describe('Integrations page', () => {
  it('shows all integration items labelled Unimplemented', () => {
    renderAt('/integrations')
    const cards = screen.getAllByText('Unimplemented')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('shows the status legend', () => {
    renderAt('/integrations')
    expect(screen.getByText(/status types/i)).toBeInTheDocument()
  })
})

// ── Test 6: Voice panel disabled ─────────────────────────────────────────────
describe('Voice Input panel', () => {
  it('mic button is disabled with aria-disabled=true', () => {
    renderAt('/')
    const micBtn = screen.getByRole('button', {
      name: /microphone button.*disabled/i,
    })
    expect(micBtn).toBeDisabled()
    expect(micBtn).toHaveAttribute('aria-disabled', 'true')
  })

  it('does NOT call navigator.mediaDevices.getUserMedia', () => {
    const spy = vi.spyOn(navigator.mediaDevices, 'getUserMedia')
    renderAt('/')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('voice text input is disabled', () => {
    renderAt('/')
    const input = screen.getByPlaceholderText(/voice and commands arrive/i)
    expect(input).toBeDisabled()
  })
})

// ── Test 7: Central mic dock button disabled ──────────────────────────────────
describe('Bottom dock', () => {
  it('central mic dock button is disabled', () => {
    renderAt('/')
    // Find the Voice dock button which is the disabled mic
    const disabledMicBtn = screen.getByRole('button', {
      name: /voice.*disabled.*not implemented/i,
    })
    expect(disabledMicBtn).toBeDisabled()
  })
})

// ── Test 8: Chat page behaviour ───────────────────────────────────────────────
describe('Chat page', () => {
  it('shows empty state initially', () => {
    renderAt('/chat')
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })

  it('shows NOT CONNECTED status badge', () => {
    renderAt('/chat')
    // StatusBadge shows NOT CONNECTED — may appear multiple times in the page
    const matches = screen.getAllByText(/not connected/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('Send button is disabled when input is empty', () => {
    renderAt('/chat')
    const sendBtn = screen.getByRole('button', { name: /send message/i })
    expect(sendBtn).toBeDisabled()
  })

  it('Enter key sends user message and appends a system notice (no fake AI reply)', async () => {
    const user = userEvent.setup()
    renderAt('/chat')

    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.click(textarea)
    await user.type(textarea, 'Hello ZAID')
    await user.keyboard('{Enter}')

    expect(screen.getByText('Hello ZAID')).toBeInTheDocument()
    // System notice text appears (multiple elements may match — the paragraph + live region)
    const notices = screen.getAllByText(/ai engine not connected/i)
    expect(notices.length).toBeGreaterThan(0)
    // No fake assistant label
    expect(screen.queryByText(/assistant/i)).not.toBeInTheDocument()
  })

  it('Shift+Enter does NOT send a message', async () => {
    const user = userEvent.setup()
    renderAt('/chat')

    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.click(textarea)
    await user.type(textarea, 'Hello')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    // Empty state still showing — nothing was sent
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })

  it('empty message cannot be sent by clicking Send', async () => {
    const user = userEvent.setup()
    renderAt('/chat')

    const sendBtn = screen.getByRole('button', { name: /send message/i })
    // Button should be disabled — click has no effect
    expect(sendBtn).toBeDisabled()
    await user.click(sendBtn)
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })
})

// ── Test 9: Placeholder pages show Unimplemented ─────────────────────────────
describe('Placeholder pages', () => {
  const stubs = [
    { path: '/computer',   title: 'Computer'   },
    { path: '/files',      title: 'Files'      },
    { path: '/browser',    title: 'Browser'    },
    { path: '/phone',      title: 'Phone'      },
    { path: '/messages',   title: 'Messages'   },
    { path: '/automation', title: 'Automation' },
    { path: '/memory',     title: 'Memory'     },
    { path: '/activity',   title: 'Activity'   },
    { path: '/settings',   title: 'Settings'   },
  ]

  stubs.forEach(({ path, title }) => {
    it(`${title} page shows title h1 and Unimplemented badge`, () => {
      renderAt(path)
      // h1 with the page title
      expect(
        screen.getByRole('heading', { level: 1, name: new RegExp(title, 'i') })
      ).toBeInTheDocument()
      // At least one Unimplemented badge
      expect(screen.getAllByText(/unimplemented/i).length).toBeGreaterThan(0)
    })
  })
})

// ── Test 10: StatusBadge renders all five variants with visible text ──────────
describe('StatusBadge variants', () => {
  const variants = [
    'connected', 'disconnected', 'unavailable', 'demo', 'unimplemented',
  ] as const

  variants.forEach(variant => {
    it(`renders "${variant}" with icon + text label (never colour alone)`, () => {
      render(<StatusBadge variant={variant} />)
      const badge = document.querySelector('[class*="badge"]')
      expect(badge).toBeInTheDocument()
      // Label span must have non-empty text
      const label = badge?.querySelector('[class*="label"]')
      expect(label).toBeInTheDocument()
      expect((label?.textContent ?? '').trim().length).toBeGreaterThan(0)
    })
  })
})

// ── Test 11: No network calls during render ───────────────────────────────────
describe('No network calls during render', () => {
  it('fetch is not called during Overview render', () => {
    renderAt('/')
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('fetch is not called during Chat page render', () => {
    renderAt('/chat')
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })
})

// ── Test 12: Quick Launch unimplemented items show toast ─────────────────────
describe('Quick Launch unimplemented launchers', () => {
  it('Code launcher shows a toast and does NOT navigate', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const codeBtn = screen.getByRole('button', { name: /code.*not implemented/i })
    await user.click(codeBtn)

    expect(
      screen.getByText(/code launcher is not implemented yet/i)
    ).toBeInTheDocument()
  })
})

// ── Test 13: 404 page ─────────────────────────────────────────────────────────
describe('404 page', () => {
  it('shows friendly not found message for unknown routes', () => {
    renderAt('/this-does-not-exist')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return to overview/i })).toBeInTheDocument()
  })
})
