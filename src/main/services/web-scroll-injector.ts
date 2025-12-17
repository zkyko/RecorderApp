/**
 * Service for injecting scrollIntoViewIfNeeded calls before element interactions
 * Only applies to web workspaces to ensure elements are visible before interaction
 */
export class WebScrollInjector {
  /**
   * Inject scrollIntoViewIfNeeded calls before interactions
   * Only applies to web and generic workspaces (not D365/Salesforce which have different needs)
   */
  injectScrolls(code: string, workspaceType: string): string {
    // Only inject for web and generic workspaces (not D365/Salesforce which have different needs)
    if (workspaceType !== 'web' && workspaceType !== 'web-demo' && workspaceType !== 'generic') {
      return code;
    }

    let modifiedCode = code;
    const interactionMethods = ['click', 'fill', 'selectOption', 'check', 'uncheck', 'press', 'type'];
    
    // Process line by line for better reliability
    const lines = modifiedCode.split('\n');
    const processedLines: string[] = [];
    
    for (const line of lines) {
      // Skip lines that already have scrollIntoViewIfNeeded
      if (line.includes('scrollIntoViewIfNeeded')) {
        processedLines.push(line);
        continue;
      }
      
      // Skip lines that don't contain any interaction methods or aren't Playwright locators
      const hasInteraction = interactionMethods.some(m => line.includes(`.${m}(`));
      const isPlaywrightLocator = line.includes('page.') || line.includes('frame.');
      
      if (!hasInteraction || !isPlaywrightLocator) {
        processedLines.push(line);
        continue;
      }
      
      // For each interaction method, find and replace
      let modifiedLine = line;
      for (const method of interactionMethods) {
        // Skip if this method is not in the line
        if (!modifiedLine.includes(`.${method}(`)) {
          continue;
        }
        
        // Find the position of .method( in the line
        const methodIndex = modifiedLine.indexOf(`.${method}(`);
        if (methodIndex === -1) continue;
        
        // Find where the locator chain starts (find the last "await " before the method, or start of line)
        const beforeMethod = modifiedLine.substring(0, methodIndex);
        const awaitIndex = beforeMethod.lastIndexOf('await ');
        const startIndex = awaitIndex >= 0 ? awaitIndex + 6 : 0; // +6 to skip "await "
        
        // Extract the locator chain (everything from startIndex to methodIndex)
        const locatorChain = modifiedLine.substring(startIndex, methodIndex);
        
        // Extract everything after .method( (the rest of the line including arguments)
        const afterMethod = modifiedLine.substring(methodIndex + method.length + 2); // +2 for ".("
        
        // Get indentation from original line
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        // Check if there's an "await" before the locator
        const hasAwait = awaitIndex >= 0;
        const awaitStr = hasAwait ? 'await ' : '';
        
        // Build new line: scroll statement + original method call
        // Format: await [locator].scrollIntoViewIfNeeded();
        //         await [locator].method(...)
        const newLine = `${indent}${awaitStr}${locatorChain}.scrollIntoViewIfNeeded();\n${indent}${awaitStr}${locatorChain}.${method}(${afterMethod}`;
        
        modifiedLine = modifiedLine.substring(0, startIndex) + newLine;
        break; // Only process one method per line
      }
      
      processedLines.push(modifiedLine);
    }
    
    return processedLines.join('\n');
  }
}
