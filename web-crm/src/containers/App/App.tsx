import { FC } from "react";
import styles from "./App.module.scss";
import useAppRoutes from "src/routes/useAppRoutes";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";


const App: FC<any> = () => {

    // @ts-ignore
    const routes = useAppRoutes();

    return (
        <>
            <BrowserRouter>
                {routes}
                <ToastContainer
                    position="bottom-right"
                    autoClose={2000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </BrowserRouter>
        </>
    );
};

export default App;
