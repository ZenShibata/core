import { APIChannel, APIMessage, RESTPostAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { Base } from "./Base";
import { Message } from "./Message";

export class BaseChannel extends Base<APIChannel> {
    public async send(options: RESTPostAPIChannelMessageJSONBody): Promise<Message> {
        return this.client.rest.post(Routes.channelMessages(this.id), {
            body: options
        }).then(x => new Message(x as APIMessage, this.client));
    }
}
