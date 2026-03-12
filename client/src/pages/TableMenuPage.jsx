import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import {
    FiShoppingCart,
    FiLogOut,
    FiMinus,
    FiPlus,
    FiList,
    FiTrash2,
    FiSend,
} from 'react-icons/fi';
import { MdOutlineKitchen } from 'react-icons/md';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

// Kitchen status badge config
const KITCHEN_STATUS = {
    pending:  { label: 'Chờ bếp',    color: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
    cooking:  { label: 'Đang nấu',   color: 'bg-blue-100 text-blue-700 border border-blue-300' },
    ready:    { label: 'Sẵn sàng',   color: 'bg-green-100 text-green-700 border border-green-300' },
    served:   { label: 'Đã phục vụ', color: 'bg-gray-100 text-gray-500 border border-gray-300' },
};

const TableMenuPage = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);
    const socketRef = useRef(null);

    // localOrder: buffer chọn món tạm thời trước khi gửi (thay thế cart)
    const [localOrder, setLocalOrder] = useState([]);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [showCurrentOrder, setShowCurrentOrder] = useState(false);
    const [tableInfo, setTableInfo] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // -- Socket setup (US20, US23, US24) --
    useEffect(() => {
        const s = io(SOCKET_URL);
        socketRef.current = s;

        // Khi món ready – chef đã nấu xong (US23)
        s.on('dish:ready', (data) => {
            toast(`🍽️ "${data.productName}" tại ${data.tableName} đã sẵn sàng!`, {
                icon: '🔔',
                duration: 6000,
            });
            fetchCurrentOrder();
        });

        // Khi món đã được phục vụ (US24)
        s.on('dish:served', () => {
            fetchCurrentOrder();
        });

        return () => s.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check if user is a table account
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsCheckingAuth(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isCheckingAuth) return;
        if (!user || user.role !== 'TABLE') {
            toast.error('Vui lòng quét mã QR tại bàn để đặt món');
            navigate('/');
            return;
        }
        fetchTableSession();
        fetchCurrentOrder();
    }, [user, navigate, isCheckingAuth]);

    const fetchTableSession = async () => {
        try {
            const response = await Axios({ ...SummaryApi.getTableSession });
            if (response.data.success) setTableInfo(response.data.data);
        } catch (error) {
            console.error('Error fetching table session:', error);
        }
    };

    const fetchCurrentOrder = useCallback(async () => {
        try {
            const response = await Axios({ ...SummaryApi.get_current_table_order });
            if (response.data.success) setCurrentOrder(response.data.data);
        } catch (error) {
            console.error('Error fetching current order:', error);
        }
    }, []);

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await Axios({ ...SummaryApi.get_category });
            if (response.data.success) {
                setCategories(response.data.data);
                if (response.data.data.length > 0) {
                    setSelectedCategory(response.data.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    // Fetch products by category
    const fetchProducts = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_product_by_category,
                data: { id: selectedCategory },
            });
            if (response.data.success) setProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedCategory) fetchProducts();
    }, [selectedCategory, fetchProducts]);

    // -- Local order actions --
    const handleAddToLocalOrder = (product) => {
        setLocalOrder((prev) => {
            const existing = prev.find((item) => item.productId === product._id);
            if (existing) {
                return prev.map((item) =>
                    item.productId === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [
                ...prev,
                {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.image?.[0] || '',
                    quantity: 1,
                    note: '',
                },
            ];
        });
        toast.success(`Đã thêm ${product.name}`);
    };

    const handleLocalQtyChange = (productId, delta) => {
        setLocalOrder((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const handleRemoveLocalItem = (productId) => {
        setLocalOrder((prev) => prev.filter((item) => item.productId !== productId));
    };

    // Gửi đơn lên server (US17) + emit socket to kitchen (US20)
    const handlePlaceOrder = async () => {
        if (localOrder.length === 0) {
            toast.error('Chưa chọn món nào');
            return;
        }
        setIsSubmitting(true);
        try {
            const items = localOrder.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                note: item.note || '',
            }));
            const response = await Axios({
                ...SummaryApi.add_items_to_table_order,
                data: { items, tableNumber: tableInfo?.tableNumber },
            });
            if (response.data.success) {
                toast.success('Đã gọi món! Đơn của bạn đang được xử lý 🍽️');
                setLocalOrder([]);
                setShowCart(false);
                await fetchCurrentOrder();
                setShowCurrentOrder(true);

                // US20 – Emit socket event để bếp nhận đơn realtime
                if (socketRef.current) {
                    socketRef.current.emit('kitchen:send_order', {
                        orderId: response.data.data?.tableOrder?._id,
                        tableId: tableInfo?.tableId,
                        tableName: tableInfo?.tableNumber || 'Bàn',
                        items: localOrder.map((i) => ({ name: i.name, quantity: i.quantity })),
                    });
                }
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error(error.response?.data?.message || 'Không thể gửi đơn');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await Axios({ ...SummaryApi.logoutTable });
            toast.success('Đã đăng xuất');
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const totalAmount = localOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Count items not yet served in currentOrder (US18)
    const activeItemsCount = currentOrder?.items?.filter(
        (i) => i.kitchenStatus !== 'served'
    ).length || 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 sticky top-0 z-40 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {tableInfo?.tableNumber || 'Bàn'}
                        </h1>
                        <p className="text-sm opacity-90">
                            {tableInfo?.tableLocation || 'Nhà hàng EatEase'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Current Order button (US18) */}
                        <button
                            onClick={() => { fetchCurrentOrder(); setShowCurrentOrder(true); }}
                            className="relative bg-white text-blue-500 p-3 rounded-full hover:bg-blue-50 transition-colors"
                            title="Xem đơn gọi món"
                        >
                            <FiList size={22} />
                            {activeItemsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {activeItemsCount}
                                </span>
                            )}
                        </button>
                        {/* Local cart button */}
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative bg-white text-orange-500 p-3 rounded-full hover:bg-orange-50 transition-colors"
                            title="Món đang chọn"
                        >
                            <FiShoppingCart size={22} />
                            {localOrder.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {localOrder.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-orange-500 p-3 rounded-full hover:bg-orange-50 transition-colors"
                            title="Đăng xuất"
                        >
                            <FiLogOut size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-white shadow-sm sticky top-[72px] z-30">
                <div className="max-w-7xl mx-auto overflow-x-auto">
                    <div className="flex gap-2 p-4">
                        {categories.map((category) => (
                            <button
                                key={category._id}
                                onClick={() => setSelectedCategory(category._id)}
                                className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                                    selectedCategory === category._id
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-square bg-gray-100">
                                {product.image?.[0] && (
                                    <img
                                        src={product.image[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                                    {product.name}
                                </h3>
                                <p className="text-orange-500 font-bold text-lg mb-2">
                                    {product.price?.toLocaleString('vi-VN')}đ
                                </p>
                                <button
                                    onClick={() => handleAddToLocalOrder(product)}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors"
                                >
                                    + Thêm
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========================================
                LOCAL CART SIDEBAR (Món đang chọn)
                ======================================== */}
            {showCart && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50"
                    onClick={() => setShowCart(false)}
                >
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Món đã chọn ({localOrder.length})</h2>
                            <button onClick={() => setShowCart(false)} className="text-2xl leading-none">&times;</button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {localOrder.length === 0 ? (
                                <p className="text-center text-gray-500 mt-8">Chưa chọn món nào</p>
                            ) : (
                                <div className="space-y-4">
                                    {localOrder.map((item) => (
                                        <div key={item.productId} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                                <p className="text-orange-500 font-bold">{item.price?.toLocaleString('vi-VN')}đ</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <button onClick={() => handleLocalQtyChange(item.productId, -1)} className="bg-gray-200 text-gray-700 p-1 rounded"><FiMinus /></button>
                                                    <span className="font-semibold text-orange-500 w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => handleLocalQtyChange(item.productId, 1)} className="bg-gray-200 text-gray-700 p-1 rounded"><FiPlus /></button>
                                                    <button onClick={() => handleRemoveLocalItem(item.productId)} className="ml-auto text-red-500"><FiTrash2 /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {localOrder.length > 0 && (
                            <div className="border-t p-4 space-y-3">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span className="text-gray-700">Tổng:</span>
                                    <span className="text-orange-500">{totalAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    <FiSend />
                                    {isSubmitting ? 'Đang gửi...' : 'Gọi món ngay 🍽️'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================
                CURRENT ORDER SIDEBAR (US18 – xem đơn đã gọi + kitchenStatus)
                ======================================== */}
            {showCurrentOrder && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50"
                    onClick={() => setShowCurrentOrder(false)}
                >
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-blue-600 text-white p-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <MdOutlineKitchen size={22} />
                                    <h2 className="text-xl font-bold">Đơn gọi món</h2>
                                </div>
                                <button onClick={() => setShowCurrentOrder(false)} className="text-2xl leading-none">&times;</button>
                            </div>
                            {currentOrder && (
                                <p className="text-sm opacity-80 mt-1">
                                    Bàn: {currentOrder.tableNumber} &bull; {currentOrder.items?.length || 0} món
                                </p>
                            )}
                        </div>

                        {/* Items US18 – hiển thị kitchenStatus */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {!currentOrder?.items?.length ? (
                                <div className="text-center text-gray-500 mt-12">
                                    <FiList size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>Chưa có món nào trong đơn</p>
                                    <p className="text-sm mt-2">Hãy thêm món từ menu và nhấn "Gọi món"!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentOrder.items.map((item, index) => {
                                        const statusCfg = KITCHEN_STATUS[item.kitchenStatus] || KITCHEN_STATUS.pending;
                                        return (
                                            <div key={index} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                                                {/* Image */}
                                                <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.productId?.image?.[0] && (
                                                        <img
                                                            src={item.productId.image[0]}
                                                            alt={item.productId.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate">
                                                        {item.productId?.name || item.name || 'Món ăn'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        x{item.quantity} &bull; {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                                                    </p>
                                                    {item.note && (
                                                        <p className="text-xs text-yellow-600 mt-0.5">📝 {item.note}</p>
                                                    )}
                                                </div>
                                                {/* Kitchen status badge */}
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer – Tổng + Thanh toán */}
                        {currentOrder?.items?.length > 0 && (
                            <div className="border-t p-4 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tổng số lượng:</span>
                                    <span className="font-semibold">
                                        {currentOrder.items.reduce((s, i) => s + i.quantity, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-blue-800">Tổng cộng:</span>
                                    <span className="text-blue-600">
                                        {currentOrder.total?.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCurrentOrder(false);
                                        navigate('/table-order-management');
                                    }}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                                >
                                    💳 Thanh toán
                                </button>
                                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <span>ℹ️</span>
                                    <span>Bạn có thể tiếp tục gọi thêm món. Thanh toán khi dùng xong.</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableMenuPage;
