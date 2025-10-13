# 构建阶段
FROM node:18 as build-stage

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM nginx:alpine as production-stage

# 复制构建文件到nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 暴露3002端口
EXPOSE 3002

# 复制nginx配置
RUN echo 'server { \
    listen 3002; \
    location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
