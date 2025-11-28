import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { ConfigManager } from '../config-manager';
import { SpecGenerator } from '../../generators/spec-generator';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * RAG Service for AI-powered test debugging
 * Loads test context (.meta.md and _failure.json) and chats with LLM
 */
export class RAGService {
  private configManager: ConfigManager;
  private specGenerator: SpecGenerator;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.specGenerator = new SpecGenerator();
  }

  /**
   * Chat with AI about a specific test failure
   * @param workspacePath - Path to workspace root
   * @param testName - Name of the test (e.g., "CreateSalesOrder")
   * @param messageHistory - Array of chat messages (role, content)
   * @returns AI response content
   */
  async chatWithTest(
    workspacePath: string,
    testName: string,
    messageHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    // Load context files
    const context = await this.loadTestContext(workspacePath, testName);

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // Get AI config
    const aiConfig = this.configManager.getAIConfig();
    if (!aiConfig.apiKey || !aiConfig.model) {
      throw new Error('AI configuration is incomplete. Please configure API key and model in Settings.');
    }

    // Construct messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messageHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call LLM API
    const response = await this.callLLM(aiConfig, messages);

    return response;
  }

  /**
   * Load test context from .meta.md and _failure.json
   */
  private async loadTestContext(workspacePath: string, testName: string): Promise<{
    metaMd: string;
    failureJson: string | null;
  }> {
    // Convert test name to file name (kebab-case)
    const fileName = this.testNameToFileName(testName);
    const bundleDir = path.join(workspacePath, 'tests', 'd365', 'specs', fileName);

    // Read .meta.md
    const metaMdPath = path.join(bundleDir, `${fileName}.meta.md`);
    if (!fs.existsSync(metaMdPath)) {
      throw new Error(`Test metadata not found: ${metaMdPath}. Make sure the test has been generated.`);
    }
    const metaMd = fs.readFileSync(metaMdPath, 'utf-8');

    // Read _failure.json (optional - may not exist if test passed)
    const failureJsonPath = path.join(bundleDir, `${fileName}_failure.json`);
    let failureJson: string | null = null;
    if (fs.existsSync(failureJsonPath)) {
      failureJson = fs.readFileSync(failureJsonPath, 'utf-8');
    }

    return { metaMd, failureJson };
  }

  /**
   * Build system prompt from context
   */
  private buildSystemPrompt(context: { metaMd: string; failureJson: string | null }): string {
    let prompt = `You are an expert Playwright Automation Engineer and SDET (Software Development Engineer in Test).

## CONTEXT (Source Code):
${context.metaMd}

## FORENSICS (Last Failure):`;

    if (context.failureJson) {
      try {
        const failure = JSON.parse(context.failureJson);
        prompt += `\n${JSON.stringify(failure, null, 2)}`;
      } catch (e) {
        prompt += `\n${context.failureJson}`;
      }
    } else {
      prompt += `\nThe test passed or has not run yet. No failure data available.`;
    }

    prompt += `\n\n## INSTRUCTIONS:
Answer the user's questions based on this context. Be concise and actionable. If suggesting code fixes, provide the complete code snippet. Focus on:
- Identifying the root cause of failures
- Suggesting specific fixes with code examples
- Explaining locator issues or timing problems
- Providing best practices for Playwright automation`;

    return prompt;
  }

  /**
   * Call LLM API (OpenAI/DeepSeek compatible)
   */
  private async callLLM(
    config: { provider?: 'openai' | 'deepseek' | 'custom'; apiKey?: string; model?: string; baseUrl?: string },
    messages: ChatMessage[]
  ): Promise<string> {
    // Determine API URL
    let apiUrl: string;
    if (config.baseUrl) {
      // Use provided base URL and ensure /chat/completions endpoint is appended
      apiUrl = config.baseUrl;
      if (!apiUrl.endsWith('/chat/completions')) {
        // Remove trailing slash if present, then append endpoint
        apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
      }
    } else if (config.provider === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    } else {
      // Default to OpenAI
      apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    // Parse URL
    const url = new URL(apiUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // Prepare request payload
    const payload = JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Make HTTP request
    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const response: LLMResponse = JSON.parse(data);
              if (response.choices && response.choices.length > 0) {
                resolve(response.choices[0].message.content);
              } else {
                reject(new Error('No response from LLM'));
              }
            } else {
              reject(new Error(`LLM API error: ${res.statusCode} - ${data}`));
            }
          } catch (error: any) {
            reject(new Error(`Failed to parse LLM response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`LLM API request failed: ${error.message}`));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Convert test name to file name (kebab-case)
   * Uses SpecGenerator's method for consistency
   */
  private testNameToFileName(testName: string): string {
    // Use SpecGenerator's flowNameToFileName method for consistency
    return this.specGenerator.flowNameToFileName(testName);
  }
}

