import type { ReactiveController, ReactiveControllerHost } from 'lit';

// ---------------------------------------------------------------------------
// Lion structural interfaces
// ---------------------------------------------------------------------------
// These are structural (duck-typed) — no direct import from @lion/ui so the
// controller stays version-agnostic.

/** Minimal surface of a lion form-group / LionForm element. */
interface LionFormLike extends HTMLElement {
  /** Active feedback types, e.g. `['error', 'warning']`. */
  hasFeedbackFor: string[];
  /** Registered child fields, keyed by name. */
  formElements: { [key: string]: LionFieldLike | LionFieldLike[] } & Iterable<LionFieldLike>;
  /** Marks the form submitted, revealing feedback on every child. */
  submitGroup(): void;
  /** Resets values and interaction states of all form children. */
  resetGroup(): void;
  /**
   * Object keyed by field names containing each field's model value.
   * Writable: assign a new object to bulk-set field values.
   */
  modelValue: Record<string, unknown>;
  /**
   * Object keyed by field names containing each field's serialized value.
   * Suitable for direct submission (strings, not rich objects).
   */
  serializedValue: Record<string, unknown>;
  /** @lion/form protected method — available via duck-typing on LionForm. */
  _setFocusOnFirstErroneousFormElement?: (el: LionFormLike) => void;
}


/** Minimal surface of a single lion form-field element. */
interface LionFieldLike extends HTMLElement {
  /** Active feedback types. */
  hasFeedbackFor: string[];
  /** Keyed validation states: `{ error: { Required: {} }, ... }`. */
  validationStates?: Record<string, Record<string, unknown>>;
  /** The focusable native node inside the field (e.g. `<input>`). */
  _focusableNode?: HTMLElement;
  /** Present when this field is itself a form-group (nested fieldset). */
  formElements?: { [key: string]: LionFieldLike | LionFieldLike[] };
}

// ---------------------------------------------------------------------------
// RenderRoot helper
// ---------------------------------------------------------------------------

/** A host that exposes its render root (LitElement always does). */
interface RenderRootHost extends ReactiveControllerHost {
  readonly renderRoot: Element | DocumentFragment;
}

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

/**
 * Per-field validation detail included in {@link ValidationResult.errors}.
 *
 * @template K - Union of validator names active on the field (e.g. `'Required'`).
 */
export interface FieldErrors {
  /**
   * Validator names that are currently failing on this field.
   * Derived from `field.validationStates.error` — the keys Lion uses
   * internally for each active validator.
   *
   * @example `['Required', 'MinLength']`
   */
  validators: string[];
}

/**
 * Result returned by {@link FormController.validate}.
 *
 * ### How `T` is reflected here
 *
 * `T` represents the **shape of your form's `modelValue`**, where each key is
 * a field `name` attribute.  Example:
 *
 * ```ts
 * interface IncomeFields {
 *   source: string;
 *   amount: number;
 *   currency: string;
 *   durationDetails: { type: string; endDate?: string };
 * }
 * ```
 *
 * `ValidationResult<IncomeFields>.errors` will be typed as:
 * ```ts
 * Partial<Record<keyof IncomeFields, FieldErrors>>
 * // i.e. { source?: FieldErrors; amount?: FieldErrors; ... }
 * ```
 *
 * Only fields that have `hasFeedbackFor.includes('error')` appear in `errors`.
 * Top-level keys of `T` map 1-to-1 to Lion field `name` attributes.
 *
 * @template T - Shape of the form's `modelValue`.
 */
export interface ValidationResult<T extends Record<string, unknown> = Record<string, unknown>> {
  /** `true` when no field in the form has an active error. */
  isValid: boolean;
  /**
   * Typed per-field error map.
   * Keys are a subset of `keyof T` (only erroneous fields are present).
   */
  errors: Partial<Record<keyof T, FieldErrors>>;
}

/**
 * Constructor options for {@link FormController}.
 *
 * @template T - Shape of the form's `modelValue`.
 */
export interface FormControllerOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * An explicit reference to the `<lion-form>` element.
   *
   * When omitted, {@link FormController} searches for `lion-form` using the
   * following strategy (in order):
   * 1. `host.renderRoot.querySelector('lion-form')` — covers elements rendered
   *    into shadow DOM, including those using `ScopedElementsMixin`.
   * 2. `host.querySelector('lion-form')` — covers light-DOM usage.
   *
   * > **Note on `ScopedElementsMixin`**: With `@open-wc/scoped-elements` v3 the
   * > tag name in the DOM is still `lion-form`; the scoped registry only
   * > affects how the browser resolves the constructor. `querySelector` works
   * > normally, but the element lives in the shadow root — hence step 1 above.
   */
  form?: LionFormLike;

  /**
   * When `true`, focuses the first field with an active `'error'` feedback
   * type after a failed validation.
   *
   * Reuses Lion's own `_setFocusOnFirstErroneousFormElement` when available.
   *
   * @default false
   */
  focusOnError?: boolean;

  /**
   * When `true`, calls `scrollIntoView` on the first erroneous field after a
   * failed validation.
   *
   * Can be used independently of {@link focusOnError} or combined with it.
   * When both are `true`, the element is focused first and then scrolled into
   * view (which typically follows automatically, but the explicit scroll call
   * guarantees the behavior across browsers and inside scrollable containers).
   *
   * @default false
   */
  scrollToError?: boolean;

  /**
   * Options forwarded to `scrollIntoView` when {@link scrollToError} (or the
   * scroll-after-focus path) is active.
   *
   * @default { behavior: 'smooth', block: 'center' }
   */
  scrollOptions?: ScrollIntoViewOptions;

  /**
   * Optional callback invoked with the {@link ValidationResult} after every
   * `validate()` call, regardless of validity.
   */
  onValidate?: (result: ValidationResult<T>) => void;
}

// ---------------------------------------------------------------------------
// Resolved (internal) options — defaults applied
// ---------------------------------------------------------------------------

type ResolvedOptions<T extends Record<string, unknown>> = Required<
  Omit<FormControllerOptions<T>, 'form' | 'onValidate'>
> &
  Pick<FormControllerOptions<T>, 'form' | 'onValidate'>;

// ---------------------------------------------------------------------------
// FormController
// ---------------------------------------------------------------------------

/**
 * A strongly-typed Lit {@link ReactiveController} that integrates with
 * `<lion-form>` to validate form groups and navigate to the first error.
 *
 * ### Generic parameter `T`
 *
 * Provide the shape of your form's `modelValue` as `T`.  The keys of `T`
 * should match the `name` attributes of your Lion fields.  This gives you:
 *
 * - Typed `errors` object in {@link ValidationResult} (keys are `keyof T`).
 * - IDE autocompletion when reading `result.errors.fieldName`.
 *
 * ```ts
 * interface IncomeFields { source: string; amount: number; }
 * const ctrl = new FormController<IncomeFields>(this, { focusOnError: true });
 * const { isValid, errors } = ctrl.validate();
 * // errors.source  → FieldErrors | undefined  ✓
 * // errors.unknown → TS error                  ✓
 * ```
 *
 * ### Shadow DOM & `ScopedElementsMixin`
 *
 * When the host renders its template into a shadow root (which is the default
 * for both plain `LitElement` and `ScopedElementsMixin(LitElement)`), the
 * controller searches `host.renderRoot` first.  You do **not** need to pass an
 * explicit `form` reference unless you want to target a specific instance.
 *
 * @template T - Shape of the form's `modelValue` (keys = field names).
 */
export class FormController<T extends Record<string, unknown> = Record<string, unknown>>
  implements ReactiveController
{
  // -------------------------------------------------------------------------
  // Private fields
  // -------------------------------------------------------------------------

  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #options: ResolvedOptions<T>;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: FormControllerOptions<T> = {},
  ) {
    this.#host = host;
    this.#options = {
      form: options.form,
      focusOnError: options.focusOnError ?? false,
      scrollToError: options.scrollToError ?? false,
      scrollOptions: options.scrollOptions ?? { behavior: 'smooth', block: 'center' },
      onValidate: options.onValidate,
    };

    host.addController(this);
  }

  // -------------------------------------------------------------------------
  // ReactiveController lifecycle
  // -------------------------------------------------------------------------

  /** @internal */
  hostConnected(): void {
    /* no-op — form discovery is lazy */
  }

  /** @internal */
  hostDisconnected(): void {
    /* no-op */
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Resolves the `<lion-form>` element targeted by this controller.
   *
   * Resolution order:
   * 1. Explicit `form` option from the constructor.
   * 2. `host.renderRoot.querySelector('lion-form')` — shadow DOM / Scoped Elements.
   * 3. `host.querySelector('lion-form')` — light DOM fallback.
   *
   * @throws {Error} When no form can be found.
   */
  get form(): LionFormLike {
    if (this.#options.form) {
      return this.#options.form;
    }

    // Shadow DOM path (covers ScopedElementsMixin, plain LitElement, etc.)
    const renderRoot = (this.#host as unknown as RenderRootHost).renderRoot;
    const inShadow = renderRoot?.querySelector<LionFormLike>('lion-form');
    if (inShadow) return inShadow;

    // Light DOM fallback
    const inLight = this.#host.querySelector<LionFormLike>('lion-form');
    if (inLight) return inLight;

    throw new Error(
      '[FormController] No <lion-form> element found. ' +
        'Either pass one via the `form` option or ensure a <lion-form> is ' +
        'rendered inside the host before calling validate().',
    );
  }

  /**
   * Validates the form.
   *
   * Steps:
   * 1. Calls `submitGroup()` on the resolved form — sets `submitted = true` on
   *    every child, making Lion reveal all validation feedback.
   * 2. Reads `hasFeedbackFor` and `validationStates` to build a typed error map.
   * 3. Optionally **focuses** the first erroneous field (`focusOnError`).
   * 4. Optionally **scrolls** to the first erroneous field (`scrollToError`).
   *    - Works independently of `focusOnError`.
   *    - When both are `true`, focus happens first, then scroll.
   * 5. Calls the `onValidate` hook (if provided).
   *
   * > **Coexistence with native submit**: If the user presses Enter or a
   * > `<button type="submit">`, Lion's `_submit` handler also calls
   * > `submitGroup()` and dispatches a `'submit'` event.  Calling `validate()`
   * > imperatively (e.g. from a "Next step" button) is fully compatible — both
   * > paths are additive.
   *
   * @returns {ValidationResult<T>}
   */
  validate(): ValidationResult<T> {
    const form = this.form;

    form.submitGroup();

    const isValid = !form.hasFeedbackFor.includes('error');
    const errors = this.#collectErrors(form);
    const result: ValidationResult<T> = { isValid, errors };

    if (!isValid) {
      this.#handleErrorNavigation(form);
    }

    this.#options.onValidate?.(result);

    return result;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Orchestrates focus and/or scroll based on the configured options.
   * The two behaviours are independent and can be combined.
   */
  #handleErrorNavigation(form: LionFormLike): void {
    const { focusOnError, scrollToError } = this.#options;

    if (!focusOnError && !scrollToError) return;

    if (focusOnError) {
      this.#focusFirstError(form);
    }

    if (scrollToError) {
      // When both flags are on, we scroll whatever is focused (which may have
      // been set by #focusFirstError above).  When only scrollToError is on,
      // we find the first erroneous element ourselves.
      if (focusOnError) {
        this.#scrollToFocused();
      } else {
        const target = this.#findFirstErrorField(form);
        const scrollTarget = target?._focusableNode ?? target;
        scrollTarget?.scrollIntoView(this.#options.scrollOptions);
      }
    }
  }

  /**
   * Focuses the first field with an active `'error'` feedback type.
   *
   * Delegates to Lion's own `_setFocusOnFirstErroneousFormElement` when the
   * form exposes it (duck-typed); falls back to a manual recursive search.
   */
  #focusFirstError(form: LionFormLike): void {
    if (typeof form._setFocusOnFirstErroneousFormElement === 'function') {
      form._setFocusOnFirstErroneousFormElement(form);
      return;
    }

    const target = this.#findFirstErrorField(form);
    if (target?._focusableNode) {
      target._focusableNode.focus();
    } else {
      target?.focus();
    }
  }

  /**
   * Scrolls `document.activeElement` into view.
   * Used when `focusOnError + scrollToError` are both active — Lion set the
   * focus, we add the scroll on top.
   */
  #scrollToFocused(): void {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      focused.scrollIntoView(this.#options.scrollOptions);
    }
  }

  /**
   * Recursively traverses the form's `formElements` to find the first field
   * with an active `'error'` feedback type.
   *
   * Nested fieldsets are entered recursively; checkbox/radio groups are
   * treated as a single logical field (the group element itself is returned).
   */
  #findFirstErrorField(group: LionFormLike): LionFieldLike | null {
    for (const key of Object.keys(group.formElements)) {
      const entry = group.formElements[key];
      const candidates = Array.isArray(entry) ? entry : [entry as LionFieldLike];

      for (const field of candidates) {
        if (!field.hasFeedbackFor?.includes('error')) continue;

        // Recurse into nested form groups (fieldsets).
        if (field.formElements) {
          const nested = this.#findFirstErrorField(field as unknown as LionFormLike);
          if (nested) return nested;
        }

        return field;
      }
    }

    return null;
  }

  /**
   * Builds the typed error map from the form's registered elements.
   *
   * ### How `T` flows into `errors`
   *
   * Lion stores per-validator results in `field.validationStates.error`:
   * ```
   * { Required: {}, MinLength: { requiredLength: 4, actualLength: 2 } }
   * ```
   * We extract the validator names as `string[]` and assign them under the
   * field's `name` key — cast to `keyof T` for type safety.
   *
   * Only fields whose `hasFeedbackFor` includes `'error'` appear in the map.
   */
  #collectErrors(form: LionFormLike): Partial<Record<keyof T, FieldErrors>> {
    const errors: Partial<Record<keyof T, FieldErrors>> = {};

    const recordError = (key: string, field: LionFieldLike): void => {
      if (!field.hasFeedbackFor?.includes('error')) return;

      const validators = Object.keys(field.validationStates?.['error'] ?? {});
      errors[key as keyof T] = { validators };
    };

    for (const key of Object.keys(form.formElements)) {
      const entry = form.formElements[key];

      if (Array.isArray(entry)) {
        // Checkbox-group / radio-group: the group itself carries the error.
        const groupWithError = entry.find((f) => f.hasFeedbackFor?.includes('error'));
        if (groupWithError) recordError(key, groupWithError);
      } else {
        recordError(key, entry as LionFieldLike);
      }
    }

    return errors;
  }
}
