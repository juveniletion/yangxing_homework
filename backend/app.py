import os
import random
import string
from datetime import datetime, timedelta, timezone

from flask import (
    Flask,
    jsonify,
    request,
    session,
    send_from_directory,
)
from flask_cors import CORS
from flask_login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

# 配置应用
app = Flask(__name__)
app.secret_key = os.environ.get("APP_SECRET_KEY", "dev-secret-key")

# 启用 CORS 允许前端跨域请求 (React 默认端口通常与 Flask 不同)
CORS(app, supports_credentials=True)

# 数据库配置
db_user = os.environ.get("DB_USER", "yang")
db_password = os.environ.get("DB_PASSWORD", "mm2006515070910")
db_host = os.environ.get("DB_HOST", "127.0.0.1")
db_name = os.environ.get("DB_NAME", "website_db")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}?charset=utf8mb4"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# 邮件配置
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "smtp.example.com")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 465))
app.config["MAIL_USE_SSL"] = os.environ.get("MAIL_USE_SSL", "true") == "true"
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "noreply@example.com")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "your-mail-password")
app.config["MAIL_DEFAULT_SENDER"] = app.config["MAIL_USERNAME"]

# 文件上传配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}

db = SQLAlchemy(app)
login_manager = LoginManager(app)
mail = Mail(app)


# 工具函数
def generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# 数据模型
class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default="user")  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def is_admin(self) -> bool:
        return self.role == "admin"

    # 序列化为字典供 JSON 使用
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role
        }


class Article(db.Model):
    __tablename__ = "articles"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="domestic")  # 新增分类字段
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    attachment = db.Column(db.String(255))

    # 关联查询作者
    author = db.relationship("User", backref="articles")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "author_id": self.author_id,
            "author_name": self.author.username if self.author else "Unknown",
            "attachment": self.attachment,
            "created_at": self.created_at.isoformat()
        }


class EmailCode(db.Model):
    __tablename__ = "email_codes"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


def send_email_code(email: str, code: str) -> None:
    # 实际项目中请确保邮件服务器配置正确
    try:
        msg = Message(subject="MedCore 验证码", recipients=[email])
        msg.body = f"您的验证码是 {code}，10分钟内有效。"
        mail.send(msg)
    except Exception as e:
        print(f"邮件发送模拟失败 (开发环境): {e}")


# =======================
# API 路由接口
# =======================

# 获取当前登录用户信息
@app.route("/api/me")
def api_me():
    if current_user.is_authenticated:
        return jsonify({"success": True, "data": current_user.to_dict()})
    return jsonify({"success": False, "data": None})


# 注册接口
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "用户名已存在"})
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "邮箱已注册"})

    code = generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # 清理旧验证码
    EmailCode.query.filter_by(email=email).delete()
    db.session.add(EmailCode(email=email, code=code, expires_at=expires_at))
    db.session.commit()

    # 暂存用户信息 (生产环境建议存 Redis，这里简化存 Session)
    session["pending_user"] = {
        "username": username,
        "email": email,
        "password": password
    }

    send_email_code(email, code)
    print(f"DEBUG: {email} 的验证码是 {code}")  # 控制台打印方便测试

    return jsonify({"success": True, "message": "验证码已发送"})


# 验证码验证与完成注册
@app.route("/api/verify", methods=["POST"])
def api_verify():
    data = request.json
    email = data.get("email")
    code = data.get("code")
    pending = session.get("pending_user")

    if not pending or pending["email"] != email:
        return jsonify({"success": False, "message": "注册会话已失效"})

    record = (
        EmailCode.query.filter_by(email=email, code=code)
        .order_by(EmailCode.created_at.desc())
        .first()
    )

    if not record or record.expires_at < datetime.now(timezone.utc):
        return jsonify({"success": False, "message": "验证码错误或过期"})

    user = User(
        username=pending["username"],
        email=pending["email"],
        role="user"
    )
    user.set_password(pending["password"])
    db.session.add(user)
    db.session.delete(record)
    db.session.commit()
    session.pop("pending_user", None)

    return jsonify({"success": True, "message": "注册成功"})


# 登录
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        login_user(user)
        return jsonify({"success": True, "data": user.to_dict()})

    return jsonify({"success": False, "message": "邮箱或密码错误"})


# 登出
@app.route("/api/logout")
@login_required
def api_logout():
    logout_user()
    return jsonify({"success": True})


# 获取文章列表 (支持分类筛选)
@app.route("/api/articles")
def api_articles():
    category = request.args.get("category")
    query = Article.query
    if category:
        query = query.filter_by(category=category)

    # 按时间倒序
    articles = query.order_by(Article.created_at.desc()).limit(20).all()
    return jsonify({"success": True, "data": [a.to_dict() for a in articles]})


# 获取文章详情
@app.route("/api/article/<int:article_id>")
def api_article_detail(article_id):
    article = db.session.get(Article, article_id)
    if article:
        return jsonify({"success": True, "data": article.to_dict()})
    return jsonify({"success": False, "message": "文章不存在"}), 404


# 管理员发布文章
@app.route("/api/admin/article/new", methods=["POST"])
@login_required
def api_create_article():
    if not current_user.is_admin():
        return jsonify({"success": False, "message": "无权操作"}), 403

    title = request.form.get("title")
    content = request.form.get("content")
    category = request.form.get("category", "domestic")

    attachment_path = None
    file = request.files.get("attachment")
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)
        attachment_path = filename

    article = Article(
        title=title,
        content=content,
        category=category,
        author_id=current_user.id,
        attachment=attachment_path
    )
    db.session.add(article)
    db.session.commit()

    return jsonify({"success": True})


# 静态文件服务 (附件下载)
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


import os  # 确保在文件顶部也导出了 os

if __name__ == "__main__":
    # 1. 确保在程序启动时创建数据库表（如果表不存在）
    with app.app_context():
        db.create_all()
    
    # 2. 从环境变量中读取端口，如果没有读取到则默认使用 5000
    # 这对于 Zeabur、Northflank、Render 等平台是必须的
    port = int(os.environ.get("PORT", 5000))
    
    # 3. 监听 0.0.0.0 以允许外部访问
    app.run(host="0.0.0.0", port=port)