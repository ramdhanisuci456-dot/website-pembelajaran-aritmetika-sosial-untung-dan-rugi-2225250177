import base64
import hashlib
import hmac
import os
import re
import secrets
import time
from typing import Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .content import PASS_RATIO, QUESTION_INDEX, QUESTIONS, SKOR_MAKS_SOAL, content_payload
from .database import Base, engine, get_db, migrate_student_name
from .models import Attempt, MateriDone, Student
from .tutor import local_tutor_reply

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-ubah-di-produksi").encode()
TOKEN_TTL = 60 * 60 * 24 * 14  # 14 hari
ALLOWED_CODES = {c.strip().upper() for c in os.getenv("ALLOWED_CODES", "").split(",") if c.strip()}
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
Base.metadata.create_all(bind=engine)
migrate_student_name()

app = FastAPI(title="Untung Rugi API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- token sederhana (HMAC) ----------
def make_token(student_id: int) -> str:
    payload = base64.urlsafe_b64encode(f"{student_id}:{int(time.time()) + TOKEN_TTL}".encode()).decode()
    sig = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def read_token(token: str) -> int:
    try:
        payload, sig = token.split(".")
        expected = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError
        sid, exp = base64.urlsafe_b64decode(payload.encode()).decode().split(":")
        if int(exp) < time.time():
            raise ValueError
        return int(sid)
    except Exception:
        raise HTTPException(status_code=401, detail="Sesi habis. Silakan masuk lagi.")


def current_student(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> Student:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Silakan masuk dulu.")
    student = db.get(Student, read_token(authorization[7:]))
    if not student:
        raise HTTPException(status_code=401, detail="Akun tidak ditemukan.")
    return student


# ---------- kemajuan belajar ----------
def build_progress(db: Session, student: Student) -> dict:
    """Skor terbaik per soal (0-6, 1 poin per tahap benar pada percobaan pertama)."""
    best: dict[str, int] = {}
    for a in db.query(Attempt).filter(Attempt.student_id == student.id).all():
        best[a.question_id] = max(best.get(a.question_id, 0), a.first_try)
    soal = [
        {"id": q["id"], "best": best.get(q["id"]), "max": SKOR_MAKS_SOAL,
         "dikuasai": best.get(q["id"], 0) >= round(PASS_RATIO * SKOR_MAKS_SOAL)}
        for q in QUESTIONS
    ]
    materi = [m.card_id for m in db.query(MateriDone).filter(MateriDone.student_id == student.id).all()]
    return {
        "soal": soal,
        "total_best": sum(x["best"] or 0 for x in soal),
        "total_max": SKOR_MAKS_SOAL * len(QUESTIONS),
        "materi_done": materi,
    }


# ---------- skema ----------
class LoginIn(BaseModel):
    nama: str = Field(min_length=1, max_length=60)
    kode_siswa: str = Field(default="", max_length=12)


class AttemptIn(BaseModel):
    question_id: str
    first_try: int = Field(ge=0)  # jumlah tahap benar pada percobaan pertama (skor 0-6)
    hints_used: int = Field(ge=0, default=0)


class ChatTurn(BaseModel):
    role: Literal["user", "model"]
    text: str = Field(min_length=1, max_length=2000)


class TutorState(BaseModel):
    phase: Literal[
        "awal", "identifikasi", "bandingkan", "rumus", "hitung", "bukti",
        "rumus_persen", "hitung_persen", "bukti_persen", "refleksi",
    ] = "awal"
    intent: Literal["untung", "rugi", "impas"] = "untung"
    harga_beli: int | None = Field(default=None, ge=0, le=1_000_000_000_000)
    harga_jual: int | None = Field(default=None, ge=0, le=1_000_000_000_000)
    wants_percent: bool = False
    hint_level: int = Field(default=0, ge=0, le=3)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)
    state: TutorState = Field(default_factory=TutorState)


# ---------- endpoint ----------
@app.get("/")
def root():
    return {"status": "ok", "message": "API aktif. Gunakan /api/health atau frontend di port 5173."}


@app.get("/api")
def api_root():
    return {"status": "ok", "message": "Gunakan endpoint /api/health, /api/auth/login, /api/content, /api/me, /api/attempts, /api/materi/<id>/done."}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(body: ChatIn, _: Student = Depends(current_student)):
    state = {
        "phase": body.state.phase,
        "intent": body.state.intent,
        "harga_beli": body.state.harga_beli,
        "harga_jual": body.state.harga_jual,
        "wants_percent": body.state.wants_percent,
        "hint_level": body.state.hint_level,
    }
    return local_tutor_reply(body.message, state)


@app.post("/api/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    name = body.nama.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Nama tidak boleh kosong.")
    code = body.kode_siswa.strip().upper()
    if code:
        if not re.fullmatch(r"[A-Z0-9]{3,12}", code):
            raise HTTPException(status_code=422, detail="Kode siswa hanya boleh huruf dan angka (3-12 karakter).")
        if ALLOWED_CODES and code not in ALLOWED_CODES:
            raise HTTPException(status_code=403, detail="Kode siswa tidak dikenal. Tanyakan ke gurumu.")
        student = db.query(Student).filter(Student.code == code).first()
    else:
        student = db.query(Student).filter(Student.name.ilike(name)).first()
    if not student:
        if not code:
            code = f"N{secrets.token_hex(5).upper()}"
            code = code[:12]
        student = Student(code=code, name=name)
        db.add(student)
        db.commit()
        db.refresh(student)
    elif student.name is None:
        student.name = name
        db.commit()
    elif student.name.casefold() != name.casefold():
        raise HTTPException(status_code=409, detail="Nama tidak cocok dengan kode siswa ini.")
    return {"token": make_token(student.id), "studentId": student.id, "kode": student.code, "nama": student.name}


@app.get("/api/content")
def get_content(_: Student = Depends(current_student)):
    return content_payload()


@app.get("/api/me")
def me(student: Student = Depends(current_student), db: Session = Depends(get_db)):
    return {"kode": student.code, "nama": student.name, "progress": build_progress(db, student)}


@app.post("/api/attempts")
def save_attempt(body: AttemptIn, student: Student = Depends(current_student), db: Session = Depends(get_db)):
    q = QUESTION_INDEX.get(body.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan.")
    db.add(Attempt(
        student_id=student.id, question_id=q["id"], level=q["no"],
        steps_total=q["steps_total"], first_try=min(body.first_try, q["steps_total"]),
        hints_used=body.hints_used,
    ))
    db.commit()
    return build_progress(db, student)


@app.post("/api/materi/{card_id}/done")
def materi_done(card_id: str, student: Student = Depends(current_student), db: Session = Depends(get_db)):
    exists = db.query(MateriDone).filter_by(student_id=student.id, card_id=card_id).first()
    if not exists:
        db.add(MateriDone(student_id=student.id, card_id=card_id))
        db.commit()
    return build_progress(db, student)
