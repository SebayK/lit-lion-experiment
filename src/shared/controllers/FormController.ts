import type { ReactiveController, ReactiveControllerHost } from 'lit';

// ---------------------------------------------------------------------------
// Lion structural interfaces
// ---------------------------------------------------------------------------
// These are structural (duck-typed) — no direct import from @lion/ui so the
// controller stays version-agnostic.

/** Lion's internal group meta-validator indicating at least one child element has an error. */
const FORM_ELEMENTS_HAVE_NO_ERROR = 'FormElementsHaveNoError';

/** Minimal surface of a lion form-group / LionForm element. */
interface LionFormLike extends HTMLElement {
  /** Active feedback types, e.g. `['error', 'warning']`. */
  hasFeedbackFor: string[];
  /** Keyed validation states: `{ error: { Required: {} }, ... }`. */
  validationStates?: Record<string, Record<string, unknown>>;
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
  /** Resolves once initial child element registration has settled. */
  registrationComplete?: Promise<void>;
}


/** Minimal surface of a single lion form-field element. */
interface LionFieldLike extends HTMLElement {
  /** Active feedback types. */
  hasFeedbackFor: string[];
  /** Keyed validation states: `{ error: { Required: {} }, ... }`. */
  validationStates?: Record<string, Record<string, unknown>>;
  /** The focusable native node inside the field (e.g. `<input>`). */
  _focusableNode?: HTMLElement;
  /** Present when this field is itself a form-group (nested fieldset or choice group). */
  formElements?: { [key: string]: LionFieldLike | LionFieldLike[] } & Iterable<LionFieldLike>;
  /** True for LionFieldset / LionForm, false for choice groups (LionRadioGroup, LionCheckboxGroup). */
  _isFormOrFieldset?: boolean;
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
  /** `true` when no field or group validator in the form has an active error. */
  isValid: boolean;
  /**
   * Typed per-field error map.
   * Keys are a subset of `keyof T` (only erroneous fields are present).
   */
  errors: Partial<Record<keyof T, FieldErrors>>;
  /**
   * Errors from validators attached directly to the `<lion-form>` element
   * itself (e.g. cross-field form validators), excluding Lion's internal
   * `FormElementsHaveNoError` meta-validator.
   * Only present when at least one form-level validator is failing.
   */
  formErrors?: FieldErrors;
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

    const errors = this.#collectErrors(form);
    const formValidators = FormController.#ownErrorValidators(form);
    const isValid =
      !form.hasFeedbackFor.includes('error') &&
      Object.keys(errors).length === 0 &&
      formValidators.length === 0;
    const result: ValidationResult<T> = {
      isValid,
      errors,
      ...(formValidators.length > 0 ? { formErrors: { validators: formValidators } } : {}),
    };

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
      // we find the first erroneous element ourselves (falling back to the form
      // itself when only a form-level validator failed).
      if (focusOnError) {
        this.#scrollToFocused(form);
      } else {
        const target = this.#findFirstErrorField(form) ?? form;
        const scrollTarget = (target as LionFieldLike)._focusableNode ?? target;
        scrollTarget?.scrollIntoView(this.#options.scrollOptions);
      }
    }
  }

  /**
   * Focuses the first field with an active `'error'` feedback type.
   *
   * Delegates to Lion's own `_setFocusOnFirstErroneousFormElement` when the
   * form exposes it and at least one focusable descendant exists along Lion's
   * traversal path; falls back to a safe recursive search so form/group-only
   * failures on empty containers never throw.
   */
  #focusFirstError(form: LionFormLike): void {
    if (
      typeof form._setFocusOnFirstErroneousFormElement === 'function' &&
      this.#hasFocusableErrorTarget(form)
    ) {
      form._setFocusOnFirstErroneousFormElement(form);
      return;
    }

    const target = this.#findFirstErrorField(form) ?? form;
    if ((target as LionFieldLike)._focusableNode) {
      (target as LionFieldLike)._focusableNode!.focus();
    } else {
      target.focus();
    }
  }

  /**
   * Checks whether Lion's `_setFocusOnFirstErroneousFormElement` traversal can
   * reach a child with `_focusableNode` without hitting an empty `formElements`.
   */
  #hasFocusableErrorTarget(group: LionFormLike): boolean {
    const children = FormController.#iterChildren(group.formElements);
    const first =
      children.find((child) => child.hasFeedbackFor?.includes('error')) ?? children[0];
    if (!first) return false;
    if (first._focusableNode) return true;
    if (first.formElements) {
      return this.#hasFocusableErrorTarget(first as unknown as LionFormLike);
    }
    return false;
  }

  /**
   * Scrolls `document.activeElement` into view, falling back to the first
   * erroneous field or form when focus could not move off `document.body`.
   */
  #scrollToFocused(form: LionFormLike): void {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      focused.scrollIntoView(this.#options.scrollOptions);
      return;
    }

    const fallback = this.#findFirstErrorField(form) ?? form;
    const scrollTarget = (fallback as LionFieldLike)._focusableNode ?? fallback;
    scrollTarget?.scrollIntoView(this.#options.scrollOptions);
  }

  /**
   * Recursively traverses the form's `formElements` to find the first field
   * with an active `'error'` feedback type.
   *
   * Nested fieldsets are entered recursively; checkbox/radio groups are
   * treated as a single logical field (the group element itself is returned).
   */
  #findFirstErrorField(group: LionFormLike): LionFieldLike | null {
    for (const key of FormController.#namedKeys(group.formElements)) {
      const entry = group.formElements[key];
      const candidates = Array.isArray(entry) ? entry : [entry as LionFieldLike];

      for (const field of candidates) {
        if (!field.hasFeedbackFor?.includes('error')) continue;

        // Recurse into nested form groups (fieldsets).
        if (field._isFormOrFieldset && field.formElements) {
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
   * We extract the validator names as `string[]` (filtering out Lion's internal
   * `FormElementsHaveNoError` meta-validator) and assign them under the
   * field's `name` key — cast to `keyof T` for type safety.
   *
   * Only fields whose `hasFeedbackFor` includes `'error'` appear in the map.
   *
   * ### `FormControlsCollection` and numeric keys
   *
   * `FormControlsCollection extends Array`, so `Object.keys()` returns both
   * numeric array indices (`'0'`, `'1'`, …) and named field keys.  We filter
   * out the numeric indices with {@link FormController.#namedKeys} — mirroring
   * Lion's own `FormControlsCollection._keys()` method — to avoid polluting
   * `errors` with spurious numeric entries.
   *
   * ### Group validators (`lion-fieldset` & `lion-checkbox-group`)
   *
   * Any `FormGroupMixin`-based element (`lion-fieldset`, `lion-checkbox-group`,
   * `lion-radio-group`) can carry **both** its own validators (e.g. cross-field
   * or `MinTwoSelected`) **and** child validators surfaced via
   * `FormElementsHaveNoError`.  {@link #collectValidatorsForField} collects
   * own validators (excluding `FormElementsHaveNoError`) and recursively
   * gathers failing validators from `field.formElements` children.
   */
  #collectErrors(form: LionFormLike): Partial<Record<keyof T, FieldErrors>> {
    const errors: Partial<Record<keyof T, FieldErrors>> = {};

    for (const key of FormController.#namedKeys(form.formElements)) {
      const entry = form.formElements[key];
      const candidates = Array.isArray(entry) ? entry : [entry as LionFieldLike];
      const failing = candidates.filter((f) => f.hasFeedbackFor?.includes('error'));
      if (failing.length === 0) continue;

      const validators = failing.flatMap((field) => this.#collectValidatorsForField(field));
      errors[key as keyof T] = { validators };
    }

    return errors;
  }

  /**
   * Collects all failing validator names for a field or group element:
   * its own `validationStates.error` keys (excluding Lion's internal
   * `FormElementsHaveNoError` meta-validator) plus, when it has child
   * `formElements` (e.g. `lion-fieldset`, `lion-checkbox-group`), any failing
   * validators from those children recursively.
   */
  #collectValidatorsForField(field: LionFieldLike): string[] {
    const validators = FormController.#ownErrorValidators(field);

    if (field.formElements) {
      for (const child of FormController.#iterChildren(field.formElements)) {
        if (!child.hasFeedbackFor?.includes('error')) continue;
        validators.push(...this.#collectValidatorsForField(child));
      }
    }

    return validators;
  }

  /**
   * Returns failing validator names declared directly on `element`, excluding
   * Lion's internal `FormElementsHaveNoError` aggregation meta-validator.
   */
  static #ownErrorValidators(element: {
    validationStates?: Record<string, Record<string, unknown>>;
  }): string[] {
    return Object.keys(element.validationStates?.['error'] ?? {}).filter(
      (name) => name !== FORM_ELEMENTS_HAVE_NO_ERROR,
    );
  }

  /**
   * Returns the ordered child elements of a `formElements` collection.
   * Uses iteration for `FormControlsCollection` / arrays (avoiding duplicate
   * visits from named-key properties) and falls back to named keys for plain
   * object mocks.
   */
  static #iterChildren(
    collection: { [key: string]: LionFieldLike | LionFieldLike[] } & Partial<
      Iterable<LionFieldLike>
    >,
  ): LionFieldLike[] {
    if (Symbol.iterator in collection && typeof collection[Symbol.iterator] === 'function') {
      return Array.from(collection as Iterable<LionFieldLike>);
    }
    return FormController.#namedKeys(collection).flatMap((key) => {
      const entry = collection[key];
      return Array.isArray(entry) ? entry : [entry as LionFieldLike];
    });
  }

  /**
   * Returns only the named (non-numeric) keys of a `FormControlsCollection`.
   *
   * `FormControlsCollection extends Array`, so `Object.keys()` includes both
   * numeric array indices and the named field keys added by
   * `FormRegistrarMixin.addFormElement`.  Filtering out the numeric ones
   * matches the behaviour of Lion's own `FormControlsCollection._keys()`.
   */
  static #namedKeys(collection: object): string[] {
    return Object.keys(collection).filter(k => Number.isNaN(Number(k)));
  }
}
