import { ExecutionContext } from '../../../types/execution-context';
import { TestRunMeta } from '../../../types/v1.5';

interface FailureArtifactData {
  errorMessage?: string;
  stackTrace?: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  duration?: number;
  retry?: number;
  timestamp?: string;
  failedLocator?: {
    locator: string;
    type: string;
    locatorKey: string;
  };
  assertionFailure?: {
    assertionType: string;
    target: string;
    expected?: string;
    actual?: string;
  };
}

interface DefectAttachments {
  screenshotPath?: string;
  tracePath?: string;
  playwrightReportPath?: string;
  videoPath?: string;
  screenshotPaths?: string[];
}

interface ADFNode {
  type: string;
  content?: ADFNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: any }>;
  attrs?: any;
}

interface ADFDocument {
  type: 'doc';
  version: number;
  content: ADFNode[];
}

/**
 * Builds Jira ADF (Atlassian Document Format) documents for defect descriptions
 */
export class DefectTemplateBuilder {
  /**
   * Build complete ADF document for a defect
   */
  build(
    runMeta: TestRunMeta,
    failureArtifact: FailureArtifactData | undefined,
    executionContext: ExecutionContext | undefined,
    artifacts: DefectAttachments,
    testMeta: { workspaceId?: string; testName: string; module?: string }
  ): ADFDocument {
    const content: ADFNode[] = [];
    
    // Header
    content.push(...this.buildHeader(runMeta, failureArtifact, testMeta));
    
    // Test Execution Environment
    content.push(...this.buildEnvironment(executionContext));
    
    // Failure Summary
    content.push(...this.buildFailureSummary(failureArtifact));
    
    // Assertion Failure Details
    if (failureArtifact?.assertionFailure) {
      content.push(...this.buildAssertionFailure(failureArtifact.assertionFailure));
    }
    
    // Stack Trace
    if (failureArtifact?.stackTrace) {
      content.push(...this.buildStackTrace(failureArtifact.stackTrace));
    }
    
    // Steps to Reproduce
    content.push(...this.buildStepsToReproduce(runMeta, testMeta, executionContext));
    
    // Artifacts
    content.push(...this.buildArtifacts(artifacts));
    
    // External Links
    content.push(...this.buildLinks(executionContext));
    
    // Bundle Reference
    content.push(...this.buildBundleReference(testMeta));
    
    return {
      type: 'doc',
      version: 1,
      content,
    };
  }

  private buildHeader(
    runMeta: TestRunMeta,
    failureArtifact: FailureArtifactData | undefined,
    testMeta: { workspaceId?: string; testName: string }
  ): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    // Heading 1: Test name
    nodes.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: `Test: ${testMeta.testName}` }],
    });
    
    // Paragraph with metadata
    const metaContent: ADFNode[] = [];
    metaContent.push({ type: 'text', text: 'Status: ' });
    metaContent.push({ type: 'text', text: 'Failed', marks: [{ type: 'strong' }] });
    
    if (testMeta.workspaceId) {
      metaContent.push({ type: 'text', text: '\nWorkspace: ' });
      metaContent.push({ type: 'text', text: testMeta.workspaceId });
    }
    
    if (runMeta.runId) {
      metaContent.push({ type: 'text', text: '\nRun ID: ' });
      metaContent.push({ type: 'text', text: runMeta.runId, marks: [{ type: 'code' }] });
    }
    
    if (runMeta.startedAt) {
      const startDate = new Date(runMeta.startedAt).toLocaleString();
      metaContent.push({ type: 'text', text: '\nExecution Time: ' });
      metaContent.push({ type: 'text', text: startDate });
    }
    
    if (failureArtifact?.duration) {
      const durationSeconds = (failureArtifact.duration / 1000).toFixed(2);
      metaContent.push({ type: 'text', text: `\nDuration: ${durationSeconds}s` });
    }
    
    if (failureArtifact?.retry !== undefined && failureArtifact.retry > 0) {
      metaContent.push({ type: 'text', text: `\nRetry Count: ${failureArtifact.retry}` });
    }
    
    nodes.push({
      type: 'paragraph',
      content: metaContent,
    });
    
    return nodes;
  }

  private buildEnvironment(executionContext: ExecutionContext | undefined): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Test Execution Environment' }],
    });
    
    if (executionContext) {
      const listItems: ADFNode[] = [];
      
      const providerName = executionContext.provider === 'browserstack' ? 'BrowserStack Automate'
        : executionContext.provider === 'sauce' ? 'Sauce Labs'
        : executionContext.provider === 'lambdatest' ? 'LambdaTest'
        : executionContext.provider === 'grid' ? 'Selenium Grid'
        : 'Local';
      
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: `Execution Profile: ${providerName}` }],
        }],
      });
      
      if (executionContext.browser) {
        const browserText = executionContext.browserVersion
          ? `${executionContext.browser} ${executionContext.browserVersion}`
          : executionContext.browser;
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: `Browser: ${browserText}` }],
          }],
        });
      }
      
      if (executionContext.os) {
        const osText = executionContext.osVersion
          ? `${executionContext.os} ${executionContext.osVersion}`
          : executionContext.os;
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: `OS: ${osText}` }],
          }],
        });
      }
      
      if (executionContext.device) {
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: `Device: ${executionContext.device}` }],
          }],
        });
      }
      
      if (executionContext.buildName) {
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: `Build: ${executionContext.buildName}` }],
          }],
        });
      }
      
      if (executionContext.projectName) {
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: `Project: ${executionContext.projectName}` }],
          }],
        });
      }
      
      nodes.push({
        type: 'bulletList',
        content: listItems,
      });
    } else {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Execution Profile: Local' }],
      });
    }
    
    return nodes;
  }

  private buildFailureSummary(failureArtifact: FailureArtifactData | undefined): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Failure Summary' }],
    });
    
    const errorMessage = failureArtifact?.errorMessage || 'Automated test failed. See artifacts and links below for more details.';
    
    // Code block for error message
    nodes.push({
      type: 'codeBlock',
      attrs: { language: 'text' },
      content: [{ type: 'text', text: errorMessage }],
    });
    
    return nodes;
  }

  private buildAssertionFailure(assertionFailure: {
    assertionType: string;
    target: string;
    expected?: string;
    actual?: string;
  }): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Assertion Failure Details' }],
    });
    
    const listItems: ADFNode[] = [];
    
    listItems.push({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Type: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: assertionFailure.assertionType },
        ],
      }],
    });
    
    listItems.push({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Target: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: assertionFailure.target, marks: [{ type: 'code' }] },
        ],
      }],
    });
    
    if (assertionFailure.expected !== undefined) {
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Expected: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: String(assertionFailure.expected) },
          ],
        }],
      });
    }
    
    if (assertionFailure.actual !== undefined) {
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Actual: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: String(assertionFailure.actual) },
          ],
        }],
      });
    }
    
    nodes.push({
      type: 'bulletList',
      content: listItems,
    });
    
    return nodes;
  }

  private buildStackTrace(stackTrace: string): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Stack Trace' }],
    });
    
    // Code block for stack trace
    nodes.push({
      type: 'codeBlock',
      attrs: { language: 'java' },
      content: [{ type: 'text', text: stackTrace }],
    });
    
    return nodes;
  }

  private buildStepsToReproduce(
    runMeta: TestRunMeta,
    testMeta: { workspaceId?: string; testName: string },
    executionContext: ExecutionContext | undefined
  ): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Steps to Reproduce' }],
    });
    
    const listItems: ADFNode[] = [];
    
    // Auto-generate steps
    listItems.push({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'Open FourHands Automation Suite' }],
      }],
    });
    
    listItems.push({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: `Navigate to workspace: ${testMeta.workspaceId || '<workspace>'}` }],
      }],
    });
    
    listItems.push({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: `Execute test: ${testMeta.testName}` }],
      }],
    });
    
    if (runMeta.runId) {
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: `View run details for Run ID: ${runMeta.runId}` }],
        }],
      });
    }
    
    nodes.push({
      type: 'orderedList',
      attrs: { order: 1 },
      content: listItems,
    });
    
    return nodes;
  }

  private buildArtifacts(artifacts: DefectAttachments): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Artifacts' }],
    });
    
    const listItems: ADFNode[] = [];
    
    if (artifacts.screenshotPath || (artifacts.screenshotPaths && artifacts.screenshotPaths.length > 0)) {
      const screenshotCount = artifacts.screenshotPaths?.length || (artifacts.screenshotPath ? 1 : 0);
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: `Screenshot${screenshotCount > 1 ? 's' : ''}: ${screenshotCount} file${screenshotCount > 1 ? 's' : ''} attached` }],
        }],
      });
    }
    
    if (artifacts.tracePath) {
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: 'Trace file: attached (contains DOM snapshots, network logs, console logs, and step-by-step execution)' }],
        }],
      });
    }
    
    if (artifacts.videoPath) {
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: 'Video recording: attached' }],
        }],
      });
    }
    
    if (artifacts.playwrightReportPath) {
      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: `Allure HTML Report: ${artifacts.playwrightReportPath}` }],
        }],
      });
    }
    
    if (listItems.length === 0) {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'No artifacts available' }],
      });
    } else {
      nodes.push({
        type: 'bulletList',
        content: listItems,
      });
      
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Note: Trace files can be opened in Playwright Trace Viewer for detailed debugging.', marks: [{ type: 'em' }] }],
      });
    }
    
    return nodes;
  }

  private buildLinks(executionContext: ExecutionContext | undefined): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'External Links' }],
    });
    
    if (executionContext) {
      const listItems: ADFNode[] = [];
      
      if (executionContext.sessionUrl) {
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Session',
              marks: [{ type: 'link', attrs: { href: executionContext.sessionUrl } }],
            }],
          }],
        });
      }
      
      if (executionContext.buildUrl) {
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Build',
              marks: [{ type: 'link', attrs: { href: executionContext.buildUrl } }],
            }],
          }],
        });
      }
      
      if (executionContext.runUrl) {
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Run',
              marks: [{ type: 'link', attrs: { href: executionContext.runUrl } }],
            }],
          }],
        });
      }
      
      if (listItems.length === 0) {
        nodes.push({
          type: 'paragraph',
          content: [{ type: 'text', text: 'No external links available', marks: [{ type: 'em' }] }],
        });
      } else {
        nodes.push({
          type: 'bulletList',
          content: listItems,
        });
      }
    } else {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'No external links available', marks: [{ type: 'em' }] }],
      });
    }
    
    return nodes;
  }

  private buildBundleReference(testMeta: { workspaceId?: string; testName: string }): ADFNode[] {
    const nodes: ADFNode[] = [];
    
    nodes.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'FourHands Automation Suite Bundle Reference' }],
    });
    
    const slug = testMeta.testName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    nodes.push({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Bundle Path: ' },
        { type: 'text', text: `workspaces/${testMeta.workspaceId || '<workspace>'}/tests/specs/${slug}/`, marks: [{ type: 'code' }] },
      ],
    });
    
    return nodes;
  }
}

