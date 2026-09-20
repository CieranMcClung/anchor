package com.anchorfloat.app.ui.timeline

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anchorfloat.app.domain.filter.EnergyVisibility
import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.AnchorTimeline
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.UserPrefs
import com.anchorfloat.app.domain.ramp.TransitionRampResolver
import com.anchorfloat.app.domain.repository.TimelineRepository
import com.anchorfloat.app.domain.time.TimeProvider
import com.anchorfloat.app.domain.unstuck.UnstuckCatalog
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import javax.inject.Inject

private data class TimelineChrome(
    val selectedAnchorId: Long?,
    val unstuckVisible: Boolean,
    val rampDismissedAnchorId: Long?,
    val now: LocalTime,
)

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class TimelineViewModel @Inject constructor(
    private val repository: TimelineRepository,
    private val timeProvider: TimeProvider,
) : ViewModel() {

    private val selectedAnchorId = MutableStateFlow<Long?>(null)
    private val unstuckVisible = MutableStateFlow(false)
    private val rampDismissedAnchorId = MutableStateFlow<Long?>(null)

    private val ticks = flow {
        while (true) {
            emit(timeProvider.localTime())
            delay(30_000)
        }
    }

    private val chrome = combine(
        selectedAnchorId,
        unstuckVisible,
        rampDismissedAnchorId,
        ticks,
    ) { selected, unstuck, dismissedRamp, now ->
        TimelineChrome(selected, unstuck, dismissedRamp, now)
    }

    private val visibleTasks = repository.observePrefs()
        .flatMapLatest { prefs -> repository.observeVisibleTasks(prefs.energy) }

    val uiState: StateFlow<TimelineUiState> = combine(
        repository.observePrefs(),
        repository.observeAnchors(),
        visibleTasks,
        chrome,
    ) { prefs, anchors, tasks, chrome ->
        buildState(prefs, anchors, tasks, chrome)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = TimelineUiState(),
    )

    init {
        viewModelScope.launch {
            repository.ensureReady(timeProvider.today().toString())
        }
    }

    fun onIntent(intent: TimelineIntent) {
        when (intent) {
            is TimelineIntent.SetEnergy -> viewModelScope.launch {
                repository.setEnergy(intent.energy)
            }
            is TimelineIntent.SelectAnchor -> selectedAnchorId.update { current ->
                if (current == intent.anchorId) null else intent.anchorId
            }
            is TimelineIntent.SelectTask -> viewModelScope.launch {
                repository.setFocusedTask(intent.taskId)
            }
            is TimelineIntent.CompleteTask -> viewModelScope.launch {
                repository.completeTask(intent.taskId)
                unstuckVisible.value = false
            }
            is TimelineIntent.StartTask -> viewModelScope.launch {
                repository.startTask(intent.taskId)
            }
            is TimelineIntent.BreakSmaller -> viewModelScope.launch {
                repository.breakSmaller(intent.taskId)
            }
            is TimelineIntent.SwapTask -> viewModelScope.launch {
                repository.swapTask(intent.taskId, uiState.value.visibleTaskIds)
            }
            TimelineIntent.OpenUnstuck -> {
                val focused = uiState.value.unstuckTarget
                if (focused != null) {
                    viewModelScope.launch { repository.setFocusedTask(focused.id) }
                }
                unstuckVisible.value = true
            }
            TimelineIntent.DismissUnstuck -> unstuckVisible.value = false
            TimelineIntent.DismissRamp -> {
                rampDismissedAnchorId.value = uiState.value.ramp?.anchor?.id
            }
        }
    }

    private fun buildState(
        prefs: UserPrefs,
        anchors: List<Anchor>,
        tasks: List<FloatTask>,
        chrome: TimelineChrome,
    ): TimelineUiState {
        val byAnchor = tasks.filter { it.isOnBoard }.groupBy { it.anchorId }
        val pool = tasks
            .filter { it.isInPool || it.anchorId == null }
            .sortedBy { it.sortOrder }

        val timeline = anchors.mapNotNull { anchor ->
            val children = byAnchor[anchor.id].orEmpty().sortedBy { it.sortOrder }
            val visibleChildren = EnergyVisibility.filterTasks(children, prefs.energy)
            if (!EnergyVisibility.isAnchorVisible(anchor, visibleChildren, prefs.energy)) {
                return@mapNotNull null
            }
            AnchorTimeline(
                anchor = anchor,
                before = visibleChildren.filter { it.floatSlot == FloatSlot.BEFORE },
                between = visibleChildren.filter { it.floatSlot == FloatSlot.BETWEEN },
                after = visibleChildren.filter { it.floatSlot == FloatSlot.AFTER },
            )
        }

        val focused = tasks.firstOrNull { it.id == prefs.focusedTaskId }
            ?: timeline.flatMap { it.visibleFloats }.firstOrNull()
            ?: pool.firstOrNull()

        val ramp = TransitionRampResolver.resolve(anchors, chrome.now)
            ?.takeIf { it.anchor.id != chrome.rampDismissedAnchorId }

        val todayLabel = timeProvider.today().format(
            DateTimeFormatter.ofPattern("EEEE d MMMM", Locale.getDefault()),
        )

        return TimelineUiState(
            energy = prefs.energy,
            selectedAnchorId = chrome.selectedAnchorId,
            focusedTask = focused,
            anchors = timeline,
            pool = pool,
            unstuckVisible = chrome.unstuckVisible,
            unstuckAction = if (chrome.unstuckVisible) {
                UnstuckCatalog.forEnergy(prefs.energy, focused)
            } else {
                null
            },
            ramp = ramp,
            todayLabel = "Today · $todayLabel",
            isLoading = false,
        )
    }
}
