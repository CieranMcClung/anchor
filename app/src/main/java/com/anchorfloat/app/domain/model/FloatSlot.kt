package com.anchorfloat.app.domain.model

/**
 * Where a float sits relative to an [Anchor]. Floats are not tied to wall-clock minutes.
 */
enum class FloatSlot {
    /** Before the parent anchor's milestone. */
    BEFORE,

    /** After the parent anchor's milestone. */
    AFTER,

    /** In the gap between the parent anchor and [FloatTask.untilAnchorId]. */
    BETWEEN,

    /** Unassigned backlog / pool. */
    POOL,
}
