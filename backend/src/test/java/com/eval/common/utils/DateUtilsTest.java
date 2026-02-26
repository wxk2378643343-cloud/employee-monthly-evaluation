package com.eval.common.utils;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class DateUtilsTest {

    @Test
    void formatDateHandlesNullAndValue() {
        assertNull(DateUtils.formatDate(null));
        assertEquals("2024-01-02", DateUtils.formatDate(LocalDate.of(2024, 1, 2)));
    }

    @Test
    void formatDateTimeHandlesNullAndValue() {
        assertNull(DateUtils.formatDateTime(null));
        assertEquals("2024-01-02 03:04:05", DateUtils.formatDateTime(LocalDateTime.of(2024, 1, 2, 3, 4, 5)));
    }

    @Test
    void currentYearAndMonthAreReasonable() {
        int year = DateUtils.getCurrentYear();
        int month = DateUtils.getCurrentMonth();
        assertTrue(year >= 2024);
        assertTrue(month >= 1 && month <= 12);
    }

    @Test
    void currentPeriodNameContainsYearAndMonth() {
        String name = DateUtils.getCurrentPeriodName();
        assertNotNull(name);
        assertTrue(name.contains(String.valueOf(DateUtils.getCurrentYear())));
        assertTrue(name.contains(String.valueOf(DateUtils.getCurrentMonth())));
    }
}
