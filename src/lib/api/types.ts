// ============================================
// API Types — replace mock implementations in
// src/lib/api/client.ts when connecting to a real backend
// ============================================

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }
  
  export interface ChatRequest {
    message: string;
    conversationId?: string;
  }
  
  export interface ChatResponse {
    reply: string;
    conversationId: string;
  }
  
  export type ServiceStatus = "up" | "down" | "draft";

  export interface InfraService {
    id: string;
    name: string;
    type: "web" | "api" | "database" | "cache" | "worker" | "load-balancer" | "storage";
    description: string;
    status: ServiceStatus;
    provider?: string;
    region?: string;
    estimatedCost?: string;
  }
  
  export interface PreviewResponse {
    services: InfraService[];
  }

  // ============================================
  // Discovery API Types
  // ============================================

  export interface Project {
    project_id: string;
    project_name: string;
    summary?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  }

  export type DiscoveryState =
    | "idle"
    | "collecting_initial_context"
    | "ingesting_sources"
    | "clarifying_core_requirements"
    | "merging_context"
    | "needs_user_confirmation"
    | "ready_for_architecture"
    | "architecture_in_progress"
    | "architecture_ready"
    | "source_ingestion_failed";

  export interface DiscoverySession {
    session_id?: string;
    project_id: string;
    state: DiscoveryState;
    created_at?: string;
  }

  export interface DiscoveryChatMessage {
    id: string;
    project_id: string;
    session_id?: string;
    role: "user" | "assistant";
    content: string;
    message_type?: "free_text" | "question" | "answer" | "summary" | "status_update";
    created_at: string;
  }

  export type ChecklistStatus = "missing" | "inferred" | "confirmed" | "conflicting";
  export type ChecklistPriority = "high" | "medium" | "low";

  export interface ChecklistItem {
    id: string;
    project_id?: string;
    key: string;
    label?: string;
    status: ChecklistStatus;
    priority?: ChecklistPriority;
    evidence?: string;
    updated_at?: string;
  }

  export interface Question {
    id: string;
    project_id?: string;
    question: string;
    reason?: string;
    priority?: string;
    status: "open" | "answered" | "dismissed";
    related_checklist_key?: string;
    created_at?: string;
    updated_at?: string;
  }

  export type ReadinessStatus =
    | "not_ready"
    | "needs_clarification"
    | "maybe_ready"
    | "ready_for_architecture";

  export interface Readiness {
    status: ReadinessStatus;
    check_type?: "quick" | "full";
    coverage?: number;
    missing_critical_items?: string[];
    missing_high_priority?: string[];
    confirmed_items?: string[];
    inferred_items?: string[];
    blocking_questions?: string[];
    notes?: string[];
    evaluated_at?: string;
    quick_check?: Readiness;
    context_summary_available?: boolean;
    components_available?: boolean;
    stack_available?: boolean;
    ingestion_complete?: boolean;
    critical_context_gaps?: string[];
  }

  export interface ChatSendResponse {
    user_message: DiscoveryChatMessage;
    assistant_message: DiscoveryChatMessage;
    checklist?: ChecklistItem[];
    readiness?: Readiness;
    meaningful_update?: boolean;
    repo_url_detected?: string | null;
  }

  export interface CreateProjectResponse {
    project_id: string;
    status?: string;
  }
