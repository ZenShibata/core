import { Snowflake } from "discord-api-types/v10";
import { Client } from "./Client";

export class Base<RawType> {
    public id: Snowflake;

    public constructor(
        protected readonly data: RawType & { id: Snowflake },
        public client: Client
    ) {
        this.id = data.id;
    }

    public toJSON(): unknown {
        return {
            id: this.id
        };
    }
}
