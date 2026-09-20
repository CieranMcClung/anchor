package com.anchorfloat.app.domain.model

/**
 * A routine or task grouped relative to an [Anchor], or sitting in the unassigned pool.
 * Completion is sequential or opportunistic — never a rigid minute assignment.
 */
data class FloatTask(
    val id: Long,
    val title: String,
    val note: String,
    val anchorId: Long?,
    val untilAnchorId: Long?,
    val floatSlot: FloatSlot,
    val sortOrder: Int,
    val status: TaskStatus,
    val isEssential: Boolean,
    val isHighConsequence: Boolean,
    val isLightweight: Boolean,
    val boardDateIso: String?,
) {
    val isOnBoard: Boolean get() = anchorId != null && boardDateIso != null

    val isInPool: Boolean get() = anchorId == null || floatSlot == FloatSlot.POOL

    val isOpen: Boolean
        get() = status == TaskStatus.PENDING ||
            status == TaskStatus.IN_PROGRESS ||
            status == TaskStatus.SWEPT_TO_BACKLOG
}
