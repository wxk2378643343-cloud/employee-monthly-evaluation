package com.eval.common.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.SystemMetaObject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MybatisPlusConfigTest {

    @Test
    void interceptorBean() {
        MybatisPlusInterceptor interceptor = new MybatisPlusConfig().mybatisPlusInterceptor();
        assertNotNull(interceptor);
        assertFalse(interceptor.getInterceptors().isEmpty());
    }

    @Test
    void insertAndUpdateFill() {
        MybatisPlusConfig config = new MybatisPlusConfig() {
            @Override
            public MetaObjectHandler strictInsertFill(MetaObject metaObject, String fieldName, Class fieldType, Object fieldVal) {
                return this;
            }

            @Override
            public MetaObjectHandler strictUpdateFill(MetaObject metaObject, String fieldName, Class fieldType, Object fieldVal) {
                return this;
            }
        };
        MetaObject metaObject = SystemMetaObject.forObject(new Object());

        assertDoesNotThrow(() -> config.insertFill(metaObject));
        assertDoesNotThrow(() -> config.updateFill(metaObject));
    }
}
