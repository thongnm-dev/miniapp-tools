import { ipcMain } from "electron";
import { IPC_CHANNEL_HANDLERS } from "../_/ipc-channel-handlers";
import { LoginCredentials } from "../../types/auth";
import { RegisterCredentials } from "../../types/user";
import { loginService } from "../services/login-service";

export const setupLoginHandlers = () => {
    ipcMain.handle(IPC_CHANNEL_HANDLERS.LOGIN, async (_event, credentials: LoginCredentials) => {
        return await loginService.login(credentials);
    });

    ipcMain.handle(IPC_CHANNEL_HANDLERS.REGISTER, async (_event, credentials: RegisterCredentials) => {
        return await loginService.register(credentials);
    });
}