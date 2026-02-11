package com.eval.module.system.controller;

import com.eval.common.result.Result;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.system.dto.LoginDTO;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import com.eval.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO loginDTO) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDTO.getUsername(), loginDTO.getPassword()));

        SysUser user = userService.getByUsername(loginDTO.getUsername());
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("realName", user.getRealName());
        data.put("role", user.getRole());
        return Result.success("登录成功", data);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        // Stateless JWT - client side should discard token
        return Result.success();
    }

    @GetMapping("/info")
    public Result<UserInfoVO> getUserInfo() {
        Long userId = SecurityUtils.getCurrentUserId();
        UserInfoVO userInfo = userService.getUserInfo(userId);
        return Result.success(userInfo);
    }
}
