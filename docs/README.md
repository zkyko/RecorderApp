# QA Studio Documentation

Welcome to the QA Studio documentation. This directory contains comprehensive guides for understanding, using, and extending QA Studio.

## 📚 Documentation Overview

### Getting Started

- **[Product Vision](00-product-vision.md)** - Start here to understand QA Studio's goals, principles, and roadmap. Learn why QA Studio exists and what outcomes we optimize for.

### Core Documentation

1. **[Studio Architecture](01-studio-architecture.md)** - System design and component architecture. Understand how the four collaborating branches (Core Runtime, Main Process, Code Generation, and Studio UI) work together.

2. **[Developer Guide](02-developer-guide.md)** - For engineers extending QA Studio. Covers environment setup, coding conventions, testing, debugging, and contribution guidelines.

3. **[User Guide](03-user-guide.md)** - Day-to-day workflows for product owners, QA engineers, and analysts. Learn how to record flows, manage tests, run diagnostics, and use integrations.

### Technical Specifications

- **[RAG Architecture](specs/04-rag-architecture.md)** - Detailed specification for the AI-powered debugging system, including test bundle architecture, forensics engine, and RAG workflow.

- **[Bundled Runtime](BUNDLED_RUNTIME.md)** - How the self-contained Playwright runtime works, including setup, usage, and troubleshooting.

## 🎯 Quick Navigation

### For New Users
1. Read [Product Vision](00-product-vision.md) to understand QA Studio's purpose
2. Follow [User Guide](03-user-guide.md) to get started with recording and test execution
3. Use the Diagnostics screen to verify your environment setup

### For Developers
1. Review [Architecture Guide](01-studio-architecture.md) to understand system design
2. Follow [Developer Guide](02-developer-guide.md) for setup and contribution guidelines
3. Reference [RAG Architecture](specs/04-rag-architecture.md) when working on AI debugging features

### For Architects
1. Start with [Product Vision](00-product-vision.md) for strategic context
2. Deep dive into [Architecture Guide](01-studio-architecture.md) for system topology
3. Review [RAG Architecture](specs/04-rag-architecture.md) for AI system design

## 🆕 Version 2.0 Highlights

QA Studio v2.0 introduces major features documented throughout these guides:

- **Universal Assertion Engine** - First-class assertion support with parameterized expected values
- **Multi-Workspace Architecture** - Platform-agnostic design supporting D365, Web Demo, and future platforms
- **BrowserStack Integration** - Automate execution and Test Management sync
- **Jira Integration** - One-click defect creation from failed test runs
- **Diagnostics & Health Checks** - Built-in environment and integration validation
- **Auto-Updates** - Seamless updates via GitHub Releases

## 📖 Documentation Structure

```
docs/
├── README.md (this file)
├── 00-product-vision.md          # Strategic vision and principles
├── 01-studio-architecture.md      # System design and architecture
├── 02-developer-guide.md          # Developer setup and contribution
├── 03-user-guide.md               # End-user workflows
├── BUNDLED_RUNTIME.md             # Playwright runtime documentation
└── specs/
    └── 04-rag-architecture.md    # AI debugging system specification
```

## 🔗 Related Resources

- **Main README:** See the root [README.md](../README.md) for quick start and feature overview
- **Changelog:** Check [CHANGELOG.md](../CHANGELOG.md) for version history
- **Release Notes:** See version-specific release notes in the root directory

## 🤝 Contributing to Documentation

When updating documentation:

1. **Keep it current** - Update docs when adding features or changing behavior
2. **Be specific** - Include code examples, file paths, and step-by-step instructions
3. **Cross-reference** - Link between related documents for easy navigation
4. **Version awareness** - Note which features are version-specific (e.g., v2.0)

## 📝 Documentation Principles

- **No duplication** - Each document has a specific purpose; avoid repeating content
- **Progressive disclosure** - Start with high-level concepts, then dive into details
- **Actionable** - Provide clear steps and examples, not just descriptions
- **Maintainable** - Keep documentation close to code and update with changes

---

**Last Updated:** December 2025  
**Version:** 2.0.0

