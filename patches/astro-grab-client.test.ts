import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Guards `astro-grab@0.3.0.patch`, which adds the `{{trace}}` placeholder to the
 * grab client and keeps a short Cmd/Ctrl+C a plain copy. The patch has to be
 * re-ported on every astro-grab upgrade, so the behaviour is pinned here rather
 * than only in the diff.
 *
 * The patched internals are not exported from the package, so they are lifted
 * out of the shipped bundle by source markers — if the patch is lost, the
 * markers are gone and this file fails loudly instead of silently testing
 * nothing.
 */
const bundle = readFileSync("node_modules/astro-grab/dist/client/index.js", "utf-8");

const liftFromBundle = <T>(
  startMarker: string,
  endMarker: string,
  returned: string,
  scope: Record<string, unknown> = {},
): T => {
  const start = bundle.indexOf(startMarker);
  const end = bundle.indexOf(endMarker);
  expect(start, `astro-grab patch is missing "${startMarker}"`).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);

  return new Function(...Object.keys(scope), `${bundle.slice(start, end)}; return ${returned};`)(
    ...Object.values(scope),
  ) as T;
};

interface TraceNode {
  getAttribute: (name: string) => string | null;
  parentElement: TraceNode | null;
}

/** Builds a DOM-like ancestor chain from outermost to innermost, returning the click target. */
const chain = (...encodedFromOutside: (string | null)[]): TraceNode => {
  let parent: TraceNode | null = null;
  for (const encoded of encodedFromOutside) {
    parent = {
      getAttribute: (name) => (name === "data-astro-grab" ? encoded : null),
      parentElement: parent,
    };
  }
  if (!parent) throw new Error("chain needs at least one element");
  return parent;
};

describe("astro-grab component trace", () => {
  const buildComponentTrace = liftFromBundle<(element: TraceNode) => string>(
    "var DEFAULT_TRACE_LIMIT",
    "// src/client/clipboard.ts",
    "buildComponentTrace",
  );

  it("collapses a run of elements from one file to the targeted element", () => {
    const target = chain(
      "src/layouts/BaseLayout.astro:78:1",
      "src/pages/index.astro:56:3",
      "src/components/TitleBanner.astro:8:1",
      "src/components/TitleBanner.astro:9:3",
    );

    expect(buildComponentTrace(target)).toBe(
      "src/components/TitleBanner.astro:9 → src/pages/index.astro:56 → src/layouts/BaseLayout.astro:78",
    );
  });

  it("caps the chain at four entries", () => {
    const target = chain("e.astro:5:1", "d.astro:4:1", "c.astro:3:1", "b.astro:2:1", "a.astro:1:1");

    expect(buildComponentTrace(target)).toBe("a.astro:1 → b.astro:2 → c.astro:3 → d.astro:4");
  });

  it("keeps a file that reappears further up, as slotted content does", () => {
    const target = chain(
      "src/pages/index.astro:56:3",
      "src/components/TitleBanner.astro:8:1",
      "src/pages/index.astro:60:5",
    );

    expect(buildComponentTrace(target)).toBe(
      "src/pages/index.astro:60 → src/components/TitleBanner.astro:8 → src/pages/index.astro:56",
    );
  });

  it("skips ancestors without source attribution, such as framework islands", () => {
    const target = chain(
      "src/pages/index.astro:56:3",
      "src/components/TitleBanner.astro:9:3",
      null,
      null,
    );

    expect(buildComponentTrace(target)).toBe(
      "src/components/TitleBanner.astro:9 → src/pages/index.astro:56",
    );
  });

  it("splits off line and column when the path itself contains a colon", () => {
    expect(buildComponentTrace(chain("C:/site/src/pages/index.astro:56:3"))).toBe(
      "C:/site/src/pages/index.astro:56",
    );
  });

  // The trace already opens with the targeted element, so a separate
  // `{{file}}:{{targetLine}}` header would repeat it verbatim.
  it("carries the trace in the default template instead of a second source line", () => {
    const defaultTemplate = liftFromBundle<string>(
      "var DEFAULT_TEMPLATE",
      "var copyToClipboard",
      "DEFAULT_TEMPLATE",
    );

    expect(defaultTemplate.startsWith("Source: {{trace}}\n")).toBe(true);
    expect(defaultTemplate).not.toContain("{{targetLine}}");
  });
});

interface FakeStateMachine {
  state: string;
  getState: () => string;
  transition: (next: string) => void;
  reset: () => void;
}

type KeybindHandler = {
  handleKeyDown: (event: FakeKeyEvent) => void;
  handleKeyUp: (event: FakeKeyEvent) => void;
  handleEscape: (event: FakeKeyEvent) => void;
};

interface FakeKeyEvent {
  key: string;
  metaKey: boolean;
  repeat: boolean;
  prevented: boolean;
  preventDefault: () => void;
}

describe("astro-grab trigger key", () => {
  const KeybindHandler = liftFromBundle<
    new (stateMachine: FakeStateMachine, holdDuration: number, key: string) => KeybindHandler
  >("var DEFAULT_TRIGGER_KEY", "// src/client/overlay.ts", "KeybindHandler", {
    // Resolved per call so vitest's fake timers, installed after the lift, apply.
    window: {
      setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
      dispatchEvent: () => true,
    },
  });

  const HOLD_DURATION = 500;

  let stateMachine: FakeStateMachine;
  let keybind: KeybindHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    stateMachine = {
      state: "idle",
      getState: () => stateMachine.state,
      transition: (next) => void (stateMachine.state = next),
      reset: () => void (stateMachine.state = "idle"),
    };
    keybind = new KeybindHandler(stateMachine, HOLD_DURATION, "c");
  });

  const press = (overrides: Partial<FakeKeyEvent> = {}): FakeKeyEvent => {
    const event: FakeKeyEvent = {
      key: "c",
      metaKey: true,
      repeat: false,
      prevented: false,
      preventDefault: () => void (event.prevented = true),
      ...overrides,
    };
    return event;
  };

  // Whether a press is a hold is only known once holdDuration elapses, long
  // after the browser would have copied the selection.
  it("leaves the browser copy intact while waiting for the hold", () => {
    const event = press();
    keybind.handleKeyDown(event);

    expect(event.prevented).toBe(false);
    expect(stateMachine.state).toBe("holding");
  });

  it("returns to idle when the key is released before the hold completes", () => {
    keybind.handleKeyDown(press());
    vi.advanceTimersByTime(HOLD_DURATION - 1);
    keybind.handleKeyUp(press());
    vi.advanceTimersByTime(HOLD_DURATION);

    expect(stateMachine.state).toBe("idle");
  });

  it("enters targeting once the key is held long enough", () => {
    keybind.handleKeyDown(press());
    vi.advanceTimersByTime(HOLD_DURATION);

    expect(stateMachine.state).toBe("targeting");
  });

  // Upstream latches on the first activation and then treats every later press
  // as a grab, which hijacks Cmd/Ctrl+C for the rest of the page's life.
  it("still requires a hold after a previous activation", () => {
    keybind.handleKeyDown(press());
    vi.advanceTimersByTime(HOLD_DURATION);
    keybind.handleEscape(press({ key: "Escape" }));
    expect(stateMachine.state).toBe("idle");

    const event = press();
    keybind.handleKeyDown(event);

    expect(stateMachine.state).toBe("holding");
    expect(event.prevented).toBe(false);
  });

  it("swallows the auto-repeat of a held key", () => {
    keybind.handleKeyDown(press());
    const repeat = press({ repeat: true });
    keybind.handleKeyDown(repeat);

    expect(repeat.prevented).toBe(true);
  });

  it("swallows the shortcut while targeting", () => {
    keybind.handleKeyDown(press());
    vi.advanceTimersByTime(HOLD_DURATION);

    const event = press();
    keybind.handleKeyDown(event);

    expect(event.prevented).toBe(true);
  });

  it("ignores the trigger key without a modifier", () => {
    const event = press({ metaKey: false });
    keybind.handleKeyDown(event);

    expect(stateMachine.state).toBe("idle");
    expect(event.prevented).toBe(false);
  });
});
