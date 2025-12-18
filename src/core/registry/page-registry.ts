import * as fs from 'fs';
import * as path from 'path';
import { PageRegistry, PageRegistryEntry, PageIdentity } from '../../types';
import { makePageClassName } from '../utils/identifiers';

/**
 * Manages the page registry - a JSON file that tracks all discovered D365 pages.
 * 
 * The page registry serves as a knowledge base mapping page identities to metadata
 * including class names, file paths, and navigation parameters. This enables:
 * - Reusing page objects across multiple test recordings
 * - Quick lookup of pages by pageId or MI parameter
 * - Generating consistent file paths for page objects
 * 
 * @remarks
 * The registry is persisted to disk as JSON and loaded on initialization.
 * Pages are indexed by both pageId and MI parameter for fast lookups.
 */
export class PageRegistryManager {
  private registryPath: string;
  private registry: PageRegistry = {};

  /**
   * Creates a new PageRegistryManager instance.
   * 
   * @param registryPath - Path to the registry JSON file (default: 'Recordings/page-registry.json')
   */
  constructor(registryPath: string = 'Recordings/page-registry.json') {
    this.registryPath = registryPath;
    this.loadRegistry();
  }

  /**
   * Loads the registry from disk.
   * 
   * Creates an empty registry if the file doesn't exist or is invalid.
   * @internal
   */
  private loadRegistry(): void {
    try {
      if (fs.existsSync(this.registryPath)) {
        const content = fs.readFileSync(this.registryPath, 'utf-8');
        this.registry = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading page registry:', error);
      this.registry = {};
    }
  }

  /**
   * Saves the registry to disk.
   * 
   * Creates the directory if it doesn't exist.
   * @internal
   */
  private saveRegistry(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.registryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving page registry:', error);
    }
  }

  /**
   * Registers or updates a page identity in the registry.
   * 
   * Generates a class name and file path for the page, then stores it in the registry.
   * The page is indexed by both pageId and MI parameter (if available) for fast lookups.
   * 
   * @param identity - The PageIdentity object to register
   * @param module - Optional module name (e.g., 'Sales', 'Inventory') for organizing pages
   * @returns The created PageRegistryEntry with className and filePath
   * 
   * @example
   * ```typescript
   * const entry = registry.registerPage({
   *   pageId: 'SalesOrderListPage',
   *   mi: 'SalesTableListPage',
   *   caption: 'All sales orders',
   *   type: 'list'
   * }, 'Sales');
   * ```
   */
  registerPage(identity: PageIdentity, module?: string): PageRegistryEntry {
    // Map PageIdentity type to PageClassification pattern for makePageClassName
    const typeToPattern: Record<PageIdentity['type'], 'ListPage' | 'DetailsPage' | 'Dialog' | 'Workspace' | 'SimpleList' | 'TableOfContents' | 'Unknown'> = {
      'list': 'ListPage',
      'details': 'DetailsPage',
      'dialog': 'Dialog',
      'workspace': 'Workspace',
      'unknown': 'Unknown',
    };
    
    const pattern = typeToPattern[identity.type] || 'Unknown';
    
    // Generate className from pageId or caption
    const className = makePageClassName(identity.caption || identity.pageId, pattern);

    // Generate file path
    const modulePath = module ? path.join('d365', module) : 'd365';
    const fileName = this.pageIdToFileName(identity.pageId);
    const filePath = path.join('Recordings', 'pages', modulePath, `${fileName}.page.js`);

    const entry: PageRegistryEntry = {
      ...identity,
      className,
      filePath,
    };

    // Store by pageId
    this.registry[identity.pageId] = entry;

    // Also store by mi if available (for quick lookup)
    if (identity.mi) {
      this.registry[`mi:${identity.mi}`] = entry;
    }

    this.saveRegistry();
    return entry;
  }

  /**
   * Gets a registry entry by pageId.
   * 
   * @param pageId - The page ID to look up (e.g., 'SalesOrderListPage')
   * @returns The PageRegistryEntry if found, undefined otherwise
   */
  getPage(pageId: string): PageRegistryEntry | undefined {
    return this.registry[pageId];
  }

  /**
   * Gets a registry entry by MI (Menu Item) parameter.
   * 
   * @param mi - The MI parameter to look up (e.g., 'SalesTableListPage')
   * @returns The PageRegistryEntry if found, undefined otherwise
   */
  getPageByMi(mi: string): PageRegistryEntry | undefined {
    return this.registry[`mi:${mi}`];
  }

  /**
   * Gets all registered pages.
   * 
   * @returns A copy of the entire registry as a PageRegistry object
   */
  getAllPages(): PageRegistry {
    return { ...this.registry };
  }

  /**
   * Converts a pageId to a file name.
   * 
   * Converts PascalCase to kebab-case and removes 'Page' suffix.
   * Example: "SalesOrderListPage" -> "sales-order-list"
   * 
   * @param pageId - The page ID to convert
   * @returns A file name in kebab-case
   * @internal
   */
  private pageIdToFileName(pageId: string): string {
    return pageId
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/-page$/, '');
  }
}

