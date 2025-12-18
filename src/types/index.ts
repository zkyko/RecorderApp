/**
 * Core type definitions for QA Studio.
 * 
 * This module contains all the core TypeScript types and interfaces used throughout
 * the application, including recording sessions, steps, locators, page classifications,
 * and code generation configurations.
 */

/**
 * Supported assertion kinds for test steps.
 * 
 * These correspond to Playwright's expect() matchers.
 */
export type AssertionKind =
  | 'toHaveText'
  | 'toContainText'
  | 'toBeVisible'
  | 'toHaveURL'
  | 'toHaveTitle'
  | 'toBeChecked'
  | 'toHaveValue'
  | 'toHaveAttribute';

/**
 * Represents a recording session containing multiple recorded steps.
 * 
 * A session tracks a complete user flow from start to finish, including
 * all interactions, navigation, and assertions.
 */
export interface RecordingSession {
  id: string;
  flowName: string;
  module: string;
  steps: RecordedStep[];
  startedAt: Date;
  finishedAt?: Date;
  targetRepo?: string;
  d365Env?: string;
}

/**
 * Represents a single recorded step in a test flow.
 * 
 * A step can be an action (click, fill, select, navigate), a wait, a comment,
 * or an assertion. Each step includes locator information, description, and
 * metadata for code generation.
 */
export interface RecordedStep {
  id: string;
  pageId: string; // e.g. "SalesOrderPage"
  action: 'click' | 'fill' | 'select' | 'navigate' | 'wait' | 'custom' | 'comment' | 'assert';
  description: string; // human-readable
  locator?: LocatorDefinition; // Optional for custom/comment/assert steps
  value?: string; // for fills/selects, wait time, comment text, or assertion expected value
  order: number;
  timestamp: Date;
  // Sanitized identifiers for code generation
  fieldName?: string; // e.g. "newButton", "saveButton"
  methodName?: string; // e.g. "clickNew", "clickSave"
  // Page identity information
  pageUrl?: string;        // Full URL when step was recorded
  mi?: string;             // Menu item parameter
  cmp?: string;            // Company parameter
  pageType?: 'list' | 'details' | 'dialog' | 'workspace' | 'unknown';
  // Custom action type (for action === 'custom')
  customAction?: 'waitForD365';
  // Assertion-specific fields (for action === 'assert')
  assertion?: AssertionKind;
  targetKind?: 'locator' | 'page'; // 'locator' uses fieldName/methodName, 'page' asserts page-level properties
  target?: string; // POM locator name or 'page'
  expected?: string; // literal value or {{param}} syntax
  customMessage?: string; // Optional custom assertion message
  not?: boolean; // if true: .not.<matcher>()
  soft?: boolean; // if true: expect.soft(...)
}

/**
 * Defines how to locate an element on a page.
 * 
 * Uses a discriminated union to represent different locator strategies.
 * The strategy determines which Playwright locator method to use:
 * - 'role' -> getByRole()
 * - 'label' -> getByLabel()
 * - 'placeholder' -> getByPlaceholder()
 * - 'text' -> getByText()
 * - 'testid' -> getByTestId()
 * - 'd365-controlname' -> Custom D365 locator
 * - 'css' -> CSS selector (flagged as potentially brittle)
 * - 'xpath' -> XPath expression (flagged as potentially brittle)
 */
export type LocatorDefinition =
  | { strategy: 'role'; role: string; name: string }
  | { strategy: 'label'; text: string }
  | { strategy: 'placeholder'; text: string }
  | { strategy: 'text'; text: string; exact?: boolean }
  | { strategy: 'testid'; value: string }
  | { strategy: 'd365-controlname'; controlName: string } // D365-specific: data-dyn-controlname
  | { strategy: 'css'; selector: string; flagged?: boolean }
  | { strategy: 'xpath'; expression: string; flagged?: boolean };

/**
 * Represents the classification of a page.
 * 
 * Contains information about the page type, ID, name, and pattern (ListPage,
 * DetailsPage, Dialog, etc.). Used for organizing pages and generating
 * Page Object Model classes.
 */
export interface PageClassification {
  pageId: string;
  pageName: string;
  pattern: 'ListPage' | 'DetailsPage' | 'Dialog' | 'Workspace' | 'SimpleList' | 'TableOfContents' | 'Unknown';
  url?: string;
  title?: string;
  breadcrumbs?: string[];
  ignoreForPOM?: boolean; // Set to true for auth, redirect, unknown pages
}

/**
 * Page identity extracted from URL and page content.
 * 
 * Contains D365-specific navigation parameters (MI, CMP) and page metadata.
 * Used for page registry and navigation.
 */
export interface PageIdentity {
  pageId: string;            // "SalesOrderListPage"
  mi?: string;               // "SalesTableListPage"
  cmp?: string;              // "FH"
  caption?: string;          // "All sales orders"
  type: 'list' | 'details' | 'dialog' | 'workspace' | 'unknown';
  routePath?: string;        // "/?cmp=FH&mi=SalesTableListPage"
  url?: string;              // Full URL
}

/**
 * Page registry entry stored in JSON.
 * 
 * Extends PageIdentity with generated class name and file path for Page Object Model.
 */
export interface PageRegistryEntry extends PageIdentity {
  className: string;        // "SalesOrderListPage"
  filePath: string;         // "Recordings/pages/d365/sales/sales-order-list.page.js"
}

/**
 * Page registry - maps pageId to registry entry.
 * 
 * The registry is a dictionary where keys are page IDs (or "mi:MI_VALUE" for MI lookups)
 * and values are PageRegistryEntry objects.
 */
export type PageRegistry = Record<string, PageRegistryEntry>;

/**
 * Configuration for starting a new recording session.
 */
export interface SessionConfig {
  flowName: string;
  module: string;
  targetRepo?: string;
  d365Env?: string;
  d365Url?: string;
  storageStatePath?: string;
  tags?: string[];
}

/**
 * Configuration for code generation output.
 * 
 * Specifies where to write generated files and formatting options.
 */
export interface OutputConfig {
  pagesDir: string;
  testsDir: string;
  module?: string;
  formatCode?: boolean;
}

/**
 * Represents a generated file (POM or spec).
 * 
 * Contains the file path and content for code generation output.
 */
export interface GeneratedFile {
  path: string;
  content: string;
  type: 'pom' | 'spec';
}

