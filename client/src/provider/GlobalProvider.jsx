import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { setOrder } from '../store/orderSlice';

export const GlobalContext = createContext(null);

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state?.user);

    const fetchOrder = async () => {
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken || !user?._id) return;

        try {
            const response = await Axios({ ...SummaryApi.get_order_items });
            const { data: responseData } = response;
            if (responseData.success) {
                dispatch(setOrder(responseData.data));
            }
        } catch (error) {
            if (error?.response?.status !== 401) {
                AxiosToastError(error);
            }
        }
    };

    useEffect(() => {
        const accessToken = localStorage.getItem('accesstoken');
        if (user?._id && accessToken) {
            fetchOrder();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <GlobalContext.Provider
            value={{
                fetchOrder,
                // Stub values for legacy components that reference totalPrice/totalQty/etc.
                totalPrice: 0,
                totalQty: 0,
                notDiscountTotalPrice: 0,
                fetchCartItem: () => {},
                updateCartItem: () => {},
                deleteCartItem: () => {},
                reloadAfterPayment: () => {},
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
