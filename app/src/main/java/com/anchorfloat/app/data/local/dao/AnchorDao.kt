package com.anchorfloat.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.anchorfloat.app.data.local.entity.AnchorEntity
import com.anchorfloat.app.data.local.relation.AnchorWithFloats
import kotlinx.coroutines.flow.Flow

@Dao
interface AnchorDao {
    @Query("SELECT * FROM anchors ORDER BY sortOrder ASC, wallClockMinutes ASC")
    fun observeAll(): Flow<List<AnchorEntity>>

    @Transaction
    @Query("SELECT * FROM anchors ORDER BY sortOrder ASC, wallClockMinutes ASC")
    fun observeWithFloats(): Flow<List<AnchorWithFloats>>

    @Query("SELECT COUNT(*) FROM anchors")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(anchors: List<AnchorEntity>): List<Long>
}
