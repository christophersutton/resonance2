import { Database } from "bun:sqlite";
import { BaseRepository } from "./base";
import type { BaseRow } from "../types/rows";
import type { User } from "../../../../shared/src/types/entities";

export class UserRow implements BaseRow {
  id!: number;
  email!: string;
  role!: string;
  last_login!: string | null;
  magic_link_token!: string | null;
  magic_link_expires!: string | null;
  created_at!: string;
}

export class UserRepository extends BaseRepository<UserRow, User> {
  constructor(db: Database) {
    super(db, 'users');
  }

  protected get rowType() {
    return UserRow;
  }

  protected mapToEntity(row: UserRow): User {
    return {
      id: Number(row.id),
      email: row.email,
      role: row.role,
      lastLogin: row.last_login,
      magicLinkToken: row.magic_link_token,
      magicLinkExpires: row.magic_link_expires,
      createdAt: row.created_at
    };
  }

  protected mapFromEntity(entity: Partial<Omit<User, 'id' | 'createdAt'>>): Partial<UserRow> {
    const mapped: Partial<UserRow> = {};
    
    if ('email' in entity) mapped.email = entity.email;
    if ('role' in entity) mapped.role = entity.role;
    if ('lastLogin' in entity) mapped.last_login = entity.lastLogin;
    if ('magicLinkToken' in entity) mapped.magic_link_token = entity.magicLinkToken;
    if ('magicLinkExpires' in entity) mapped.magic_link_expires = entity.magicLinkExpires;
    
    return mapped;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log('Searching for user by email:', email);
    const row = await this.db
      .query("SELECT * FROM users WHERE email = ?")
      .get(email) as UserRow | null;
    
    return row ? this.mapToEntity(row) : null;
  }

  async findByMagicLinkToken(token: string): Promise<User | null> {
    return this.db
      .query(
        "SELECT * FROM users WHERE magic_link_token = ? AND magic_link_expires > datetime('now')"
      )
      .get(token) as User | null;
  }

  async createUser(email: string, role: string = "user"): Promise<User> {
    const result = this.db
      .query(
        "INSERT INTO users (email, role) VALUES (?, ?) RETURNING *"
      )
      .get(email, role) as User;

    return result;
  }

  async setMagicLinkToken(
    email: string,
    token: string,
    expiresIn: number = 30 // minutes
  ): Promise<void> {
    this.db
      .query(
        `UPDATE users 
         SET magic_link_token = ?,
             magic_link_expires = datetime('now', '+' || ? || ' minutes')
         WHERE email = ?`
      )
      .run(token, expiresIn.toString(), email);
  }

  async clearMagicLinkToken(userId: number): Promise<void> {
    this.db
      .query(
        "UPDATE users SET magic_link_token = NULL, magic_link_expires = NULL WHERE id = ?"
      )
      .run(userId);
  }

  async updateLastLogin(userId: number): Promise<void> {
    this.db
      .query("UPDATE users SET last_login = datetime('now') WHERE id = ?")
      .run(userId);
  }
}
