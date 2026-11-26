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


def test_name_only_login():
    first = client.post("/api/auth/login", json={"nama": "Ayu"}).json()
    second = client.post("/api/auth/login", json={"nama": "ayu"}).json()
    assert first["studentId"] == second["studentId"]
    assert first["nama"] == "Ayu"


def test_chat_guides_profit_step_by_step_without_api_key():
    headers = login()

    def ask(message, state=None):
        body = {"message": message}
        if state:
            body["state"] = state
        return client.post("/api/chat", json=body, headers=headers).json()

    step = ask("Modal Rp20.000, harga jual Rp25.000. Berapa untung?")
    assert step["state"]["phase"] == "bandingkan"
    assert "mana yang lebih besar" in step["reply"]
    assert "Rp5.000" not in step["reply"]

    step = ask("Harga jual lebih besar", step["state"])
    assert step["state"]["phase"] == "rumus"
    assert "rumus apa" in step["reply"]

    step = ask("Harga jual dikurangi harga beli", step["state"])
    assert step["state"]["phase"] == "hitung"
    assert "Rp25.000 − Rp20.000" in step["reply"]
    assert "Rp5.000" not in step["reply"]

    step = ask("5.000", step["state"])
    assert step["state"]["phase"] == "bukti"
    assert "Rp5.000" in step["reply"]
    assert "masuk akal" in step["reply"]


def test_chat_uses_scaffolded_hints_without_revealing_result():
    response = client.post(
        "/api/chat",
        json={
            "message": "3000",
            "state": {
                "phase": "hitung",
                "intent": "untung",
                "harga_beli": 20000,
                "harga_jual": 25000,
                "wants_percent": False,
                "hint_level": 0,
            },
        },
        headers=login(),
    ).json()
    assert response["state"]["phase"] == "hitung"
    assert response["state"]["hint_level"] == 1
    assert "Rp5.000" not in response["reply"]


def test_chat_guides_percentage_in_separate_steps():
    headers = login()

    def ask(message, state=None):
        body = {"message": message}
        if state:
            body["state"] = state
        return client.post("/api/chat", json=body, headers=headers).json()

    step = ask("Modal 20.000, harga jual 25.000. Berapa persen untung?")
    step = ask("Harga jual lebih besar", step["state"])
    step = ask("Harga jual dikurangi harga beli", step["state"])
    step = ask("5.000", step["state"])
    step = ask("Karena harga jual lebih besar daripada modal", step["state"])
    assert step["state"]["phase"] == "rumus_persen"

    step = ask("Untung dibagi harga beli lalu dikali 100", step["state"])
    assert step["state"]["phase"] == "hitung_persen"
    assert "Berapa persennya" in step["reply"]
    assert "25%" not in step["reply"]

    step = ask("25%", step["state"])
    assert step["state"]["phase"] == "bukti_persen"
    assert "25%" in step["reply"]
    assert "Mengapa harga beli" in step["reply"]


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
