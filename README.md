# 员工月度评价系统

![Java 8](https://img.shields.io/badge/Java%208-2563EB?style=flat-square)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-0F766E?style=flat-square)
![React 18](https://img.shields.io/badge/React%2018-334155?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-B45309?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-6D28D9?style=flat-square)

## 📌 项目简介

面向企业内部月度评价，支持人员和评价配置、员工提交评价及管理侧查询和汇总。

## 🏗️ 系统架构

- React 前端通过 Nginx 访问 Spring Boot API。
- MySQL 保存人员和评价记录，后端通过 RedisTemplate 接入 Redis。

## 📁 项目结构

| 路径 | 用途 |
| --- | --- |
| [`frontend`](frontend) | 评价界面与 Nginx 配置 |
| [`backend`](backend) | API、认证及建表 SQL |
| [`docs`](docs) | 管理员及员工操作手册 |
| [`DEPLOY.md`](DEPLOY.md) | 部署、日志和备份 |
| [`员工月度评价系统技术方案.md`](%E5%91%98%E5%B7%A5%E6%9C%88%E5%BA%A6%E8%AF%84%E4%BB%B7%E7%B3%BB%E7%BB%9F%E6%8A%80%E6%9C%AF%E6%96%B9%E6%A1%88.md) | 业务流程与技术设计 |

## 🚀 如何启动

先准备 MySQL、Redis 和 JWT 配置，再用 Compose 启动前端、后端和依赖服务。

### Docker 启动

需要 Docker 和 Compose v2。在仓库根目录复制环境变量模板（PowerShell 可使用 `Copy-Item .env.example .env`），设置 MySQL 和 Redis 密码。`JWT_SECRET` 必须是至少 32 个随机字节的 Base64 编码，可用 `openssl rand -base64 32` 生成。填写后启动。

```sh
cp .env.example .env
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

打开 [http://localhost](http://localhost)。Nginx 将 `/api/` 转发给后端，MySQL 首次初始化时会执行 [schema.sql](backend/src/main/resources/db/schema.sql)。已有数据目录时，初始化脚本不会再次执行。

使用 `docker compose logs --tail=100 backend frontend` 查看启动日志。部署前检查 Compose 的端口映射，数据库和 Redis 只需供应用访问。DingTalk 参数和其他环境选项见 [.env.example](.env.example)。

### 本地开发

前端可在 `frontend/` 中运行 `npm ci` 和 `npm run dev`，开发地址为 `http://localhost:3000`。前端默认将 API 请求代理到本机 8080 端口。后端要求 Java 8 和 Maven，连接 MySQL、Redis 的参数见 [开发环境配置](backend/src/main/resources/application-dev.yml)。启动后端前，先按 [部署指南](DEPLOY.md) 配置数据库和 Redis。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源，详见根目录 [LICENSE](LICENSE) 文件。
