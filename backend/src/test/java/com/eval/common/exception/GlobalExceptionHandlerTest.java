package com.eval.common.exception;

import com.eval.common.result.Result;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleBusinessException() {
        Result<Void> result = handler.handleBusinessException(new BusinessException(409, "conflict"));
        assertEquals(409, result.getCode());
        assertEquals("conflict", result.getMessage());
    }

    @Test
    void handleBadCredentialsException() {
        Result<Void> result = handler.handleBadCredentialsException(new BadCredentialsException("x"));
        assertEquals(401, result.getCode());
    }

    @Test
    void handleAccessDeniedException() {
        Result<Void> result = handler.handleAccessDeniedException(new AccessDeniedException("x"));
        assertEquals(403, result.getCode());
    }

    @Test
    void handleValidationException() throws NoSuchMethodException {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "obj");
        bindingResult.addError(new FieldError("obj", "name", "name required"));
        MethodParameter methodParameter = new MethodParameter(
                DummyController.class.getDeclaredMethod("method", String.class), 0);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(methodParameter, bindingResult);
        Result<Void> result = handler.handleValidationException(ex);
        assertEquals(400, result.getCode());
        assertEquals("name required", result.getMessage());
    }

    @Test
    void handleBindException() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "obj");
        bindingResult.addError(new FieldError("obj", "name", "bad value"));
        BindException ex = new BindException(bindingResult);
        Result<Void> result = handler.handleBindException(ex);
        assertEquals(400, result.getCode());
        assertEquals("bad value", result.getMessage());
    }

    @Test
    void handleGenericException() {
        Result<Void> result = handler.handleException(new RuntimeException("boom"));
        assertEquals(500, result.getCode());
    }

    static class DummyController {
        public void method(String value) {}
    }
}
