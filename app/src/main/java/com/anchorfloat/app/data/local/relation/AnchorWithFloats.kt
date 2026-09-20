package com.anchorfloat.app.data.local.relation

import androidx.room.Embedded
import androidx.room.Relation
import com.anchorfloat.app.data.local.entity.AnchorEntity
import com.anchorfloat.app.data.local.entity.TaskEntity

/**
 * Room relationship: an anchor owns an ordered list of floating child tasks.
 * Unassigned tasks (anchorId == null) live in the backlog pool and are not included here.
 */
data class AnchorWithFloats(
    @Embedded val anchor: AnchorEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "anchorId",
        entity = TaskEntity::class,
    )
    val floats: List<TaskEntity>,
)
