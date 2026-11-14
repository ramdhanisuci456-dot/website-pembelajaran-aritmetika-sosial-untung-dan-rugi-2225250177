from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Student(Base):
    """Identitas siswa digunakan untuk mengaitkan progres belajar."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str | None] = mapped_column(String(12), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(60))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Attempt(Base):
    """Satu kali menyelesaikan satu soal."""

    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    question_id: Mapped[str] = mapped_column(String(32), index=True)
    level: Mapped[int] = mapped_column(Integer)
    steps_total: Mapped[int] = mapped_column(Integer)
    first_try: Mapped[int] = mapped_column(Integer)  # langkah benar pada percobaan pertama
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MateriDone(Base):
    __tablename__ = "materi_done"
    __table_args__ = (UniqueConstraint("student_id", "card_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    card_id: Mapped[str] = mapped_column(String(32))
