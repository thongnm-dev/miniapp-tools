import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";
import bcrypt from "bcrypt";
import { RegisterCredentials } from "../../types/user";
import { LoginCredentials, User } from "../../types/auth";
import { MenuItem } from "../../types/menu";

export class LoginService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // create a function to login
  async login(credentials: LoginCredentials): Promise<{
    success: boolean, user?: User | null, menuItems?: MenuItem[] | null
  }> {
    let user: User | null = null;
    if (!this.db) {
      return { success: false };
    }

    // First, get the user by username only
    const client = await this.db.getClient();
    const result = await client.query('SELECT id, username, password, email, avatar, role FROM users WHERE username = $1', [credentials.username]);

    if (!result || result.rows.length === 0) {
      this.db.disconnect();
      return { success: false };
    }

    // Compare the provided password with the stored hash
    const storedPasswordHash = result.rows[0].password;
    const isPasswordValid = await bcrypt.compare(credentials.password, storedPasswordHash);

    if (!isPasswordValid) {
      this.db.disconnect();
      return { success: false};
    }

    user = {
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
    };

    const menuResult = await client.query(`
          SELECT 
          menus.id, 
          menus.name AS label, 
          menus.icon, path, 
          menus.order_index,
          menus.parent_id,
          menus.is_active
          FROM 
            menus
          INNER JOIN 
            menu_user 
            ON menus.id = menu_user.menu_id
          WHERE 1 = 1 
            AND menu_user.user_id = $1
            AND menu_user.is_active = true 
            AND menus.is_active = true 
          ORDER BY order_index ASC`, [result.rows[0].id]);

    const menuItems = menuResult?.rows.map((row) => ({
      id: row.id,
      label: row.label,
      icon: row.icon,
      path: row.path,
      order: row.order_index,
      parentId: row.parent_id,
      isActive: row.is_active
    })) as MenuItem[];

    this.db.disconnect();

    return { success: true, user: user, menuItems: menuItems };
  }

  // create a function to register
  async register(credentials: RegisterCredentials): Promise<{
    success: boolean, user?: User | null
  }> {

    try {
    if (!this.db) {
      return { success: false, user: null };
    }

    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const client = await this.db.getClient();
    const result = await client.query(`INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *`, [credentials.username, passwordHash]);
    
    if (result?.rows.length === 0) {
      return { success: false, user: null };
    }

    return { success: true, user: result?.rows[0] };
    } catch (error) {
      return { success: false, user: null };
    } finally {
      this.db.disconnect();
    }
  }
}

export const loginService = new LoginService(new DatabaseService(getDatabaseConfig()));