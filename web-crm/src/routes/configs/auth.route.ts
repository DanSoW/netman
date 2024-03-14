import BaseRoute from "src/constants/routes/base.route";
import IRouteModel from "src/models/IRouteModel";
import SignInPage from "src/containers/Auth/SignInPage";

const AuthRouteConfig: IRouteModel[] = [
    {
        // URL: /auth/sign-in
        path: BaseRoute.SIGN_IN,
        element: SignInPage
    }
];

export default AuthRouteConfig;