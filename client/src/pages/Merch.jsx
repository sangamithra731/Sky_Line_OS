import { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Copy,
  Phone,
  Upload,
  Image as ImgIcon,
  QrCode,
  Download,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

const STATUS_STYLES = {
  pending: "badge-warning",
  paid: "badge-success",
  rejected: "badge-danger",
  refunded: "badge-info",
};

export default function Merch() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isMember = user?.duesPaid && user?.membershipStatus === "active";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [view, setView] = useState("shop"); // shop | my-orders
  const [search, setSearch] = useState("");

  // Buy flow
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Admin add product
  const [showAddProduct, setShowAddProduct] = useState(false);

  const load = () => {
    API.get("/products").then((r) => {
      setProducts(r.data);
      setLoading(false);
    });
    API.get("/auth/payment-info").then((r) => setPaymentInfo(r.data));
  };

  const loadMyOrders = () => {
    if (!user) return;
    API.get("/orders/my").then((r) => setMyOrders(r.data));
  };

  useEffect(() => {
    load();
    loadMyOrders();
  }, [user]);

  // ============ CART ============
  const addToCart = (product, size) => {
    const price = isMember ? product.memberPrice ?? product.price : product.price;
    const existing = cart.find(
      (c) => c.productId === product._id && c.size === size
    );
    if (existing) {
      setCart(
        cart.map((c) =>
          c.productId === product._id && c.size === size
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          size,
          quantity: 1,
          price,
          image: product.image,
        },
      ]);
    }
    toast.success(`${product.name} (${size}) added`);
    setCartOpen(true);
  };

  const removeItem = (i) => setCart(cart.filter((_, idx) => idx !== i));
  const updateQty = (i, delta) =>
    setCart(
      cart.map((c, idx) =>
        idx === i ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
      )
    );

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  // ============ CREATE ORDER ============
  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      const items = cart.map((c) => ({
        productId: c.productId,
        size: c.size,
        quantity: c.quantity,
      }));
      const { data } = await API.post("/orders", { items });
      setCreatedOrder(data);
      setCart([]);
      setCartOpen(false);
      toast.success("Order reserved! Complete payment.");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Checkout failed");
    }
  };

  // ============ SUBMIT PAYMENT ============
  const submitPayment = async () => {
    if (!createdOrder) return;
    setSubmitting(true);
    try {
      if (proofFile) {
        const fd = new FormData();
        fd.append("image", proofFile);
        fd.append("folder", "skyline-merch-proofs");
        const { data: up } = await API.post("/upload/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await API.post(`/orders/${createdOrder._id}/proof`, {
          proofUrl: up.url,
        });
      }
      await API.post(`/orders/${createdOrder._id}/submit-payment`, {
        paymentNote: paymentNote || "Paid via UPI",
      });
      toast.success("✅ Payment submitted! Waiting for admin.");
      setCreatedOrder(null);
      setProofFile(null);
      setPaymentNote("");
      loadMyOrders();
      setView("my-orders");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // ============ RECEIPT PDF ============
  const downloadReceipt = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Skyline Student Association", 14, 20);
    doc.setFontSize(12);
    doc.text("Merch Receipt", 14, 28);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(11);
    doc.text(`Name: ${user?.name}`, 14, 44);
    doc.text(`Email: ${user?.email}`, 14, 52);
    doc.text(`Reference: ${order.referenceId || "—"}`, 14, 60);
    doc.text(
      `Date: ${format(new Date(order.createdAt), "PPP")}`,
      14,
      68
    );
    doc.line(14, 76, 196, 76);
    doc.text("Items:", 14, 84);

    let y = 92;
    order.items.forEach((it) => {
      doc.text(
        `${it.name} (${it.size}) × ${it.quantity}`,
        20,
        y
      );
      doc.text(`$${(it.price * it.quantity).toFixed(2)}`, 175, y);
      y += 8;
    });

    doc.line(14, y + 2, 196, y + 2);
    doc.setFontSize(13);
    doc.text(`Total: $${order.total.toFixed(2)}`, 20, y + 12);
    doc.setFontSize(10);
    doc.text(`Status: ${order.paymentStatus.toUpperCase()}`, 20, y + 22);

    doc.save(`skyline-merch-${order.referenceId || order._id.slice(-6)}.pdf`);
    toast.success("Receipt downloaded!");
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Merch Store
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isMember
              ? "🎉 Member discount applied automatically"
              : "Become a member to unlock discounts"}
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Add Product
            </button>
          )}
          <button
            onClick={() => setView(view === "shop" ? "my-orders" : "shop")}
            className="btn-secondary flex items-center gap-2"
          >
            <Package size={16} />
            {view === "shop" ? "My Orders" : "Shop"}
            {view === "shop" && myOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px]">
                {myOrders.length}
              </span>
            )}
          </button>
          {view === "shop" && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative btn-secondary flex items-center gap-2"
            >
              <ShoppingBag size={16} />
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SHOP VIEW */}
      {view === "shop" && (
        <>
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merch..."
              className="input pl-9"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((p) => (
              <div key={p._id} className="card animate-fade-in overflow-hidden !p-0">
                <div className="aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ShoppingBag size={48} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
                      ${isMember ? p.memberPrice ?? p.price : p.price}
                    </span>
                    {isMember && p.memberPrice < p.price && (
                      <span className="text-sm text-slate-400 line-through">
                        ${p.price}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Select size:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.sizes.map((s) => {
                      const stock = p.stock?.get?.(s) ?? p.stock?.[s] ?? 0;
                      return (
                        <button
                          key={s}
                          disabled={stock === 0}
                          onClick={() => addToCart(p, s)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                            stock === 0
                              ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 hover:text-brand-700"
                          }`}
                        >
                          {s} {stock > 0 && `(${stock})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="card text-center py-16">
              <ShoppingBag
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              />
              <p className="text-slate-500 dark:text-slate-400">
                No products found
              </p>
            </div>
          )}
        </>
      )}

      {/* MY ORDERS VIEW */}
      {view === "my-orders" && (
        <>
          {myOrders.length === 0 ? (
            <div className="card text-center py-16">
              <Package
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              />
              <p className="text-slate-500 dark:text-slate-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((o) => (
                <div key={o._id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Order #{o.referenceId}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(o.createdAt), "PPP · h:mm a")}
                      </p>
                    </div>
                    <span className={STATUS_STYLES[o.paymentStatus]}>
                      {o.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Items list */}
                    <div className="md:col-span-2 space-y-2">
                      {o.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                        >
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                              {it.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Size {it.size} · Qty {it.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                            ${(it.price * it.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Total
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white text-lg">
                          ${o.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* QR + receipt */}
                    <div className="text-center">
                      {o.paymentStatus === "paid" && o.qrCode ? (
                        <>
                          <img
                            src={o.qrCode}
                            alt="QR"
                            className="w-full max-w-[140px] mx-auto rounded-xl border-4 border-slate-100 dark:border-slate-700"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Show at pickup
                          </p>
                          <button
                            onClick={() => downloadReceipt(o)}
                            className="btn-secondary w-full mt-2 flex items-center justify-center gap-2 text-xs"
                          >
                            <Download size={14} /> Receipt
                          </button>
                        </>
                      ) : o.paymentStatus === "pending" ? (
                        <>
                          <QrCode
                            size={40}
                            className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                          />
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                            <Clock size={12} /> Awaiting verification
                          </p>
                        </>
                      ) : o.paymentStatus === "rejected" ? (
                        <>
                          <AlertCircle
                            size={40}
                            className="mx-auto text-red-400 mb-2"
                          />
                          <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                            Rejected — contact admin
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ CART DRAWER ============ */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col animate-slide-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                Your Cart
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12">
                  Your cart is empty
                </p>
              ) : (
                cart.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    {c.image && (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Size: {c.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(i, -1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-slate-800 dark:text-white">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(i, 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-bold text-brand-600 dark:text-brand-400 text-sm w-16 text-right">
                      ${(c.price * c.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between mb-4">
                  <span className="text-slate-500 dark:text-slate-400">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={checkout}
                  className="btn-primary w-full py-3"
                >
                  Reserve & Pay
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                  You'll get a QR + UPI details on the next screen
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ PAYMENT MODAL ============ */}
      {createdOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-lg w-full my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                  Complete Payment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pay via UPI and submit proof
                </p>
              </div>
              <button
                onClick={() => setCreatedOrder(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center mb-4">
              <p className="text-xs opacity-80">Amount to pay</p>
              <p className="text-3xl font-bold mt-1">
                ${createdOrder.total.toFixed(2)}
              </p>
              <p className="text-xs opacity-80 mt-2">
                Ref: {createdOrder.referenceId}
              </p>
            </div>

            {/* UPI details */}
            {paymentInfo && (
              <div className="space-y-3 mb-4">
                {paymentInfo.upiId && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      UPI ID
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono font-bold text-slate-800 dark:text-white truncate">
                        {paymentInfo.upiId}
                      </p>
                      <button
                        onClick={() => copy(paymentInfo.upiId)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {paymentInfo.paymentPhone && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Phone size={10} /> Contact admin
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 dark:text-white">
                        {paymentInfo.paymentPhone}
                      </p>
                      <a
                        href={`https://wa.me/${paymentInfo.paymentPhone.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload proof */}
            <div className="mb-4">
              <label className="label">Upload payment screenshot (optional)</label>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-brand-400 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files[0])}
                />
                {proofFile ? (
                  <>
                    <ImgIcon size={20} className="text-brand-600" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                      {proofFile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Click to upload
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="label">Note (optional)</label>
              <input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="input"
                placeholder="e.g., Paid via GPay from 9876543210"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCreatedOrder(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? "Submitting..." : "I've paid — Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ADMIN: ADD PRODUCT MODAL ============ */}
      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onSuccess={() => {
            setShowAddProduct(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ============ ADD PRODUCT MODAL ============
function AddProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    memberPrice: "",
    image: "",
    sizes: ["S", "M", "L", "XL"],
    stock: { S: 10, M: 10, L: 10, XL: 10 },
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const setSizeStock = (size, val) =>
    setForm({ ...form, stock: { ...form.stock, [size]: Number(val) } });

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "skyline-merch");
      const { data } = await API.post("/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, image: data.url }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/products", {
        ...form,
        price: Number(form.price),
        memberPrice: Number(form.memberPrice) || Number(form.price),
      });
      toast.success("Product added! 🎉");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            Add New Product
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Skyline Hoodie"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input resize-none"
              placeholder="Premium navy hoodie with embroidered logo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price ($) *</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Member Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.memberPrice}
                onChange={(e) =>
                  setForm({ ...form, memberPrice: e.target.value })
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Product Image</label>
            <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-brand-400 cursor-pointer transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadImage(e.target.files[0])}
              />
              {uploading ? (
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImgIcon size={20} className="text-slate-400" />
              )}
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {form.image ? "Change image" : "Click to upload"}
              </span>
            </label>
            {form.image && (
              <img
                src={form.image}
                alt="preview"
                className="mt-2 w-full h-32 object-cover rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="label">Stock by Size</label>
            <div className="space-y-2">
              {form.sizes.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-10 font-semibold text-slate-700 dark:text-slate-300">
                    {s}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock[s] ?? 0}
                    onChange={(e) => setSizeStock(s, e.target.value)}
                    className="input flex-1"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}