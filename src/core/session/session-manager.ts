import { RecordingSession, RecordedStep, SessionConfig } from '../../types';

/**
 * Manages recording sessions - creation, state, and step collection.
 * 
 * The SessionManager is responsible for:
 * - Creating and starting new recording sessions
 * - Tracking session state (startedAt, finishedAt)
 * - Collecting and ordering recorded steps
 * - Updating step descriptions
 * 
 * @remarks
 * Sessions are stored in memory and identified by unique session IDs.
 * Steps are automatically assigned order numbers and timestamps.
 */
export class SessionManager {
  private sessions: Map<string, RecordingSession> = new Map();

  /**
   * Creates and starts a new recording session.
   * 
   * Generates a unique session ID and initializes a RecordingSession object
   * with the provided configuration.
   * 
   * @param config - Session configuration including flowName, module, targetRepo, etc.
   * @returns The created RecordingSession object
   * 
   * @example
   * ```typescript
   * const session = sessionManager.startSession({
   *   flowName: 'Create Sales Order',
   *   module: 'Sales',
   *   d365Env: 'https://dev.dynamics.com'
   * });
   * ```
   */
  startSession(config: SessionConfig): RecordingSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: RecordingSession = {
      id: sessionId,
      flowName: config.flowName,
      module: config.module,
      steps: [],
      startedAt: new Date(),
      targetRepo: config.targetRepo,
      d365Env: config.d365Env,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Stops a recording session.
   * 
   * Sets the finishedAt timestamp and returns the session. The session remains
   * in memory and can still be accessed via getSession().
   * 
   * @param sessionId - The ID of the session to stop
   * @returns The stopped RecordingSession, or null if session not found
   */
  stopSession(sessionId: string): RecordingSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.finishedAt = new Date();
    return session;
  }

  /**
   * Gets a session by ID.
   * 
   * @param sessionId - The ID of the session to retrieve
   * @returns The RecordingSession if found, null otherwise
   */
  getSession(sessionId: string): RecordingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Adds a step to a session.
   * 
   * Automatically assigns:
   * - order: Sequential number based on current step count
   * - timestamp: Current date/time
   * 
   * @param sessionId - The ID of the session to add the step to
   * @param step - The step data (order and timestamp will be added automatically)
   * @throws {Error} If the session is not found
   */
  addStep(sessionId: string, step: Omit<RecordedStep, 'order' | 'timestamp'>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const newStep: RecordedStep = {
      ...step,
      id: step.id || `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: session.steps.length + 1,
      timestamp: new Date(),
    };

    session.steps.push(newStep);
  }

  /**
   * Gets all steps for a session.
   * 
   * @param sessionId - The ID of the session
   * @returns An array of RecordedStep objects, or empty array if session not found
   */
  getSessionSteps(sessionId: string): RecordedStep[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return [...session.steps];
  }

  /**
   * Updates a step's description.
   * 
   * @param sessionId - The ID of the session containing the step
   * @param stepOrder - The order number of the step to update
   * @param description - The new description text
   * @returns true if the step was found and updated, false otherwise
   */
  updateStepDescription(sessionId: string, stepOrder: number, description: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const step = session.steps.find(s => s.order === stepOrder);
    if (!step) {
      return false;
    }

    step.description = description;
    return true;
  }

  /**
   * Clears all sessions from memory.
   * 
   * Useful for cleanup or resetting state. Note: This does not affect
   * any persisted session data (if sessions are saved to disk elsewhere).
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }
}

