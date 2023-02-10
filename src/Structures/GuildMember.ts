import { APIGuildMember } from "discord-api-types/v10";
import { Base } from "./Base";
import { User } from "./User";
import { Role } from "./Role";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";

export class GuildMember extends Base<APIGuildMember> {
    public get nickname(): string | null | undefined {
        return this.data.nick;
    }

    public get roles(): string[] {
        return this.data.roles;
    }

    public get joinedAt(): Date | undefined {
        return this.data.joined_at ? new Date(this.data.joined_at) : undefined;
    }

    public get premiumSince(): Date | undefined {
        return this.data.premium_since ? new Date(this.data.premium_since) : undefined;
    }

    public async resolveRoles(): Promise<Role[]> {
        const keys = await this.client.redis.smembers(`${KeyConstants.ROLE_KEY}${KeyConstants.KEYS_SUFFIX}`);
        const roles = [];

        for (const id of this.data.roles) {
            const role = await this.client.roles.resolve({ id, keys });
            if (role) roles.push(role);
        }
        return roles;
    }

    public async resolveUser(): Promise<User> {
        return this.data.user ? new User(this.data.user, this.client) : this.client.users.fetch({ id: this.data.id });
    }
}
