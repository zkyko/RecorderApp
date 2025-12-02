"use client";

import { motion } from "framer-motion";

export function ParameterizationFlow() {
  return (
    <div className="my-8 bg-zinc-900/50 border border-white/10 rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-full">
        {/* Phase 1: Detection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 1: Parameter Detection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.1 AST Parsing</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Parse Cleaned Code</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Uses ts-morph to parse TypeScript AST</div>
                <div>• Finds all CallExpression nodes</div>
                <div>• Identifies .fill() and .selectOption() calls</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold mb-1">1.2 Value Extraction</div>
              <div className="text-zinc-300 text-sm font-medium mb-2">Extract String Literals</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>• Gets last argument (value) from calls</div>
                <div>• Filters for StringLiteral nodes only</div>
                <div>• Removes quotes to get original value</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50"></div>
        </div>

        {/* Phase 2: Context Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 2: Context Analysis</h3>
          <div className="px-4 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
            <div className="text-purple-300 text-sm font-medium mb-2">Extract Label from Context</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                <div className="font-semibold mb-1">getByRole</div>
                <div className="text-zinc-500">Extract name from role selector</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                <div className="font-semibold mb-1">getByLabel</div>
                <div className="text-zinc-500">Use label text directly</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                <div className="font-semibold mb-1">Variable Name</div>
                <div className="text-zinc-500">Generate camelCase name from label</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-indigo-500/50"></div>
        </div>

        {/* Phase 3: Candidate Creation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 3: Candidate Creation</h3>
          <div className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg">
            <div className="text-indigo-300 text-sm font-medium mb-2">ParamCandidate Structure</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3">
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">id</div>
                <div className="text-zinc-500 text-[10px]">UUID</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">label</div>
                <div className="text-zinc-500 text-[10px]">Field name</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">originalValue</div>
                <div className="text-zinc-500 text-[10px]">Hardcoded value</div>
              </div>
              <div className="px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-300 text-center">
                <div className="font-semibold">suggestedName</div>
                <div className="text-zinc-500 text-[10px]">camelCase</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-cyan-500/50"></div>
        </div>

        {/* Phase 4: User Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 4: User Selection & Mapping</h3>
          <div className="space-y-3">
            <div className="px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
              <div className="text-cyan-300 text-sm font-medium mb-2">Parameter Mapping Screen</div>
              <div className="text-xs text-zinc-400 space-y-1">
                <div>• User reviews detected candidates</div>
                <div>• Selects which values to parameterize</div>
                <div>• Can rename parameter names</div>
                <div>• Creates mapping: originalValue -&gt; paramName</div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-800/50 border border-cyan-500/30 rounded-lg">
              <div className="text-xs text-cyan-400 font-semibold mb-1">Output</div>
              <div className="text-zinc-300 text-sm">Map{`<`}originalValue, paramName{`>`} passed to code generation</div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-green-500/50"></div>
        </div>

        {/* Phase 5: Code Replacement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 5: Code Replacement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">Before</div>
              <div className="text-xs text-zinc-400 font-mono bg-zinc-900/50 p-2 rounded">
                {`await page.getByRole('combobox', { name: 'Customer account' }).fill('100001')`}
              </div>
            </div>
            <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 text-sm font-medium mb-2">After</div>
              <div className="text-xs text-zinc-400 font-mono bg-zinc-900/50 p-2 rounded">
                {`await page.getByRole('combobox', { name: 'Customer account' }).fill(row.customerAccount)`}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-green-500/50 to-yellow-500/50"></div>
        </div>

        {/* Phase 6: Data Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 6: Data File Generation</h3>
          <div className="px-4 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="text-yellow-300 text-sm font-medium mb-2">TestNameData.json Structure</div>
            <div className="text-xs text-zinc-400 font-mono bg-zinc-900/50 p-3 rounded mt-2">
              {`[
  {
    "id": "scenario-1",
    "customerAccount": "100001",
    "orderType": "Standard"
  },
  {
    "id": "scenario-2",
    "customerAccount": "100002",
    "orderType": "Express"
  }
]`}
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Each row represents one test execution with different data values
            </div>
          </div>
        </motion.div>

        {/* Arrow down */}
        <div className="flex justify-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-yellow-500/50 to-blue-500/50"></div>
        </div>

        {/* Phase 7: Test Execution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Phase 7: Data-Driven Execution</h3>
          <div className="px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <div className="text-blue-300 text-sm font-medium mb-2">Playwright Test Structure</div>
            <div className="text-xs text-zinc-400 font-mono bg-zinc-900/50 p-3 rounded mt-2">
              {`test('test', async ({ page }) => {
  const data = require('./TestNameData.json');
  for (const row of data) {
    // Test code uses row.customerAccount, row.orderType, etc.
    await page.getByRole(...).fill(row.customerAccount);
  }
});`}
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Test executes once per row in the data file, creating multiple test scenarios
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

