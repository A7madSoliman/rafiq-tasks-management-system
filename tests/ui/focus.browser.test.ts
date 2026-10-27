import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Browser, browserPath } from './browser-support';

// Set TASKLY_BROWSER_PATH to a Chromium executable on machines without a
// standard Chrome/Edge installation. No browser automation package is needed.
describe.skipIf(!browserPath)('drawer and Epic focus in real Chromium', () => {
  const browser = new Browser();
  const drawer = '[role="dialog"][aria-label="Mobile navigation"]';
  const epic = '[role="dialog"][aria-label="Epic details"]';
  const task = '[role="dialog"][aria-labelledby="task-details-dialog-title"]';
  const focused = (selector: string) =>
    browser.evaluate(`document.activeElement?.matches(${JSON.stringify(selector)})`);
  async function click(selector: string) {
    await browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  }
  async function focus(selector: string) {
    await browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  }
  async function openDrawer() {
    await click('[aria-label="Open navigation menu"]');
    await browser.waitFor(`document.activeElement?.matches('${drawer} button')`);
  }
  async function openEpic() {
    await focus('#open-epic');
    await click('#open-epic');
    await browser.waitFor(`document.activeElement?.matches('[aria-label="Close epic details"]')`);
    await browser.waitFor(
      `Boolean(document.querySelector('[aria-label="View details for Nested task"]'))`,
    );
  }
  async function edge(selector: string, last: boolean) {
    await browser.evaluate(`(() => {
      const elements = [...document.querySelector(${JSON.stringify(selector)}).querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]')].filter(el => el.tabIndex >= 0 && el.getClientRects().length);
      elements[${last ? 'elements.length - 1' : '0'}].focus();
    })()`);
  }
  async function inside(selector: string) {
    return browser.evaluate(
      `document.querySelector(${JSON.stringify(selector)}).contains(document.activeElement)`,
    );
  }
  async function dirtyTitle() {
    // Native input event reaches React, without blurring and triggering autosave.
    await browser.evaluate(`(() => {
      const input = document.querySelector('[aria-label="Epic title"]');
      input.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Changed title');
      input.dispatchEvent(new Event('input', {bubbles:true}));
    })()`);
    await browser.key('Escape');
    await browser.waitFor('Boolean(document.querySelector("dialog[open]"))');
  }

  beforeAll(async () => {
    await browser.start();
  }, 30000);
  afterAll(async () => {
    await browser.stop();
  }, 20000);
  beforeEach(async () => {
    await browser.reset();
  });

  it('excludes closed drawer controls from programmatic and keyboard focus', async () => {
    expect(await browser.evaluate(`document.querySelector('${drawer}').parentElement.inert`)).toBe(
      true,
    );
    await focus('#outside');
    await focus(`${drawer} button`);
    expect(await focused('#outside')).toBe(true);
    for (let index = 0; index < 8; index++) {
      await browser.key('Tab');
      expect(await inside(drawer)).toBe(false);
    }
    expect(
      await browser.evaluate(
        `document.querySelector('[aria-label="Open navigation menu"]').closest('[aria-hidden=true]') === null`,
      ),
    ).toBe(true);
  });

  it('focuses the drawer, wraps both Tab directions, and restores the trigger on Escape', async () => {
    await openDrawer();
    expect(await focused(`${drawer} button[aria-label="Close navigation menu"]`)).toBe(true);
    await edge(drawer, true);
    await browser.key('Tab');
    expect(await focused(`${drawer} button[aria-label="Close navigation menu"]`)).toBe(true);
    await browser.key('Tab', true);
    expect(await focused(`${drawer} button:last-child`)).toBe(true);
    expect(await browser.evaluate('document.activeElement.textContent')).toBe('Logout');
    await browser.key('Escape');
    await browser.waitFor(`document.querySelector('${drawer}').parentElement.inert`);
    expect(await focused('[aria-label="Open navigation menu"]')).toBe(true);
  });

  it('keeps focus inside across parent rerenders and disabled logout', async () => {
    await openDrawer();
    await focus(`${drawer} a`);
    await click('#outside');
    await browser.waitFor('document.querySelector("#outside").textContent === "Outside 1"');
    expect(await focused(`${drawer} a`)).toBe(true);
    await edge(drawer, true);
    await browser.evaluate('document.activeElement.click()');
    await browser.waitFor(`Boolean(document.querySelector('${drawer} button[disabled]'))`);
    await edge(drawer, true);
    await browser.key('Tab');
    expect(await focused(`${drawer} button[aria-label="Close navigation menu"]`)).toBe(true);
    await focus('#outside');
    expect(await inside(drawer)).toBe(true);
    await browser.key('Tab', true);
    expect(await focused(`${drawer} a:last-child`)).toBe(true);
  });

  it('closes on navigation and tolerates a removed trigger', async () => {
    await openDrawer();
    await click(`${drawer} a`);
    await browser.waitFor(`document.querySelector('${drawer}').parentElement.inert`);
    expect(await focused('[aria-label="Open navigation menu"]')).toBe(true);
    await openDrawer();
    await browser.evaluate(
      `document.querySelector('[aria-label="Open navigation menu"]').remove()`,
    );
    await browser.key('Escape');
    await browser.waitFor(`document.querySelector('${drawer}').parentElement.inert`);
  });

  it('releases the drawer trap when switching to desktop', async () => {
    await openDrawer();
    await browser.command('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await browser.waitFor(`document.querySelector('${drawer}').parentElement.inert`);
    await focus('#outside');
    expect(await focused('#outside')).toBe(true);
  });

  it('wraps Epic Tab focus in both directions and restores its opener', async () => {
    await openEpic();
    await edge(epic, true);
    await browser.key('Tab');
    expect(await focused('[aria-label="Close epic details"]')).toBe(true);
    await browser.key('Tab', true);
    expect(await focused('[aria-label="View details for Nested task"]')).toBe(true);
    await focus('#outside');
    expect(await inside(epic)).toBe(true);
    await browser.key('Tab', true);
    expect(await focused('[aria-label="View details for Nested task"]')).toBe(true);
    await browser.key('Tab');
    expect(await inside(epic)).toBe(true);
    await browser.key('Escape');
    await browser.waitFor(`!document.querySelector('${epic}')`);
    expect(await focused('#open-epic')).toBe(true);
  });

  it('yields focus and Escape to actual nested Task Details, then resumes Epic trapping', async () => {
    await openEpic();
    await focus('[aria-label="View details for Nested task"]');
    await click('[aria-label="View details for Nested task"]');
    await browser.waitFor(`Boolean(document.querySelector('${task}'))`);
    await browser.waitFor(`document.querySelector('${task}').contains(document.activeElement)`);
    expect(await browser.evaluate(`document.querySelector('${epic}').inert`)).toBe(true);
    for (let index = 0; index < 6; index++) {
      await browser.key('Tab', index % 2 === 0);
      expect(await inside(task)).toBe(true);
    }
    await browser.key('Escape');
    await browser.waitFor(`!document.querySelector('${task}')`);
    expect(await inside(epic)).toBe(true);
    await edge(epic, true);
    await browser.key('Tab');
    expect(await focused('[aria-label="Close epic details"]')).toBe(true);
  });

  it('lets the native unsaved dialog own focus and Escape returns to editing', async () => {
    await openEpic();
    await dirtyTitle();
    expect(await inside('dialog[open]')).toBe(true);
    for (let index = 0; index < 6; index++) {
      await browser.key('Tab', index % 2 === 0);
      // Chromium may place focus on the document at a native dialog's edge;
      // its top-layer inertness must always exclude Epic controls.
      expect(await inside(epic)).toBe(false);
    }
    await browser.key('Escape');
    await browser.waitFor('!document.querySelector("dialog[open]")');
    expect(await inside(epic)).toBe(true);
    expect(
      await browser.evaluate(`document.querySelector('[aria-label="Epic title"]').value`),
    ).toBe('Changed title');
    expect(await browser.evaluate('window.requests')).toEqual([]);
  });

  it.each(['Keep Editing', 'Discard', 'Save Changes'])(
    'preserves the %s confirmation action',
    async (action) => {
      await openEpic();
      await dirtyTitle();
      await browser.evaluate(
        `[...document.querySelectorAll('dialog[open] button')].find(button => button.textContent === ${JSON.stringify(action)}).click()`,
      );
      await browser.waitFor('!document.querySelector("dialog[open]")');
      if (action === 'Keep Editing') {
        expect(await inside(epic)).toBe(true);
        expect(await browser.evaluate('window.requests')).toEqual([]);
      } else {
        expect(await browser.evaluate(`!document.querySelector('${epic}')`)).toBe(true);
        expect(await focused('#open-epic')).toBe(true);
        expect(await browser.evaluate('window.requests')).toEqual(
          action === 'Save Changes' ? [{ title: 'Changed title' }] : [],
        );
      }
    },
  );

  it('retains title autosave and removes the inactive Copy link', async () => {
    await openEpic();
    expect(
      await browser.evaluate(`document.querySelector('${epic}').textContent.includes('Copy link')`),
    ).toBe(false);
    await browser.evaluate(`(() => {
      const input = document.querySelector('[aria-label="Epic title"]');
      input.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Autosaved');
      input.dispatchEvent(new Event('input', {bubbles:true}));
    })()`);
    await browser.key('Tab');
    await browser.waitFor('window.requests.length === 1');
    expect(await browser.evaluate('window.requests')).toEqual([{ title: 'Autosaved' }]);
  });
});
