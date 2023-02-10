import { APIRole, PermissionFlagsBits } from "discord-api-types/v10";
import { Base } from "./Base";
import { PermissionsBitField } from "./PermissionsBitField";

export class Role extends Base<APIRole> {
    public get name(): string {
        return this.name;
    }

    public get permissions(): PermissionsBitField {
        return new PermissionsBitField(PermissionFlagsBits, this.data.permissions);
    }

    public get managed(): boolean {
        return this.data.managed;
    }

    public get mentionable(): boolean {
        return this.data.mentionable;
    }
}
