import { Message } from "../Message";
import { BaseContextMenuInteraction } from "./BaseContextMenuInteraction";

export class MessageContextMenuInteraction extends BaseContextMenuInteraction {
    public getMessage(): Message | null {
        return this.data.data && "target_id" in this.data.data && "messages" in this.data.data.resolved ? new Message(this.data.data.resolved.messages[this.data.data.target_id], this.client) : null;
    }
}
