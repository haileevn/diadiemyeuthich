# Hướng dẫn Deploy — Địa Điểm Yêu Thích

Dự án gồm 2 phần:
- **Frontend**: React/Vite → build ra file tĩnh, host qua Nginx
- **Backend API**: Node.js/Express + PostgreSQL → chạy như Node.js app trên CloudPanel

---

## Mục lục

1. [Chuẩn bị local — Git & GitHub](#1-chuẩn-bị-local--git--github)
2. [Chuẩn bị CloudPanel](#2-chuẩn-bị-cloudpanel)
3. [Deploy API (Node.js)](#3-deploy-api-nodejs)
4. [Deploy Frontend (React)](#4-deploy-frontend-react)
5. [Cấu hình Nginx reverse proxy](#5-cấu-hình-nginx-reverse-proxy)
6. [Khởi tạo tài khoản Admin](#6-khởi-tạo-tài-khoản-admin)
7. [Cập nhật code sau này](#7-cập-nhật-code-sau-này)

---

## 1. Chuẩn bị local — Git & GitHub

### 1.1 Cài Git cho Windows (nếu chưa có)

Tải tại: https://git-scm.com/download/win  
Cài xong mở **Git Bash** hoặc dùng terminal trong VS Code.

### 1.2 Khởi tạo Git repo

Mở terminal tại thư mục dự án (`D:\AI\diadiemyeuthich`):

```bash
git init
git add .
git status          # kiểm tra file sẽ được commit (không được có file .env)
git commit -m "initial commit"
```

> ⚠️ **Kiểm tra kỹ** không có dòng nào chứa `.env` trong output của `git status` trước khi commit.

### 1.3 Tạo repository trên GitHub

1. Vào https://github.com → nhấn **New repository**
2. Tên repo: `diadiemyeuthich`
3. Chọn **Private** (khuyến nghị vì chứa cấu hình server)
4. **Không** tick "Add README", "Add .gitignore" — đã có rồi
5. Nhấn **Create repository**

### 1.4 Đẩy code lên GitHub

Sau khi tạo repo, GitHub hiện đoạn lệnh — chạy theo (thay `YOUR_USERNAME`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/diadiemyeuthich.git
git branch -M main
git push -u origin main
```

Lần đầu sẽ hỏi đăng nhập GitHub. Nếu dùng 2FA, tạo **Personal Access Token** tại:  
Settings → Developer settings → Personal access tokens → Generate new token  
Dùng token đó thay cho mật khẩu.

### 1.5 Kiểm tra

Vào `https://github.com/YOUR_USERNAME/diadiemyeuthich` — thấy code là thành công.  
Đảm bảo **không thấy** file `server/.env` trong repo.

---

## 2. Chuẩn bị CloudPanel

### 2.1 Tạo Database PostgreSQL

1. Đăng nhập CloudPanel → menu **Databases** → **Add Database**
2. Điền:
   - **Database Name**: `diadiemyeuthich`
   - **Database User**: `ddyt_user` (hoặc tên bất kỳ)
   - **Password**: tạo mật khẩu mạnh, **lưu lại**
3. Nhấn **Add Database**

> Ghi lại: `DB_HOST` (thường là `127.0.0.1`), `DB_PORT` (thường `5432`), `DB_NAME`, `DB_USER`, `DB_PASS`

### 2.2 Tạo Node.js Application (cho API)

1. CloudPanel → **Sites** → **Add Site** → **Node.js**
2. Điền:
   - **Domain**: `api.yourdomain.com` (subdomain riêng cho API)
   - **Node.js Version**: 20 (hoặc mới nhất)
   - **App Port**: `3001`
   - **Root Directory**: để trống hoặc `/`
3. Nhấn **Add Site**
4. Bật **SSL** → **Let's Encrypt** (chờ vài giây)

### 2.3 Tạo Static Site (cho Frontend)

1. CloudPanel → **Sites** → **Add Site** → **Static**  
   (hoặc **PHP** nếu không có Static)
2. Điền:
   - **Domain**: `yourdomain.com`
3. Nhấn **Add Site** → bật SSL

---

## 3. Deploy API (Node.js)

### 3.1 SSH vào server

```bash
ssh root@YOUR_SERVER_IP
# hoặc
ssh user@YOUR_SERVER_IP
```

> Dùng SSH Key nếu có. CloudPanel thường cấp SSH trong phần **Users**.

### 3.2 Clone repo về server

```bash
# Di chuyển vào thư mục home của site API
cd /home/clp/htdocs/api.yourdomain.com

# Clone repo (thay YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/diadiemyeuthich.git .

# Vào thư mục server
cd server
```

> Nếu repo Private, cần nhập GitHub credentials hoặc dùng SSH key của server.  
> Cách nhanh: tạo **Deploy Key** trong GitHub repo Settings → Deploy keys.

### 3.3 Cài dependencies

```bash
npm install --production
```

### 3.4 Tạo file .env

```bash
cp .env.example .env
nano .env
```

Điền đầy đủ thông tin:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=diadiemyeuthich
DB_USER=ddyt_user
DB_PASS=MAT_KHAU_CUA_BAN

# Tạo chuỗi ngẫu nhiên dài: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=DAN_CHUOI_NGAU_NHIEN_VIET_VAO_DAY_IT_NHAT_32_KY_TU

PORT=3001

# Domain frontend của bạn
ALLOWED_ORIGIN=https://yourdomain.com
```

Lưu file: `Ctrl+O` → Enter → `Ctrl+X`

### 3.5 Tạo bảng database

```bash
# Chạy schema.sql để tạo bảng
psql -h 127.0.0.1 -U ddyt_user -d diadiemyeuthich -f schema.sql
# Nhập DB_PASS khi được hỏi
```

> Nếu lỗi `psql: command not found`:
> ```bash
> sudo apt install postgresql-client -y
> ```

### 3.6 Seed dữ liệu mẫu (lần đầu)

```bash
node seed.js
# ✅ Seed xong! — là thành công
```

### 3.7 Cài PM2 và khởi động API

PM2 giữ Node.js chạy liên tục, tự restart khi server reboot:

```bash
# Cài PM2 global (chỉ cần cài 1 lần)
npm install -g pm2

# Khởi động API
pm2 start index.js --name "ddyt-api"

# Lưu cấu hình PM2 (tự chạy khi reboot)
pm2 save
pm2 startup     # chạy lệnh nó in ra (có dạng: sudo env PATH=...)
```

### 3.8 Kiểm tra API đang chạy

```bash
pm2 status          # thấy "online" là tốt
pm2 logs ddyt-api   # xem log realtime

# Test API
curl http://localhost:3001/api/health
# Kết quả: {"status":"ok","db":"connected",...}
```

---

## 4. Deploy Frontend (React)

### 4.1 Build trên máy local

Nếu API ở subdomain riêng (`api.yourdomain.com`), tạo file `.env.local` tại root dự án:

```bash
# File: D:\AI\diadiemyeuthich\.env.local
VITE_API_URL=https://api.yourdomain.com
```

Sau đó build:

```bash
cd D:\AI\diadiemyeuthich
npm run build
```

> Nếu API ở **cùng domain** và dùng Nginx proxy `/api` → `3001`, bỏ qua `.env.local`, không cần `VITE_API_URL`.

Thư mục `dist/` sẽ được tạo ra — đây là các file tĩnh cần upload.

### 4.2 Upload lên server

**Cách 1 — Dùng SCP (terminal):**

```bash
# Chạy trên máy Windows (Git Bash)
scp -r dist/* root@YOUR_SERVER_IP:/home/clp/htdocs/yourdomain.com/
```

**Cách 2 — Dùng FileZilla (giao diện đồ họa):**

1. Tải FileZilla: https://filezilla-project.org
2. Kết nối: Host = `YOUR_SERVER_IP`, Protocol = SFTP, Port = 22
3. Kéo thả toàn bộ nội dung thư mục `dist/` vào `/home/clp/htdocs/yourdomain.com/`

**Cách 3 — Build thẳng trên server (nếu server đủ RAM):**

```bash
# SSH vào server
cd /home/clp/htdocs/yourdomain.com
git clone https://github.com/YOUR_USERNAME/diadiemyeuthich.git .
npm install
VITE_API_URL=https://api.yourdomain.com npm run build

# Chuyển file build ra thư mục gốc
cp -r dist/* .
```

### 4.3 Cấu hình Nginx cho SPA (React Router)

React app cần Nginx trả về `index.html` cho mọi route:

```bash
# SSH vào server
nano /etc/nginx/sites-available/yourdomain.com.conf
```

Tìm block `location /` và sửa thành:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Reload Nginx:

```bash
nginx -t && systemctl reload nginx
```

---

## 5. Cấu hình Nginx reverse proxy

> Bước này cần nếu frontend (`yourdomain.com`) và API (`api.yourdomain.com`) dùng **cùng domain** với path `/api`.  
> **Bỏ qua** nếu bạn dùng 2 subdomain khác nhau.

Thêm vào file config Nginx của `yourdomain.com`:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # ... SSL config của CloudPanel giữ nguyên ...

    root /home/clp/htdocs/yourdomain.com;
    index index.html;

    # Proxy /api/* → Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
nginx -t && systemctl reload nginx
```

---

## 6. Khởi tạo tài khoản Admin

Chạy **1 lần duy nhất** sau khi deploy:

```bash
curl -X POST https://api.yourdomain.com/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"MatKhauManh123!"}'
```

Kết quả: `{"message":"Tạo tài khoản admin thành công"}`

> Endpoint `/setup` tự khóa sau khi tạo admin đầu tiên — không thể tạo thêm qua API.

Đăng nhập thử:

```bash
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"MatKhauManh123!"}'
# Kết quả: {"token":"eyJ...","username":"admin"}
```

---

## 7. Cập nhật code sau này

### Quy trình khi sửa code trên máy local

```bash
# 1. Sửa code, kiểm tra
npm run dev

# 2. Commit và push lên GitHub
git add .
git commit -m "mô tả thay đổi"
git push

# 3. Build frontend
npm run build

# 4. Upload dist/ lên server (chọn 1 cách ở Bước 4.2)
scp -r dist/* root@YOUR_SERVER_IP:/home/clp/htdocs/yourdomain.com/
```

### Cập nhật API trên server

```bash
# SSH vào server
ssh root@YOUR_SERVER_IP

cd /home/clp/htdocs/api.yourdomain.com/server
git pull origin main      # lấy code mới
npm install               # cài thêm package nếu có

pm2 restart ddyt-api      # restart API
pm2 logs ddyt-api         # kiểm tra log
```

### Các lệnh PM2 hữu ích

```bash
pm2 status                # xem trạng thái tất cả app
pm2 restart ddyt-api      # restart API
pm2 stop ddyt-api         # dừng API
pm2 logs ddyt-api         # xem log realtime
pm2 logs ddyt-api --lines 50   # xem 50 dòng log cuối
```

---

## Kiểm tra cuối

| Mục | URL | Kết quả mong đợi |
|-----|-----|-----------------|
| Frontend | `https://yourdomain.com` | Hiện app React |
| API health | `https://api.yourdomain.com/api/health` | `{"status":"ok","db":"connected"}` |
| Danh sách địa điểm | `https://api.yourdomain.com/api/places` | JSON array các địa điểm |
| Admin login | Tab Quản lý trong app | Form đăng nhập hiện ra |

---

## Xử lý sự cố thường gặp

**API không khởi động được:**
```bash
pm2 logs ddyt-api    # đọc lỗi
# Thường do: sai DB_PASS trong .env, PostgreSQL chưa chạy, PORT bị chiếm
```

**Lỗi kết nối database:**
```bash
psql -h 127.0.0.1 -U ddyt_user -d diadiemyeuthich
# Nếu vào được → DB OK, kiểm tra lại .env
```

**Frontend trắng trang hoặc 404:**
```bash
# Kiểm tra file index.html có trong thư mục root chưa
ls /home/clp/htdocs/yourdomain.com/index.html

# Kiểm tra cấu hình try_files trong Nginx
```

**CORS error trên trình duyệt:**
```bash
# Kiểm tra ALLOWED_ORIGIN trong server/.env
# Phải trùng chính xác với domain frontend, kể cả https://
ALLOWED_ORIGIN=https://yourdomain.com   # ✅ đúng
ALLOWED_ORIGIN=https://yourdomain.com/  # ❌ thừa dấu /
```
