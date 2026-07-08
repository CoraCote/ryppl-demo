from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
import jwt
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET_KEY"]
JWT_ALGO = os.environ["JWT_ALGORITHM"]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ryppl")


# ----------------------------- Helpers -----------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def gen_referral_code() -> str:
    return "RY" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_employee(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail="Employees only")
    return user


# ----------------------------- Models -----------------------------
class SendOtpReq(BaseModel):
    phone: str


class VerifyOtpReq(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    referral_code: Optional[str] = None


class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    qty: int
    image_url: str = ""


class AddressModel(BaseModel):
    building: str
    room: str
    x: float = 0.5
    y: float = 0.5


class CreateOrderReq(BaseModel):
    items: List[CartItem]
    tip: float = 0.0
    promo_code: Optional[str] = None
    address: AddressModel
    payment_method: str = "Visa •••• 4242"


class PromoValidateReq(BaseModel):
    code: str
    subtotal: float


class ClaimReq(BaseModel):
    as_role: str  # "packer" | "runner"


class UpdateProfileReq(BaseModel):
    name: Optional[str] = None


# ----------------------------- State Machine -----------------------------
PACKER_NEXT = {
    "claimed_packer": "packing",
    "packing": "ready",
}
RUNNER_NEXT = {
    "claimed_runner": "in_bag",
    "in_bag": "on_road",
    "on_road": "complete",
}

STATUS_LABELS = {
    "incoming": "Order Placed",
    "claimed_packer": "Claimed by Packer",
    "packing": "Packing",
    "ready": "Ready for Pickup",
    "claimed_runner": "Runner Assigned",
    "in_bag": "In the Bag",
    "on_road": "On the Way",
    "complete": "Delivered",
}


def pin_color_for(order: dict, user_id: str) -> str:
    s = order["status"]
    if s in ("incoming", "claimed_packer", "packing"):
        return "green"  # unpacked
    if s == "ready":
        return "red"  # packed, awaiting runner
    if s in ("claimed_runner", "in_bag", "on_road"):
        return "blue" if order.get("runner_id") == user_id else "red"
    return "gray"


# ----------------------------- Auth Routes -----------------------------
@api_router.get("/")
async def root():
    return {"message": "RYPPL API", "status": "ok"}


@api_router.post("/auth/send-otp")
async def send_otp(req: SendOtpReq):
    # Simulated OTP: any 6-digit code works.
    return {"ok": True, "message": "OTP sent", "dev_hint": "Enter any 6-digit code"}


@api_router.post("/auth/verify-otp")
async def verify_otp(req: VerifyOtpReq):
    if len(req.otp) != 6 or not req.otp.isdigit():
        raise HTTPException(status_code=400, detail="Enter a valid 6-digit code")

    user = await db.users.find_one({"phone": req.phone}, {"_id": 0})
    if not user:
        user = {
            "id": new_id(),
            "phone": req.phone,
            "name": req.name or "Student",
            "avatar_url": "",
            "role": "customer",
            "sub_role": None,
            "points": 0,
            "referral_code": gen_referral_code(),
            "referred_by": req.referral_code or None,
            "created_at": now_iso(),
        }
        await db.users.insert_one(user)
        user.pop("_id", None)

    token = create_token(user["id"], user["role"])
    return {"access_token": token, "token_type": "bearer", "user": _public_user(user)}


def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "phone": u["phone"],
        "name": u.get("name", ""),
        "avatar_url": u.get("avatar_url", ""),
        "role": u["role"],
        "sub_role": u.get("sub_role"),
        "points": u.get("points", 0),
        "referral_code": u.get("referral_code", ""),
    }


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    orders_count = await db.orders.count_documents({"customer_id": user["id"]})
    data = _public_user(user)
    data["orders_count"] = orders_count
    return data


@api_router.patch("/auth/me")
async def update_me(req: UpdateProfileReq, user: dict = Depends(get_current_user)):
    if req.name:
        await db.users.update_one({"id": user["id"]}, {"$set": {"name": req.name}})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return _public_user(fresh)


# ----------------------------- Products -----------------------------
@api_router.get("/products")
async def list_products(category: Optional[str] = None, search: Optional[str] = None):
    q: dict = {}
    if category and category.lower() != "all":
        q["category"] = category
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    products = await db.products.find(q, {"_id": 0}).to_list(500)
    return products


@api_router.get("/categories")
async def list_categories():
    return CATEGORIES


@api_router.get("/products/trending")
async def trending():
    products = await db.products.find({"trending": True}, {"_id": 0}).to_list(20)
    if not products:
        products = await db.products.find({}, {"_id": 0}).sort("rating", -1).to_list(8)
    return products


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ----------------------------- Promo -----------------------------
@api_router.post("/promo/validate")
async def validate_promo(req: PromoValidateReq):
    promo = await db.promo_codes.find_one(
        {"code": req.code.upper(), "active": True}, {"_id": 0}
    )
    if not promo:
        return {"valid": False, "discount": 0, "message": "Invalid or expired code"}
    if promo["discount_type"] == "percent":
        discount = round(req.subtotal * promo["amount"] / 100, 2)
    else:
        discount = min(promo["amount"], req.subtotal)
    return {
        "valid": True,
        "discount": discount,
        "code": promo["code"],
        "message": f"{promo['label']} applied",
    }


# ----------------------------- Orders (Customer) -----------------------------
CAMPUS_BUILDINGS = [
    {"name": "Mason Hall", "x": 0.22, "y": 0.28},
    {"name": "West Quad", "x": 0.70, "y": 0.20},
    {"name": "South Hall", "x": 0.30, "y": 0.70},
    {"name": "Bursley Hall", "x": 0.78, "y": 0.64},
    {"name": "The Union", "x": 0.50, "y": 0.46},
    {"name": "Markley Hall", "x": 0.16, "y": 0.56},
    {"name": "North Campus", "x": 0.84, "y": 0.40},
    {"name": "East Quad", "x": 0.44, "y": 0.82},
]


@api_router.post("/orders")
async def create_order(req: CreateOrderReq, user: dict = Depends(get_current_user)):
    subtotal = round(sum(i.price * i.qty for i in req.items), 2)
    discount = 0.0
    if req.promo_code:
        promo = await db.promo_codes.find_one(
            {"code": req.promo_code.upper(), "active": True}, {"_id": 0}
        )
        if promo:
            if promo["discount_type"] == "percent":
                discount = round(subtotal * promo["amount"] / 100, 2)
            else:
                discount = min(promo["amount"], subtotal)
    delivery_fee = 1.99
    total = round(subtotal - discount + req.tip + delivery_fee, 2)
    points_earned = int(subtotal)

    count = await db.orders.count_documents({})
    order = {
        "id": new_id(),
        "order_number": f"RY{1000 + count}",
        "customer_id": user["id"],
        "customer_name": user.get("name", "Student"),
        "customer_phone": user.get("phone", ""),
        "items": [i.dict() for i in req.items],
        "subtotal": subtotal,
        "discount": discount,
        "delivery_fee": delivery_fee,
        "tip": req.tip,
        "promo_code": req.promo_code,
        "total": total,
        "payment_method": req.payment_method,
        "address": req.address.dict(),
        "status": "incoming",
        "timeline": [{"status": "incoming", "at": now_iso()}],
        "packer_id": None,
        "packer_name": None,
        "runner_id": None,
        "runner_name": None,
        "points_earned": points_earned,
        "version": 0,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"points": points_earned}})
    order.pop("_id", None)
    return order


@api_router.get("/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    orders = (
        await db.orders.find({"customer_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(200)
    )
    return orders


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ----------------------------- Employee -----------------------------
@api_router.get("/employee/queue")
async def employee_queue(role: str, user: dict = Depends(require_employee)):
    if role == "packer":
        statuses = ["incoming", "claimed_packer", "packing"]
    else:
        statuses = ["ready", "claimed_runner", "in_bag", "on_road"]
    orders = (
        await db.orders.find({"status": {"$in": statuses}}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(200)
    )
    return orders


@api_router.get("/employee/map")
async def employee_map(user: dict = Depends(require_employee)):
    orders = await db.orders.find(
        {"status": {"$ne": "complete"}}, {"_id": 0}
    ).to_list(200)
    result = []
    for o in orders:
        result.append(
            {
                "id": o["id"],
                "order_number": o["order_number"],
                "status": o["status"],
                "status_label": STATUS_LABELS.get(o["status"], o["status"]),
                "address": o["address"],
                "item_count": sum(i["qty"] for i in o["items"]),
                "total": o["total"],
                "pin": pin_color_for(o, user["id"]),
                "runner_id": o.get("runner_id"),
                "packer_id": o.get("packer_id"),
            }
        )
    return result


@api_router.post("/orders/{order_id}/claim")
async def claim_order(
    order_id: str, req: ClaimReq, user: dict = Depends(require_employee)
):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if req.as_role == "packer":
        expected = "incoming"
        update = {
            "status": "claimed_packer",
            "packer_id": user["id"],
            "packer_name": user.get("name"),
        }
    elif req.as_role == "runner":
        expected = "ready"
        update = {
            "status": "claimed_runner",
            "runner_id": user["id"],
            "runner_name": user.get("name"),
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Optimistic lock: only claim if still in the expected state.
    version = order["version"]
    update["updated_at"] = now_iso()
    res = await db.orders.update_one(
        {"id": order_id, "status": expected, "version": version},
        {
            "$set": update,
            "$inc": {"version": 1},
            "$push": {"timeline": {"status": update["status"], "at": now_iso()}},
        },
    )
    if res.modified_count == 0:
        raise HTTPException(
            status_code=409, detail="Order already claimed by someone else"
        )
    fresh = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return fresh


@api_router.post("/orders/{order_id}/advance")
async def advance_order(order_id: str, user: dict = Depends(require_employee)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    cur = order["status"]
    sub_role = user.get("sub_role")

    if cur in PACKER_NEXT and sub_role == "packer" and order.get("packer_id") == user["id"]:
        nxt = PACKER_NEXT[cur]
    elif cur in RUNNER_NEXT and sub_role == "runner" and order.get("runner_id") == user["id"]:
        nxt = RUNNER_NEXT[cur]
    else:
        raise HTTPException(status_code=400, detail="Cannot advance this order")

    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"status": nxt, "updated_at": now_iso()},
            "$inc": {"version": 1},
            "$push": {"timeline": {"status": nxt, "at": now_iso()}},
        },
    )
    fresh = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return fresh


@api_router.post("/orders/{order_id}/sms-confirm")
async def sms_confirm(order_id: str, user: dict = Depends(require_employee)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    addr = order["address"]
    msg = (
        f"Hey {order['customer_name']}! Your RYPPL order {order['order_number']} "
        f"is here at {addr['building']} Room {addr['room']}. Come grab your snacks! 🎉"
    )
    # Simulated SMS (no Twilio). Record it on the order.
    await db.orders.update_one(
        {"id": order_id}, {"$set": {"sms_sent": True, "sms_message": msg}}
    )
    return {"ok": True, "message": msg}


# ----------------------------- Seed -----------------------------
CATEGORIES = [
    {"key": "Drinks", "icon": "cafe"},
    {"key": "Energy", "icon": "flash"},
    {"key": "Ice Cream", "icon": "ice-cream"},
    {"key": "Candy", "icon": "gift"},
    {"key": "Snacks", "icon": "fast-food"},
    {"key": "Sweets", "icon": "heart"},
    {"key": "Meals", "icon": "restaurant"},
    {"key": "Fruits", "icon": "nutrition"},
    {"key": "Personal", "icon": "sparkles"},
    {"key": "House", "icon": "home"},
]

SEED_PRODUCTS = [
    ("Coca-Cola Classic", "Drinks", 1.99, "20 oz", "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500", 4.8, True),
    ("Sparkling Water", "Drinks", 1.49, "16 oz", "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=500", 4.5, False),
    ("Orange Juice", "Drinks", 2.99, "12 oz", "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500", 4.6, False),
    ("Iced Coffee", "Drinks", 3.49, "16 oz", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", 4.7, True),
    ("Red Bull", "Energy", 2.99, "8.4 oz", "https://images.unsplash.com/photo-1613214150384-4a3c1f3f0c3f?w=500", 4.4, True),
    ("Monster Energy", "Energy", 3.29, "16 oz", "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=500", 4.3, False),
    ("Celsius Sparkling", "Energy", 2.79, "12 oz", "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500", 4.6, True),
    ("Ben & Jerry's", "Ice Cream", 5.99, "1 pint", "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500", 4.9, True),
    ("Ice Cream Sandwich", "Ice Cream", 2.49, "1 ct", "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=500", 4.5, False),
    ("Popsicle Pack", "Ice Cream", 3.99, "6 ct", "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500", 4.2, False),
    ("Skittles", "Candy", 1.79, "2.17 oz", "https://images.unsplash.com/photo-1581798459219-306e0f5d1b6f?w=500", 4.6, True),
    ("M&M's Peanut", "Candy", 1.99, "1.74 oz", "https://images.unsplash.com/photo-1571506165871-ee72a35bc9d9?w=500", 4.7, False),
    ("Sour Patch Kids", "Candy", 2.29, "3.5 oz", "https://images.unsplash.com/photo-1600359756098-8bc52195bbf4?w=500", 4.8, True),
    ("Doritos Nacho", "Snacks", 2.49, "9.25 oz", "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=500", 4.7, True),
    ("Lay's Classic", "Snacks", 2.29, "8 oz", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500", 4.5, False),
    ("Pretzels", "Snacks", 1.99, "6 oz", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", 4.3, False),
    ("Cheez-It", "Snacks", 2.79, "7 oz", "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500", 4.6, False),
    ("Chocolate Chip Cookies", "Sweets", 3.49, "6 ct", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500", 4.8, True),
    ("Glazed Donuts", "Sweets", 4.29, "4 ct", "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", 4.7, False),
    ("Brownie Bites", "Sweets", 3.99, "8 ct", "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500", 4.6, False),
    ("Chicken Ramen", "Meals", 3.99, "1 bowl", "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=500", 4.5, True),
    ("Mac & Cheese Cup", "Meals", 2.99, "2.4 oz", "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=500", 4.4, False),
    ("Turkey Sandwich", "Meals", 6.49, "1 ct", "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=500", 4.6, False),
    ("Banana", "Fruits", 0.79, "1 ct", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500", 4.5, False),
    ("Apple", "Fruits", 0.99, "1 ct", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500", 4.6, False),
    ("Strawberries", "Fruits", 4.99, "1 lb", "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500", 4.8, True),
    ("Toothpaste", "Personal", 3.99, "4.6 oz", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500", 4.4, False),
    ("Hand Sanitizer", "Personal", 2.49, "8 oz", "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500", 4.5, False),
    ("Advil", "Personal", 6.99, "24 ct", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500", 4.7, False),
    ("Paper Towels", "House", 4.99, "2 rolls", "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=500", 4.3, False),
    ("Dish Soap", "House", 3.49, "16 oz", "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500", 4.2, False),
    ("Trash Bags", "House", 5.49, "20 ct", "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500", 4.4, False),
]

SEED_PROMOS = [
    {"code": "WELCOME5", "discount_type": "flat", "amount": 5.0, "label": "$5 off your order", "active": True, "usage_limit": 0, "used_count": 0},
    {"code": "RYPPL20", "discount_type": "percent", "amount": 20.0, "label": "20% off", "active": True, "usage_limit": 0, "used_count": 0},
    {"code": "SNACK10", "discount_type": "percent", "amount": 10.0, "label": "10% off snacks", "active": True, "usage_limit": 0, "used_count": 0},
]

SEED_EMPLOYEES = [
    {"phone": "+15550000001", "name": "Alex Packer", "sub_role": "packer"},
    {"phone": "+15550000002", "name": "Sam Runner", "sub_role": "runner"},
]


async def seed():
    if await db.products.count_documents({}) == 0:
        docs = []
        for idx, (name, cat, price, weight, img, rating, trending) in enumerate(SEED_PRODUCTS):
            docs.append(
                {
                    "id": new_id(),
                    "name": name,
                    "description": f"Fresh {name.lower()} delivered fast to your dorm. A campus favorite you can rely on any time of day.",
                    "price": price,
                    "weight": weight,
                    "category": cat,
                    "image_url": img,
                    "in_stock": True,
                    "rating": rating,
                    "sizes": ["Regular", "Large"] if cat in ("Drinks", "Energy", "Meals") else [],
                    "trending": trending,
                    "created_at": now_iso(),
                }
            )
        await db.products.insert_many(docs)
        logger.info("Seeded %d products", len(docs))

    if await db.promo_codes.count_documents({}) == 0:
        await db.promo_codes.insert_many([{**p, "id": new_id()} for p in SEED_PROMOS])
        logger.info("Seeded promo codes")

    for emp in SEED_EMPLOYEES:
        existing = await db.users.find_one({"phone": emp["phone"]})
        if not existing:
            await db.users.insert_one(
                {
                    "id": new_id(),
                    "phone": emp["phone"],
                    "name": emp["name"],
                    "avatar_url": "",
                    "role": "employee",
                    "sub_role": emp["sub_role"],
                    "points": 0,
                    "referral_code": gen_referral_code(),
                    "referred_by": None,
                    "created_at": now_iso(),
                }
            )
    logger.info("Seed complete")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
