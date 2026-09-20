package com.anchorfloat.app.domain.model

/**
 * Lifecycle of a float (task). Swept items are ordinary pool residents —
 * never overdue, never scored.
 */
enum class TaskStatus {
    PENDING,
    IN_PROGRESS,
    DONE,
    SWEPT_TO_BACKLOG,
}
