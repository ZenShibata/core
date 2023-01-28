import { Snowflake } from "discord-api-types/v10";

export class Base<RawType> {
    public id: Snowflake;

    public constructor(data: RawType & { id: Snowflake }) {
        this.id = data.id;
    }

    public toJSON(): unknown {
        return {
            id: this.id
        };
    }
}
