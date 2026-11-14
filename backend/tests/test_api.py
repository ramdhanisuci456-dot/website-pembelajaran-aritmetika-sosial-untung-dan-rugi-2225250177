import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.gettempdir()}/alpro_test.db"
if os.path.exists(f"{tempfile.gettempdir()}/alpro_test.db"):
    os.remove(f"{tempfile.gettempdir()}/alpro_test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def login(code="S01", name="Siswa Contoh"):
    r = client.post("/api/auth/login", json={"nama": name, "kode_siswa": code})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_login_and_content():
    h = login()
    assert client.get("/api/content").status_code == 401
    c = client.get("/api/content", headers=h).json()
    assert len(c["questions"]) == 4 and c["skor_maks"] == 24


def test_bad_code():
    assert client.post("/api/auth/login", json={"nama": "Siswa", "kode_siswa": "a b!"}).status_code == 422


def test_login_saves_name_and_rejects_mismatch():
    h = login("S04", "Nadia")
    me = client.get("/api/me", headers=h).json()
    assert me["nama"] == "Nadia"
    assert client.post("/api/auth/login", json={"nama": "Rani", "kode_siswa": "S04"}).status_code == 409


def test_skor_per_soal():
    h = login("S02")
    p = client.get("/api/me", headers=h).json()["progress"]
    assert p["total_max"] == 24 and p["total_best"] == 0
    client.post("/api/attempts", json={"question_id": "q1", "first_try": 3}, headers=h)
    r = client.post("/api/attempts", json={"question_id": "q1", "first_try": 5}, headers=h).json()
    assert r["soal"][0]["best"] == 5 and r["soal"][0]["dikuasai"] and r["total_best"] == 5
    assert client.post("/api/attempts", json={"question_id": "zzz", "first_try": 1}, headers=h).status_code == 404


def test_materi_done():
    h = login("S03")
    r = client.post("/api/materi/m1/done", headers=h)
    assert r.json()["materi_done"] == ["m1"]
