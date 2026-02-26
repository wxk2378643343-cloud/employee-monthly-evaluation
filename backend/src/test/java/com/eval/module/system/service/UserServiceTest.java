package com.eval.module.system.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eval.common.exception.BusinessException;
import com.eval.module.system.dto.ProfileUpdateDTO;
import com.eval.module.system.dto.UserImportResultVO;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysRole;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.mapper.SysDepartmentMapper;
import com.eval.module.system.mapper.SysGroupMapper;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.io.ByteArrayOutputStream;
import java.util.Collections;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Test
    void getByUsernameAndGetUserInfoAndPageAndList() {
        SysDepartmentMapper deptMapper = mock(SysDepartmentMapper.class);
        SysGroupMapper groupMapper = mock(SysGroupMapper.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        RoleService roleService = mock(RoleService.class);
        PermissionService permissionService = mock(PermissionService.class);
        UserService service = spy(new UserService(deptMapper, groupMapper, encoder, roleService, permissionService));

        SysUser user = new SysUser();
        user.setId(1L);
        user.setUsername("u");
        user.setRole("ADMIN");
        user.setDeptId(9L);
        user.setGroupId(8L);
        doReturn(user).when(service).getOne(any());
        assertSame(user, service.getByUsername("u"));

        doReturn(user).when(service).getById(1L);
        when(permissionService.getPermissionsByRole("ADMIN")).thenReturn(Collections.singletonList("x"));
        SysDepartment dept = new SysDepartment();
        dept.setDeptName("D");
        when(deptMapper.selectById(9L)).thenReturn(dept);
        SysGroup group = new SysGroup();
        group.setGroupName("G");
        when(groupMapper.selectById(8L)).thenReturn(group);
        UserInfoVO vo = service.getUserInfo(1L);
        assertEquals("D", vo.getDeptName());
        assertEquals("G", vo.getGroupName());

        doReturn(new Page<SysUser>()).when(service).page(any(Page.class), any());
        assertNotNull(service.pageUsers(1, 10, null, null));
        doReturn(Collections.emptyList()).when(service).list(any(LambdaQueryWrapper.class));
        assertNotNull(service.listByGroupId(1L));
        assertNotNull(service.listByDeptId(1L));
    }

    @Test
    void createUpdateResetAndProfileAndChangePassword() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        RoleService roleService = mock(RoleService.class);
        UserService service3 = spy(new UserService(mock(SysDepartmentMapper.class), mock(SysGroupMapper.class),
                encoder, roleService, new PermissionService()));

        SysUser u = new SysUser();
        u.setUsername("u");
        u.setPassword("p");
        u.setRole("EMPLOYEE");
        doReturn(null).when(service3).getByUsername("u");
        when(encoder.encode("p")).thenReturn("enc");
        doReturn(true).when(service3).save(any(SysUser.class));
        service3.createUser(u);
        verify(roleService).validateAssignableRole(anyString());

        SysUser existing = new SysUser();
        existing.setId(1L);
        doReturn(existing).when(service3).getById(1L);
        SysUser payload = new SysUser();
        payload.setId(1L);
        payload.setRole("ADMIN");
        doReturn(true).when(service3).updateById(existing);
        service3.updateUser(payload);

        when(encoder.encode("new")).thenReturn("enc-new");
        service3.resetPassword(1L, "new");

        ProfileUpdateDTO dto = new ProfileUpdateDTO();
        dto.setRealName("r");
        dto.setPhone("1");
        dto.setDingtalkId("d");
        service3.updateOwnProfile(1L, dto);

        existing.setPassword("old-enc");
        when(encoder.matches("old", "old-enc")).thenReturn(true);
        when(encoder.encode("newpass")).thenReturn("x");
        service3.changeOwnPassword(1L, "old", "newpass");
    }

    @Test
    void createAndPasswordErrorBranches() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        RoleService roleService = mock(RoleService.class);
        UserService service = spy(new UserService(mock(SysDepartmentMapper.class), mock(SysGroupMapper.class),
                encoder, roleService, new PermissionService()));
        SysUser existing = new SysUser();
        doReturn(existing).when(service).getByUsername("u");
        SysUser u = new SysUser();
        u.setUsername("u");
        assertThrows(BusinessException.class, () -> service.createUser(u));

        doReturn(null).when(service).getById(2L);
        assertThrows(BusinessException.class, () -> service.resetPassword(2L, "x"));
        assertThrows(BusinessException.class, () -> service.updateOwnProfile(2L, new ProfileUpdateDTO()));
        assertThrows(BusinessException.class, () -> service.changeOwnPassword(2L, "a", "b"));
    }

    @Test
    void importUsersFromExcelSuccessAndValidation() throws Exception {
        SysDepartmentMapper deptMapper = mock(SysDepartmentMapper.class);
        SysGroupMapper groupMapper = mock(SysGroupMapper.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("enc");
        RoleService roleService = mock(RoleService.class);
        SysRole role = new SysRole();
        role.setRoleCode("EMPLOYEE");
        role.setRoleName("EMPLOYEE");
        when(roleService.listEnabled()).thenReturn(Collections.singletonList(role));
        UserService service = spy(new UserService(deptMapper, groupMapper, encoder, roleService, new PermissionService()));
        doReturn(null).when(service).getOne(any());
        doReturn(true).when(service).save(any(SysUser.class));
        SysDepartment dept = new SysDepartment();
        dept.setId(11L);
        dept.setDeptName("D1");
        when(deptMapper.selectOne(any())).thenReturn(dept);
        SysGroup group = new SysGroup();
        group.setId(12L);
        group.setGroupName("G1");
        when(groupMapper.selectOne(any())).thenReturn(group);

        XSSFWorkbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("s");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("dept");
        header.createCell(1).setCellValue("group");
        header.createCell(2).setCellValue("name");
        header.createCell(3).setCellValue("username");
        header.createCell(4).setCellValue("role");
        header.createCell(5).setCellValue("phone");
        Row row = sheet.createRow(1);
        row.createCell(0).setCellValue("D1");
        row.createCell(1).setCellValue("G1");
        row.createCell(2).setCellValue("Tom");
        row.createCell(3).setCellValue("tom");
        row.createCell(4).setCellValue("EMPLOYEE");
        row.createCell(5).setCellValue("100");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        MockMultipartFile file = new MockMultipartFile("file", "u.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());

        UserImportResultVO result = service.importUsersFromExcel(file);
        assertEquals(1, result.getTotalRows());
        assertEquals(1, result.getSuccessCount());

        assertThrows(BusinessException.class, () -> service.importUsersFromExcel(
                new MockMultipartFile("file", "x.xlsx", "application/octet-stream", new byte[0])));
    }
}
