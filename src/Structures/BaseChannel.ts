import { APIChannel, RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";
import { Base } from "./Base";
import { Message } from "./Message";

export class BaseChannel extends Base<APIChannel> {
    public async send(options: RESTPostAPIChannelMessageJSONBody): Promise<Message> {
        return this.client.sendMessage(options, this.id);
    }
}
