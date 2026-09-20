package com.anchorfloat.app.domain

import com.anchorfloat.app.domain.time.NextLocalMidnight
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDateTime
import java.time.ZoneId

class NextLocalMidnightTest {

    private val london = ZoneId.of("Europe/London")

    @Test
    fun delayPointsAtUpcomingMidnight() {
        val now = LocalDateTime.of(2026, 9, 20, 21, 15, 0)
        val delay = NextLocalMidnight.millisUntil(london, now)
        val expected = java.time.Duration.between(
            now,
            LocalDateTime.of(2026, 9, 21, 0, 0),
        ).toMillis()
        assertEquals(expected, delay)
    }

    @Test
    fun atMidnightSchedulesTheFollowingDay() {
        val now = LocalDateTime.of(2026, 9, 21, 0, 0, 0)
        val delay = NextLocalMidnight.millisUntil(london, now)
        assertTrue(delay >= 23 * 60 * 60 * 1000L)
    }
}
