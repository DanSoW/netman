import { useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import WithToastify from "src/hoc-helpers/WithToastify";
import { useAppSelector } from "src/hooks/redux.hook";
import IRouteModel from "src/models/IRouteModel";
import BaseRouteConfig from "./configs/base.route";
import BaseRoute from "src/constants/routes/base.route";

/**
 * Хук для получения всех маршрутов
 * @param isAuthenticated Флаг авторизации пользователя
 * @returns {JSX.Element} Функциональный компонент по URL
 */
const useAppRoutes = () => {
    // const authSelector = useAppSelector((s) => s.authReducer);
    const createRoutes = useCallback((routes: IRouteModel[]) => {
        return (
            routes &&
            routes.map((value) => (
                <Route key={value.path} path={value.path} element={<value.element />} />
            ))
        );
    }, []);

    return (
        <Routes>
            {createRoutes(BaseRouteConfig)}
            <Route path="*" element={<Navigate to={BaseRoute.SIGN_IN} />} />
        </Routes>
    );
};

export default WithToastify(useAppRoutes);