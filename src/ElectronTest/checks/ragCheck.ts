import { ElectronTestResultWithoutDuration } from '../types';
import { ConfigManager } from '../../main/config-manager';

export async function ragCheck(): Promise<ElectronTestResultWithoutDuration> {
  const configManager = new ConfigManager();
  const aiConfig = configManager.getAIConfig();

  if (!aiConfig.apiKey || !aiConfig.model) {
    return {
      id: 'rag',
      label: 'RAG / AI Assistant',
      status: 'SKIP',
      details: 'AI provider not configured. Set API key and model in Settings → AI Debugging.',
    };
  }

  // For now we only validate configuration presence to avoid making a live,
  // potentially billable LLM call during diagnostics.
  return {
    id: 'rag',
    label: 'RAG / AI Assistant',
    status: 'PASS',
    details: `AI provider configured (${aiConfig.provider || 'custom'}).`,
  };
}

(ragCheck as any).id = 'rag';
(ragCheck as any).label = 'RAG / AI Assistant';


