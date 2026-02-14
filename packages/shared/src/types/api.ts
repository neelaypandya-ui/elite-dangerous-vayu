/**
 * @vayu/shared — REST API Types
 *
 * Generic types for the VAYU HTTP API: response wrappers,
 * error shapes, and pagination.
 */

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

/** Standard successful API response. */
export interface ApiResponse<T> {
  /** Whether the request succeeded. */
  success: true;
  /** Response payload. */
  data: T;
  /** Optional human-readable message. */
  message?: string;
  /** Server timestamp. */
  timestamp: string;
  /** Request duration in milliseconds. */
  durationMs: number;
}

/** Standard error API response. */
export interface ApiError {
  /** Whether the request succeeded (always false). */
  success: false;
  /** Error details. */
  error: {
    /** Machine-readable error code. */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** Additional error details. */
    details?: Record<string, unknown>;
    /** Stack trace (only in development). */
    stack?: string;
  };
  /** Server timestamp. */
  timestamp: string;
  /** Request duration in milliseconds. */
  durationMs: number;
}

/** Union type for any API response. */
export type ApiResult<T> = ApiResponse<T> | ApiError;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Pagination metadata. */
export interface PaginationMeta {
  /** Current page number (1-based). */
  page: number;
  /** Items per page. */
  perPage: number;
  /** Total number of items. */
  totalItems: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether there is a next page. */
  hasNext: boolean;
  /** Whether there is a previous page. */
  hasPrev: boolean;
}

/** Paginated API response. */
export interface PaginatedResponse<T> {
  /** Whether the request succeeded. */
  success: true;
  /** Array of items for this page. */
  data: T[];
  /** Pagination metadata. */
  pagination: PaginationMeta;
  /** Server timestamp. */
  timestamp: string;
  /** Request duration in milliseconds. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------

/** Common query parameters for list endpoints. */
export interface ListQueryParams {
  /** Page number (1-based). */
  page?: number;
  /** Items per page. */
  perPage?: number;
  /** Sort field. */
  sortBy?: string;
  /** Sort direction. */
  sortOrder?: 'asc' | 'desc';
  /** Free-text search query. */
  search?: string;
}

/** Query parameters for journal event retrieval. */
export interface JournalQueryParams extends ListQueryParams {
  /** Filter by event type(s). */
  eventTypes?: string[];
  /** Start timestamp (inclusive). */
  since?: string;
  /** End timestamp (inclusive). */
  until?: string;
  /** Filter by commander name. */
  commander?: string;
}

/** Query parameters for trade route search. */
export interface TradeRouteQueryParams {
  /** Starting system. */
  fromSystem?: string;
  /** Maximum distance in LY. */
  maxDistance?: number;
  /** Minimum profit per unit. */
  minProfitPerUnit?: number;
  /** Cargo capacity in tons. */
  cargoCapacity?: number;
  /** Maximum landing pad size required. */
  padSize?: 'S' | 'M' | 'L';
  /** Maximum age of market data in minutes. */
  maxDataAgeMinutes?: number;
  /** Commodity to search for. */
  commodity?: string;
  /** Number of results to return. */
  limit?: number;
}

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

/** HTTP method. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** API route definition for documentation / client generation. */
export interface ApiRouteDefinition {
  /** HTTP method. */
  method: HttpMethod;
  /** URL path pattern (e.g. "/api/v1/state/commander"). */
  path: string;
  /** Human-readable description. */
  description: string;
  /** Whether authentication is required. */
  authenticated: boolean;
  /** Tags for grouping in documentation. */
  tags: string[];
}
