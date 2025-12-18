/**
 * Utilities for sanitizing text into valid JavaScript identifiers.
 * 
 * These functions are used to convert user-facing text (labels, captions, etc.)
 * into valid JavaScript identifiers for use in generated code (field names, method names, class names).
 */

/**
 * Removes hotkey hints like "(Alt+N)" or "(alt+enter)" from text.
 * 
 * @param raw - The raw text that may contain hotkey hints
 * @returns Text with hotkey hints removed
 * 
 * @example
 * ```typescript
 * stripHotkeyHints("New (Alt+N)") // Returns "New"
 * ```
 */
export function stripHotkeyHints(raw: string): string {
  // Remove things like "(Alt+N)" or "(alt+enter)" at the start or anywhere
  return raw.replace(/\(\s*alt\+[\w\s]+\s*\)\s*/gi, '').trim();
}

/**
 * Drops characters in the Private Use Area and other non-ASCII glyphs.
 * 
 * Removes problematic Unicode characters that can cause issues in generated code:
 * - Private Use Area (U+E000 to U+F8FF)
 * - Zero-width spaces (U+200B to U+200D)
 * - Zero-width no-break space (U+FEFF)
 * 
 * @param raw - The raw text that may contain problematic glyphs
 * @returns Text with problematic glyphs removed
 */
export function stripWeirdGlyphs(raw: string): string {
  // Drop Private Use Area (U+E000 to U+F8FF) and other problematic Unicode ranges
  return raw.replace(/[\uE000-\uF8FF\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Normalizes text by removing hotkeys and glyphs.
 * 
 * Applies both stripHotkeyHints and stripWeirdGlyphs to clean up text.
 * 
 * @param raw - The raw text to normalize
 * @returns Normalized text with hotkeys and glyphs removed
 */
export function normalizeText(raw: string): string {
  return stripWeirdGlyphs(stripHotkeyHints(raw)).trim();
}

/**
 * Converts text to PascalCase.
 * 
 * Splits text on non-alphanumeric characters, capitalizes each word, and joins them.
 * 
 * @param raw - The text to convert
 * @returns Text in PascalCase, or "Unnamed" if input is empty after normalization
 * 
 * @example
 * ```typescript
 * toPascalCase("Mode of delivery") // Returns "ModeOfDelivery"
 * ```
 */
export function toPascalCase(raw: string): string {
  const cleaned = normalizeText(raw);
  if (!cleaned) return 'Unnamed';

  return cleaned
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Converts text to camelCase.
 * 
 * Converts to PascalCase first, then lowercases the first character.
 * 
 * @param raw - The text to convert
 * @returns Text in camelCase
 * 
 * @example
 * ```typescript
 * toCamelCase("Mode of delivery") // Returns "modeOfDelivery"
 * ```
 */
export function toCamelCase(raw: string): string {
  const pascal = toPascalCase(raw);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Ensures the identifier is a valid JavaScript identifier (for fields/methods).
 * 
 * Converts text to camelCase, removes invalid characters, and ensures it doesn't
 * start with a digit. Returns "unnamed" if the result would be empty.
 * 
 * @param raw - The raw text to convert to a safe identifier
 * @returns A valid JavaScript identifier
 * 
 * @example
 * ```typescript
 * makeSafeIdentifier("(Alt+N) New") // Returns "new"
 * makeSafeIdentifier("Mode of delivery") // Returns "modeOfDelivery"
 * ```
 */
export function makeSafeIdentifier(raw: string): string {
  let id = toCamelCase(raw);

  // Remove any remaining invalid characters (just in case)
  id = id.replace(/[^a-zA-Z0-9_$]/g, '');

  // Identifiers can't start with a digit
  if (/^[0-9]/.test(id)) {
    id = '_' + id;
  }

  // Ensure it's not empty
  if (!id) {
    id = 'unnamed';
  }

  return id;
}

/**
 * Generates a page class name from a page caption.
 * 
 * Takes the first part before a dash (main page name), converts to PascalCase,
 * and appends the appropriate suffix based on page kind.
 * 
 * @param caption - The page caption (e.g., "Sales Order Details - Price Lock")
 * @param kind - The page pattern/kind (ListPage, DetailsPage, Dialog, etc.)
 * @returns A class name in PascalCase with appropriate suffix
 * 
 * @example
 * ```typescript
 * makePageClassName("Sales Order Details - Price Lock", "DetailsPage")
 * // Returns "SalesOrderDetailsPage"
 * ```
 */
export function makePageClassName(caption: string, kind: 'ListPage' | 'DetailsPage' | 'Dialog' | 'Workspace' | 'SimpleList' | 'TableOfContents' | 'Unknown'): string {
  // Take the first part before dash (main page name)
  const cleaned = normalizeText(caption).split('-')[0].trim();
  const base = toPascalCase(cleaned);

  switch (kind) {
    case 'DetailsPage':
      return `${base}Page`;
    case 'ListPage':
      return `${base}ListPage`;
    case 'Workspace':
      return `${base}Workspace`;
    case 'Dialog':
      return `${base}Dialog`;
    case 'SimpleList':
      return `${base}ListPage`;
    case 'TableOfContents':
      return `${base}Page`;
    default:
      return `${base}Page`;
  }
}

