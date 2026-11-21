# 员工月度评价系统

面向企业内部月度评价的 Web 应用。管理员负责人员和评价配置，员工按月提交评价，管理侧汇总结果。后端使用 Spring Boot、MyBatis-Plus、MySQL 和 Redis，前端使用 Vue 和 Vite。

| 路径 | 内容 |
| --- | --- |
| [前端](frontend/) | Web 界面与 Nginx 配置 |
| [后端](backend/) | API、认证和数据库脚本 |
| [技术方案](员工月度评价系统技术方案.md) | 业务设计和技术选型 |
| [操作手册](docs/系统操作手册（分步版）.md) | 按角色查阅操作步骤 |
| [管理员说明](docs/管理员操作说明.md) | 管理端操作 |
| [部署指南](DEPLOY.md) | 环境变量、日志和备份 |

## Docker 启动

需要 Docker 和 Compose v2。在仓库根目录复制环境变量模板（PowerShell 可使用 `Copy-Item .env.example .env`），设置 MySQL 和 Redis 密码。`JWT_SECRET` 必须是至少 32 个随机字节的 Base64 编码，可用 `openssl rand -base64 32` 生成。填写后启动。

```sh
cp .env.example .env
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

打开 [http://localhost](http://localhost)。Nginx 将 `/api/` 转发给后端，MySQL 首次初始化时会执行 [schema.sql](backend/src/main/resources/db/schema.sql)。已有数据目录时，初始化脚本不会再次执行。

使用 `docker compose logs --tail=100 backend frontend` 查看启动日志。部署前检查 Compose 的端口映射，数据库和 Redis 只需供应用访问。DingTalk 参数和其他环境选项见 [.env.example](.env.example)。


## 本地开发

前端可在 `frontend/` 中运行 `npm ci` 和 `npm run dev`，开发地址为 `http://localhost:3000`。前端默认将 API 请求代理到本机 8080 端口。后端要求 Java 8 和 Maven，连接 MySQL、Redis 的参数见 [开发环境配置](backend/src/main/resources/application-dev.yml)。启动后端前，先按 [部署指南](DEPLOY.md) 配置数据库和 Redis。
