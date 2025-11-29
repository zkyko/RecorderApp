import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/docs/StatusBadge";
import { StatsGrid } from "@/components/docs/StatsGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LangChainIntegrationPage() {
  const performanceStats = [
    {
      label: "Document Processing",
      value: "10x Faster",
      description: "Compared to manual indexing",
    },
    {
      label: "Query Response Time",
      value: "< 2s",
      description: "Average response time",
    },
    {
      label: "Accuracy",
      value: "95%+",
      description: "Context retrieval accuracy",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
        
        <article className="prose prose-invert prose-lg max-w-none">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent m-0">
              LangChain Integration Architecture
            </h1>
          </div>
          
          <StatusBadge status="pending">
            Architecture Design - Pending Approval
          </StatusBadge>
          
          <p className="text-xl text-zinc-400 mb-8">
            Integrating LangChain for advanced document processing and intelligent retrieval.
          </p>

          <h2>LangChain Orchestration Layer</h2>
          
          <div className="my-6 bg-zinc-900/50 border border-white/10 rounded-lg p-6 overflow-x-auto">
            <div className="min-w-full">
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────┐
│         LangChain Orchestration Layer                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │  Document    │─────▶│   Vector     │                │
│  │  Ingestion   │      │   Store      │                │
│  └──────────────┘      └──────────────┘                │
│         │                      │                        │
│         │                      ▼                        │
│         │              ┌──────────────┐                │
│         │              │   Retrieval  │                │
│         │              │   Chain      │                │
│         │              └──────────────┘                │
│         │                      │                        │
│         └──────────────────────┼──────────────────────┘
│                                ▼                        │
│                        ┌──────────────┐                │
│                        │   LLM Agent │                │
│                        └──────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </div>

          <h2>Document Ingestion Pipeline</h2>
          
          <p>Python implementation of the document ingestion pipeline:</p>
          
          <pre className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-zinc-300">{`from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma

class DocumentIngestionPipeline:
    def __init__(self, directory_path: str):
        self.directory_path = directory_path
        self.embeddings = OpenAIEmbeddings()
        
    def load_documents(self):
        loader = DirectoryLoader(self.directory_path)
        return loader.load()
    
    def split_documents(self, documents):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        return text_splitter.split_documents(documents)
    
    def create_vector_store(self, documents):
        return Chroma.from_documents(
            documents,
            self.embeddings,
            persist_directory="./vector_store"
        )`}</code>
          </pre>

          <h2>Agent Implementation</h2>
          
          <pre className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-zinc-300">{`from langchain.agents import initialize_agent
from langchain.llms import OpenAI
from langchain.tools import Tool

class QAStudioAgent:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.llm = OpenAI(temperature=0)
        self.tools = self._create_tools()
        self.agent = initialize_agent(
            self.tools,
            self.llm,
            agent="zero-shot-react-description"
        )
    
    def _create_tools(self):
        return [
            Tool(
                name="TestFailureSearch",
                func=self._search_test_failures,
                description="Search for similar test failures"
            )
        ]
    
    def diagnose_failure(self, error_message: str):
        return self.agent.run(
            f"Diagnose this test failure: {error_message}"
        )`}</code>
          </pre>

          <h2>Performance & Scalability</h2>
          
          <StatsGrid stats={performanceStats} />

          <h2>Integration Points</h2>
          
          <ul className="text-zinc-400">
            <li>Document ingestion from test bundles</li>
            <li>Vector store for semantic search</li>
            <li>LLM agent for intelligent diagnosis</li>
            <li>REST API for external access</li>
          </ul>

          <div className="mt-8 p-4 bg-zinc-900/30 border border-white/10 rounded-lg">
            <p className="text-sm text-zinc-500 italic">
              <strong>Note:</strong> This page structure is ready for content. Please provide the 
              full content from the 'LangChain Integration Architecture' document to complete 
              this page.
            </p>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}

