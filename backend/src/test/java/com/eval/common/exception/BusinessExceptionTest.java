package com.eval.common.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BusinessExceptionTest {

    @Test
    void constructorWithMessageUsesDefaultCode() {
        BusinessException ex = new BusinessException("x");
        assertEquals(500, ex.getCode());
        assertEquals("x", ex.getMessage());
    }

    @Test
    void constructorWithCodeAndMessage() {
        BusinessException ex = new BusinessException(400, "bad");
        assertEquals(400, ex.getCode());
        assertEquals("bad", ex.getMessage());
    }
}
