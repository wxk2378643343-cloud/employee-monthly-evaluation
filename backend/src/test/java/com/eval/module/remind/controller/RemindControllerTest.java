package com.eval.module.remind.controller;

import com.eval.module.remind.service.RemindService;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class RemindControllerTest {

    @Test
    void allEndpoints() {
        RemindService service = mock(RemindService.class);
        when(service.listByPeriod(1L)).thenReturn(Collections.emptyList());
        when(service.listCurrentUser(null)).thenReturn(Collections.emptyList());
        when(service.listCurrentUserUnread()).thenReturn(Collections.emptyList());
        when(service.unreadCountForCurrentUser()).thenReturn(0L);
        RemindController controller = new RemindController(service);
        assertEquals(200, controller.sendRemind(1L).getCode());
        assertEquals(200, controller.listByPeriod(1L).getCode());
        assertEquals(200, controller.listMine(null).getCode());
        assertEquals(200, controller.listUnread().getCode());
        assertEquals(200, controller.unreadCount().getCode());
        assertEquals(200, controller.markRead(5L).getCode());
        assertEquals(200, controller.markAllRead().getCode());
        verify(service).remindUnscored(1L);
        verify(service).markReadForCurrentUser(5L);
        verify(service).markAllReadForCurrentUser();
    }
}
