package com.eval.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class RedisConfigTest {

    @Test
    void redisTemplateBean() {
        RedisTemplate<String, Object> template = new RedisConfig().redisTemplate(mock(RedisConnectionFactory.class));
        assertNotNull(template.getKeySerializer());
        assertNotNull(template.getValueSerializer());
        assertNotNull(template.getHashKeySerializer());
        assertNotNull(template.getHashValueSerializer());
    }
}
