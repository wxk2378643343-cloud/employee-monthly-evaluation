package com.eval.common.result;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResultTest {

    @Test
    void successWithoutData() {
        Result<Void> result = Result.success();
        assertEquals(200, result.getCode());
        assertEquals("success", result.getMessage());
        assertNull(result.getData());
    }

    @Test
    void successWithData() {
        Result<String> result = Result.success("ok");
        assertEquals(200, result.getCode());
        assertEquals("success", result.getMessage());
        assertEquals("ok", result.getData());
    }

    @Test
    void successWithCustomMessage() {
        Result<String> result = Result.success("done", "data");
        assertEquals(200, result.getCode());
        assertEquals("done", result.getMessage());
        assertEquals("data", result.getData());
    }

    @Test
    void failWithDefaultCode() {
        Result<Void> result = Result.fail("err");
        assertEquals(500, result.getCode());
        assertEquals("err", result.getMessage());
    }

    @Test
    void failWithCustomCode() {
        Result<Void> result = Result.fail(403, "forbidden");
        assertEquals(403, result.getCode());
        assertEquals("forbidden", result.getMessage());
    }
}
