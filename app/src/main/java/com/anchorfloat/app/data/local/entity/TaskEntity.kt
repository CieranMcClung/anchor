package com.anchorfloat.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.TaskStatus

@Entity(
    tableName = "tasks",
    foreignKeys = [
        ForeignKey(
            entity = AnchorEntity::class,
            parentColumns = ["id"],
            childColumns = ["anchorId"],
            onDelete = ForeignKey.SET_NULL,
        ),
        ForeignKey(
            entity = AnchorEntity::class,
            parentColumns = ["id"],
            childColumns = ["untilAnchorId"],
            onDelete = ForeignKey.SET_NULL,
        ),
    ],
    indices = [
        Index("anchorId"),
        Index("untilAnchorId"),
        Index("boardDateIso"),
        Index("status"),
        Index("sortOrder"),
    ],
)
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val note: String = "",
    val anchorId: Long? = null,
    val untilAnchorId: Long? = null,
    val floatSlot: FloatSlot = FloatSlot.POOL,
    val sortOrder: Int = 0,
    val status: TaskStatus = TaskStatus.PENDING,
    val isEssential: Boolean = false,
    val isHighConsequence: Boolean = false,
    val isLightweight: Boolean = false,
    /** ISO local date the float is pinned to today's board; null means pool / archive. */
    val boardDateIso: String? = null,
)
