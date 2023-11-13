export const auth_default_api = "/auth/management";

const AuthApiConstants = {
    login: `${auth_default_api}/login`,
    oauth: `${auth_default_api}/oauth`,
    logout: `${auth_default_api}/logout`,
    refresh_token: '/auth/refresh/token',
}

export default AuthApiConstants;