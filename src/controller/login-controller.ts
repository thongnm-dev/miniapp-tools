import { LoginCredentials } from "../types/auth";
import { RegisterCredentials } from "../types/user";

export class LoginController {
    async login(credentials: LoginCredentials) {
        return await window.loginAPI.login(credentials);
    }

    async register(credentials: RegisterCredentials) {
        return await window.loginAPI.register(credentials);
    }
}

export const loginController = new LoginController();