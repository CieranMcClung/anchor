package com.anchorfloat.app.domain

import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.ramp.TransitionRampResolver
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.LocalTime

class TransitionRampTest {

    private val lunch = Anchor(
        id = 3,
        title = "Lunch",
        wallClockMinutes = 13 * 60,
        sortOrder = 2,
        isCore = true,
        isSurvivalMilestone = true,
        sensoryHint = "Something to eat. Sitting down counts.",
    )

    @Test
    fun appearsInsideFifteenMinuteWindow() {
        val ramp = TransitionRampResolver.resolve(listOf(lunch), LocalTime.of(12, 50))
        assertNotNull(ramp)
        assertEquals("Lunch", ramp!!.anchor.title)
        assertFalse(ramp.suggestion.contains("min remaining", ignoreCase = true))
        assertFalse(ramp.suggestion.contains("hurry", ignoreCase = true))
    }

    @Test
    fun staysQuietOutsideTheWindow() {
        assertNull(TransitionRampResolver.resolve(listOf(lunch), LocalTime.of(12, 0)))
        assertNull(TransitionRampResolver.resolve(listOf(lunch), LocalTime.of(13, 1)))
    }
}
