import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Cloud, FileCheck, Shield, Settings, Database, Code2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrichedText } from "@/components/docs/EnrichedText";

export default function EnterpriseIntegrationsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs/advanced"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advanced Docs
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Enterprise Integrations
            </h1>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              v2.0
            </Badge>
          </div>
          <p className="text-xl text-zinc-400">
            BrowserStack Test Management and Jira integration architecture
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                QA Studio v2.0 introduces enterprise-grade integrations for test management and defect tracking. 
                These integrations enable seamless workflow between test execution, result tracking, and issue management.
                The <EnrichedText text="Assertion Engine" /> provides detailed failure metadata that powers these integrations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-white">BrowserStack Test Management</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Sync test cases and runs to BrowserStack TM for centralized test tracking and reporting.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Jira Integration</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    One-click defect creation from failed test runs with pre-filled context and repro steps.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BrowserStack Test Management */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">BrowserStack Test Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                BrowserStack TM integration provides centralized test case and run management through REST API.
              </p>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-3">Service Architecture</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <code className="text-purple-400 text-sm">browserstackTmService.ts</code>
                    </div>
                    <p className="text-xs text-zinc-400 ml-6">
                      Main service class handling TM API interactions
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">Configuration</span>
                    </div>
                    <ul className="text-xs text-zinc-400 ml-6 space-y-1 list-disc list-inside">
                      <li>tmProjectId - BrowserStack TM project identifier</li>
                      <li>tmBaseUrl - API endpoint (default: https://test-management.browserstack.com/api/v2)</li>
                      <li>Credentials - Uses BrowserStack username and access key</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-2">createOrUpdateTestCase()</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Creates or updates a test case in BrowserStack TM from flow metadata.
                  </p>
                  <div className="p-2 bg-zinc-900 rounded font-mono text-xs text-zinc-300">
                    POST /projects/{'{projectId}'}/test_cases
                  </div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-2">publishTestRun()</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Publishes test run results with assertion details and BrowserStack Automate session info.
                  </p>
                  <div className="p-2 bg-zinc-900 rounded font-mono text-xs text-zinc-300">
                    POST /projects/{'{projectId}'}/test_runs
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Authentication</h4>
                <p className="text-sm text-zinc-400">
                  Uses HTTP Basic authentication with BrowserStack username and access key. 
                  Credentials are base64 encoded in the Authorization header.
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`// Test case payload
{
  "name": "Create Sales Order",
  "description": "Test flow for creating sales orders",
  "preconditions": "User must be logged in",
  "steps": [...],
  "expected_result": "Sales order created successfully"
}

// Test run payload
{
  "test_case_id": 12345,
  "status": "passed" | "failed",
  "duration": 45000,
  "assertions": [
    {
      "stepId": "step-5",
      "assertion": "toHaveText",
      "expected": "Submitted",
      "actual": "Submitted",
      "passed": true
    }
  ],
  "browserstack_session_id": "abc123",
  "browserstack_url": "https://automate.browserstack.com/..."
}`}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Jira Integration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Jira Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Jira integration enables one-click defect creation from failed test runs with pre-filled context.
              </p>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-3">Service Architecture</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <code className="text-blue-400 text-sm">jiraService.ts</code>
                    </div>
                    <p className="text-xs text-zinc-400 ml-6">
                      Main service class handling Jira REST API interactions
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 text-sm">Configuration</span>
                    </div>
                    <ul className="text-xs text-zinc-400 ml-6 space-y-1 list-disc list-inside">
                      <li>baseUrl - Jira instance URL (e.g., https://fourhands.atlassian.net)</li>
                      <li>email - Jira account email</li>
                      <li>apiToken - Jira API token for authentication</li>
                      <li>projectKey - Project key (e.g., QST)</li>
                      <li>defaultLabels - Default labels for created issues</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">testConnection()</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Verifies Jira connection by fetching project details.
                  </p>
                  <div className="p-2 bg-zinc-900 rounded font-mono text-xs text-zinc-300">
                    GET /rest/api/3/project/{'{projectKey}'}
                  </div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">getFields()</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Retrieves available Jira fields for dynamic mapping (optional).
                  </p>
                  <div className="p-2 bg-zinc-900 rounded font-mono text-xs text-zinc-300">
                    GET /rest/api/3/field
                  </div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">createIssue()</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Creates a new Jira issue with pre-filled test failure details.
                  </p>
                  <div className="p-2 bg-zinc-900 rounded font-mono text-xs text-zinc-300">
                    POST /rest/api/3/issue
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Custom Field Mapping</h4>
                <p className="text-sm text-zinc-400 mb-2">
                  Jira integration uses <code className="text-blue-400 bg-zinc-800 px-1 rounded">JiraRestAPI.json</code> 
                  for custom field mapping. Key mappings include:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>customfield_11160 → Repro Steps</li>
                  <li>customfield_11161 → Impact Description</li>
                  <li>customfield_11127 → Dynamics Environment</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`// Jira issue payload
{
  "fields": {
    "project": { "key": "QST" },
    "summary": "[D365] Create Sales Order failed at step 5 - toHaveText",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Workspace: D365\\nFlow: Create Sales Order\\nRun ID: run-12345"
            }
          ]
        }
      ]
    },
    "issuetype": { "name": "Bug" },
    "labels": ["qa-studio", "d365"],
    "customfield_11160": "1. Navigate to Sales Orders\\n2. Click New...",
    "customfield_11161": "Sales order creation flow is broken",
    "customfield_11127": "D365 Production"
  }
}`}</pre>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Defect Creation Flow</h4>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>User clicks "Create Jira Defect" button on failed test run</li>
                  <li>Modal opens with pre-filled summary, description, and custom fields</li>
                  <li>User can edit fields before submission</li>
                  <li>jiraService.createIssue() is called with the payload</li>
                  <li>Issue key is saved to run metadata and displayed in UI</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Integration Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Integration Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500"></div>
                  <div className="space-y-6 pl-10">
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-purple-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">1. Test Execution</h4>
                        <p className="text-sm text-zinc-400">
                          Test runs locally or on BrowserStack Automate. Assertion results are captured in run summary.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-indigo-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">2. BrowserStack TM Sync</h4>
                        <p className="text-sm text-zinc-400">
                          Test case is created/updated in BrowserStack TM. Run results are published with assertion details and session info.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-blue-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">3. Failure Detection</h4>
                        <p className="text-sm text-zinc-400">
                          If test fails, assertion metadata (expected vs actual) is extracted and stored in run summary.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-cyan-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">4. Jira Defect Creation</h4>
                        <p className="text-sm text-zinc-400">
                          User clicks "Create Jira Defect". Issue is created with pre-filled test failure context, repro steps, and BrowserStack session link.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings & Configuration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Settings & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                Both integrations are configured in the Settings UI with connection verification:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-2">BrowserStack TM Settings</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>TM Project ID</li>
                    <li>TM Base URL (default provided)</li>
                    <li>Uses BrowserStack Automate credentials</li>
                    <li>Test Connection button</li>
                  </ul>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">Jira Settings</h4>
                  <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Jira Base URL</li>
                    <li>Email and API Token</li>
                    <li>Project Key</li>
                    <li>Default Labels</li>
                    <li>Test Connection button</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/architecture"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Architecture Overview
              </Link>
              <Link
                href="/docs/advanced/assertion-engine"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Assertion Engine
              </Link>
              <Link
                href="/docs/core-features/test-execution"
                className="px-4 py-2 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Test Execution
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

