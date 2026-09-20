package com.anchorfloat.app.di

import android.content.Context
import androidx.room.Room
import com.anchorfloat.app.data.local.AppDatabase
import com.anchorfloat.app.data.local.dao.AnchorDao
import com.anchorfloat.app.data.local.dao.PrefsDao
import com.anchorfloat.app.data.local.dao.TaskDao
import com.anchorfloat.app.data.repository.TimelineRepositoryImpl
import com.anchorfloat.app.domain.repository.TimelineRepository
import com.anchorfloat.app.domain.time.SystemTimeProvider
import com.anchorfloat.app.domain.time.TimeProvider
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class IoDispatcher

@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule {
    @Provides
    @IoDispatcher
    fun io(): CoroutineDispatcher = Dispatchers.IO
}

@Module
@InstallIn(SingletonComponent::class)
object TimeModule {
    @Provides
    @Singleton
    fun timeProvider(): TimeProvider = SystemTimeProvider()
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun database(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, AppDatabase.NAME)
            .fallbackToDestructiveMigration(dropAllTables = true)
            .build()

    @Provides
    fun anchorDao(db: AppDatabase): AnchorDao = db.anchorDao()

    @Provides
    fun taskDao(db: AppDatabase): TaskDao = db.taskDao()

    @Provides
    fun prefsDao(db: AppDatabase): PrefsDao = db.prefsDao()
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun timelineRepository(impl: TimelineRepositoryImpl): TimelineRepository
}
