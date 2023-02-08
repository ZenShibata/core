import { APIChannel, APIMessage, RESTPostAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { Base } from "./Base";

export class BaseChannel extends Base<APIChannel> {
    // TODO: Use Message class.
    public send(options: RESTPostAPIChannelMessageJSONBody): Promise<APIMessage> {
        return this.client.rest.post(Routes.channelMessages(this.id), {
            body: options
        }) as Promise<APIMessage>;
    }
}
