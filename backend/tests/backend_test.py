"""RYPPL backend API tests — covers auth, products, promo, orders, employee flow."""
import os
import time
import random
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://dorm-grocery-now.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# --------------------------- Fixtures ---------------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def auth_headers(token):
    return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}


def login(session, phone, name=None):
    r = session.post(f"{API}/auth/send-otp", json={"phone": phone}, timeout=15)
    assert r.status_code == 200
    payload = {"phone": phone, "otp": "123456"}
    if name:
        payload["name"] = name
    r = session.post(f"{API}/auth/verify-otp", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    return data["access_token"], data["user"]


@pytest.fixture(scope="session")
def customer_auth(session):
    phone = f"+1555{random.randint(1000000, 9999999)}"
    token, user = login(session, phone, name="TEST Customer")
    return {"token": token, "user": user, "phone": phone}


@pytest.fixture(scope="session")
def packer_auth(session):
    token, user = login(session, "+15550000001")
    return {"token": token, "user": user}


@pytest.fixture(scope="session")
def runner_auth(session):
    token, user = login(session, "+15550000002")
    return {"token": token, "user": user}


# --------------------------- Auth ---------------------------
class TestAuth:
    def test_send_otp(self, session):
        r = session.post(f"{API}/auth/send-otp", json={"phone": "+15551234567"})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_verify_otp_invalid_length(self, session):
        r = session.post(f"{API}/auth/verify-otp", json={"phone": "+15550009999", "otp": "12345"})
        assert r.status_code == 400

    def test_verify_otp_non_digit(self, session):
        r = session.post(f"{API}/auth/verify-otp", json={"phone": "+15550009999", "otp": "abcdef"})
        assert r.status_code == 400

    def test_new_customer_created(self, session):
        phone = f"+1555{random.randint(1000000, 9999999)}"
        r = session.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": "654321", "name": "TEST Newbie"})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["role"] == "customer"
        assert data["user"]["sub_role"] is None
        assert data["user"]["referral_code"].startswith("RY")

    def test_packer_role(self, session):
        _, user = login(session, "+15550000001")
        assert user["role"] == "employee"
        assert user["sub_role"] == "packer"

    def test_runner_role(self, session):
        _, user = login(session, "+15550000002")
        assert user["role"] == "employee"
        assert user["sub_role"] == "runner"

    def test_me_endpoint(self, session, customer_auth):
        r = session.get(f"{API}/auth/me", headers=auth_headers(customer_auth["token"]))
        assert r.status_code == 200
        d = r.json()
        assert "points" in d
        assert "referral_code" in d
        assert "orders_count" in d
        assert d["orders_count"] >= 0

    def test_me_unauthorized(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)


# --------------------------- Products / Categories ---------------------------
class TestProducts:
    def test_categories(self, session):
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        assert all("key" in c and "icon" in c for c in data)

    def test_list_products(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_list_products_by_category(self, session):
        r = session.get(f"{API}/products", params={"category": "Drinks"})
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "Drinks"

    def test_list_products_search(self, session):
        r = session.get(f"{API}/products", params={"search": "cola"})
        assert r.status_code == 200
        results = r.json()
        assert len(results) >= 1
        assert any("cola" in p["name"].lower() for p in results)

    def test_trending(self, session):
        r = session.get(f"{API}/products/trending")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_get_product_by_id(self, session):
        r = session.get(f"{API}/products")
        pid = r.json()[0]["id"]
        r2 = session.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        assert r2.json()["id"] == pid

    def test_get_product_not_found(self, session):
        r = session.get(f"{API}/products/nonexistent-id")
        assert r.status_code == 404


# --------------------------- Promo ---------------------------
class TestPromo:
    def test_ryppl20(self, session):
        r = session.post(f"{API}/promo/validate", json={"code": "RYPPL20", "subtotal": 100.0})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["discount"] == 20.0

    def test_welcome5(self, session):
        r = session.post(f"{API}/promo/validate", json={"code": "WELCOME5", "subtotal": 20.0})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["discount"] == 5.0

    def test_snack10(self, session):
        r = session.post(f"{API}/promo/validate", json={"code": "SNACK10", "subtotal": 50.0})
        assert r.status_code == 200
        assert r.json()["discount"] == 5.0

    def test_invalid_promo(self, session):
        r = session.post(f"{API}/promo/validate", json={"code": "BOGUS", "subtotal": 10.0})
        assert r.status_code == 200
        assert r.json()["valid"] is False


# --------------------------- Orders ---------------------------
def _sample_order_body(session, tip=1.0, promo=None):
    products = session.get(f"{API}/products").json()[:2]
    items = [
        {"product_id": p["id"], "name": p["name"], "price": p["price"], "qty": 2, "image_url": p.get("image_url", "")}
        for p in products
    ]
    body = {
        "items": items,
        "tip": tip,
        "address": {"building": "Mason Hall", "room": "204", "x": 0.22, "y": 0.28},
        "payment_method": "Visa •••• 4242",
    }
    if promo:
        body["promo_code"] = promo
    return body, items


class TestOrders:
    def test_create_order_and_persist(self, session, customer_auth):
        body, items = _sample_order_body(session, tip=2.0, promo="RYPPL20")
        r = session.post(f"{API}/orders", headers=auth_headers(customer_auth["token"]), json=body)
        assert r.status_code == 200, r.text
        d = r.json()
        subtotal = round(sum(i["price"] * i["qty"] for i in items), 2)
        assert d["subtotal"] == subtotal
        assert d["discount"] == round(subtotal * 0.20, 2)
        assert d["delivery_fee"] == 1.99
        assert d["tip"] == 2.0
        assert d["total"] == round(subtotal - d["discount"] + 2.0 + 1.99, 2)
        assert d["status"] == "incoming"
        assert d["points_earned"] == int(subtotal)
        assert d["order_number"].startswith("RY")

        # GET verify persistence
        oid = d["id"]
        r2 = session.get(f"{API}/orders/{oid}", headers=auth_headers(customer_auth["token"]))
        assert r2.status_code == 200
        assert r2.json()["id"] == oid

    def test_list_my_orders(self, session, customer_auth):
        r = session.get(f"{API}/orders", headers=auth_headers(customer_auth["token"]))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_points_awarded(self, session, customer_auth):
        before = session.get(f"{API}/auth/me", headers=auth_headers(customer_auth["token"])).json()["points"]
        body, items = _sample_order_body(session)
        session.post(f"{API}/orders", headers=auth_headers(customer_auth["token"]), json=body)
        after = session.get(f"{API}/auth/me", headers=auth_headers(customer_auth["token"])).json()["points"]
        expected = int(round(sum(i["price"] * i["qty"] for i in items), 2))
        assert after - before >= expected - 1  # rounding tolerance


# --------------------------- Employee Flow ---------------------------
class TestEmployeeFlow:
    def test_queue_requires_employee(self, session, customer_auth):
        r = session.get(f"{API}/employee/queue", params={"role": "packer"}, headers=auth_headers(customer_auth["token"]))
        assert r.status_code == 403

    def test_packer_queue(self, session, packer_auth):
        r = session.get(f"{API}/employee/queue", params={"role": "packer"}, headers=auth_headers(packer_auth["token"]))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_runner_queue(self, session, runner_auth):
        r = session.get(f"{API}/employee/queue", params={"role": "runner"}, headers=auth_headers(runner_auth["token"]))
        assert r.status_code == 200

    def test_employee_map(self, session, packer_auth):
        r = session.get(f"{API}/employee/map", headers=auth_headers(packer_auth["token"]))
        assert r.status_code == 200
        for pin in r.json():
            assert pin["pin"] in ("green", "red", "blue", "gray")

    def test_full_lifecycle(self, session, customer_auth, packer_auth, runner_auth):
        # Create a fresh order for lifecycle
        body, _ = _sample_order_body(session)
        r = session.post(f"{API}/orders", headers=auth_headers(customer_auth["token"]), json=body)
        assert r.status_code == 200
        oid = r.json()["id"]
        assert r.json()["status"] == "incoming"

        ph = auth_headers(packer_auth["token"])
        rh = auth_headers(runner_auth["token"])

        # Packer claims
        r = session.post(f"{API}/orders/{oid}/claim", headers=ph, json={"as_role": "packer"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "claimed_packer"

        # Double-claim should 409
        r_dup = session.post(f"{API}/orders/{oid}/claim", headers=ph, json={"as_role": "packer"})
        assert r_dup.status_code == 409

        # Advance packing -> ready
        r = session.post(f"{API}/orders/{oid}/advance", headers=ph)
        assert r.status_code == 200 and r.json()["status"] == "packing"
        r = session.post(f"{API}/orders/{oid}/advance", headers=ph)
        assert r.status_code == 200 and r.json()["status"] == "ready"

        # Runner claims
        r = session.post(f"{API}/orders/{oid}/claim", headers=rh, json={"as_role": "runner"})
        assert r.status_code == 200 and r.json()["status"] == "claimed_runner"

        # Runner advances: in_bag -> on_road -> complete
        r = session.post(f"{API}/orders/{oid}/advance", headers=rh)
        assert r.status_code == 200 and r.json()["status"] == "in_bag"
        r = session.post(f"{API}/orders/{oid}/advance", headers=rh)
        assert r.status_code == 200 and r.json()["status"] == "on_road"

        # SMS confirm
        r = session.post(f"{API}/orders/{oid}/sms-confirm", headers=rh)
        assert r.status_code == 200
        assert "RYPPL" in r.json()["message"]

        r = session.post(f"{API}/orders/{oid}/advance", headers=rh)
        assert r.status_code == 200 and r.json()["status"] == "complete"

    def test_wrong_role_advance_forbidden(self, session, customer_auth, packer_auth, runner_auth):
        body, _ = _sample_order_body(session)
        r = session.post(f"{API}/orders", headers=auth_headers(customer_auth["token"]), json=body)
        oid = r.json()["id"]
        ph = auth_headers(packer_auth["token"])
        rh = auth_headers(runner_auth["token"])
        # Runner tries to claim before ready
        r = session.post(f"{API}/orders/{oid}/claim", headers=rh, json={"as_role": "runner"})
        assert r.status_code == 409
        # Packer advances after claim
        session.post(f"{API}/orders/{oid}/claim", headers=ph, json={"as_role": "packer"})
        # Runner tries to advance packer-owned order -> should fail
        r = session.post(f"{API}/orders/{oid}/advance", headers=rh)
        assert r.status_code == 400
